// PopCard : envoie « Tes boosters sont prêts ! » aux appareils dont la
// réserve de boosters est pleine (voir supabase/push.sql).
// Appelée toutes les 5 minutes par pg_cron. Sans effet si rien n'est dû :
// elle peut donc être appelée par n'importe qui (« Verify JWT » désactivé).
//
// Secrets à renseigner (Edge Functions → Secrets) :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

webpush.setVapidDetails(
  'https://popcard-theta.vercel.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MESSAGE = JSON.stringify({
  title: 'Tes boosters sont prêts !',
  body: 'Ta réserve est pleine : viens ouvrir tes 6 boosters.',
  tag: 'boosters',
  url: '/',
})

Deno.serve(async () => {
  const { data, error } = await db
    .from('push_subs')
    .select('endpoint, sub, full_at')
    .is('notified_at', null)
    .lte('full_at', new Date().toISOString())
    .limit(500)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  let sent = 0
  let gone = 0
  await Promise.all((data ?? []).map(async row => {
    try {
      await webpush.sendNotification(row.sub, MESSAGE, { TTL: 6 * 3600, urgency: 'normal' })
      sent++
      await db.from('push_subs').update({ notified_at: new Date().toISOString() })
        .eq('endpoint', row.endpoint).eq('full_at', row.full_at)
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      // abonnement expiré ou retiré : on l'oublie
      if (status === 404 || status === 410) {
        gone++
        await db.from('push_subs').delete().eq('endpoint', row.endpoint)
      } else {
        console.error('push', status, (e as Error).message)
      }
    }
  }))
  return Response.json({ due: data?.length ?? 0, sent, gone })
})
