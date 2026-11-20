// Règlement d'un duel : bonus, primes et mise à jour de la progression du joueur.
// Fonctions pures : utilisées pour les duels en direct comme pour les défis différés.
import { leaderboard } from './bots.js'
import { myPeriodXp, PERIODS } from './periods.js'
import { meEntry } from './profile.js'
import { dayKey } from './tower.js'

// Prime d'exploit selon le rang mondial de l'adversaire battu (une fois par adversaire et par jour).
export const exploitFor = (rank) => (!rank ? 0 : rank === 1 ? 150 : rank <= 3 ? 100 : rank <= 10 ? 50 : 0)
export const DEFENSE_BONUS = 30

// Rangs du joueur dans les trois classements d'un thème, à partir de ses statistiques.
export function ranksFor(profile, topic, stats) {
  const meRow = { ...meEntry(profile), allXp: stats?.xp || 0 }
  return Object.fromEntries(PERIODS.map(p => {
    const rows = leaderboard(topic, meRow, myPeriodXp(stats, p.id), p.id)
    return [p.id, rows.find(x => x.isMe).rank]
  }))
}

// Applique le résultat d'un duel à l'état du joueur. Renvoie le nouvel état et les données de l'écran de résultats.
export function settleDuel(st, { topic, opponent, myScore, oppScore, log, questions, ranks, now = Date.now() }) {
  const outcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw'
  const allRight = log.me.length === questions.length && log.me.every(m => m && m.pts > 0)
  const today = dayKey(new Date(now))
  const exploitKey = opponent.id
  const exploitTaken = st.exploits?.[exploitKey] === today
  const exploitPossible = outcome === 'win' ? exploitFor(ranks?.opp) : 0
  const bonuses = {
    finish: 40,
    victory: outcome === 'win' ? 100 : outcome === 'draw' ? 50 : 0,
    perfect: allRight ? 30 : 0,
    exploit: exploitTaken ? 0 : exploitPossible,
    defense: outcome === 'win' && ranks?.me <= 10 ? DEFENSE_BONUS : 0,
  }
  const total = myScore + bonuses.finish + bonuses.victory + bonuses.perfect + bonuses.exploit + bonuses.defense

  const prev = st.topicStats[topic.id] || { xp: 0, played: 0, wins: 0, seen: [] }
  const seen = [...new Set([...(prev.seen || []), ...questions.map(q => q.idx)])]
  const xpLog = [...(prev.log || []).filter(e => now - e.at < 40 * 86400000), { at: now, xp: total }]
  const mineLog = log.me.filter(Boolean)
  const answered = mineLog.filter(m => m.choice >= 0)
  const next = {
    ...prev, xp: prev.xp + total, played: prev.played + 1, seen, log: xpLog,
    wins: prev.wins + (outcome === 'win' ? 1 : 0), draws: (prev.draws || 0) + (outcome === 'draw' ? 1 : 0),
    tracked: (prev.tracked || 0) + 1, scoreSum: (prev.scoreSum || 0) + myScore,
    asked: (prev.asked || 0) + questions.length, correct: (prev.correct || 0) + mineLog.filter(m => m.pts > 0).length,
    answered: (prev.answered || 0) + answered.length, timeSum: (prev.timeSum || 0) + answered.reduce((t, m) => t + m.t, 0),
  }
  const newRanks = ranksFor(st.profile, topic, next)

  const state = {
    ...st,
    xp: st.xp + total,
    topicStats: { ...st.topicStats, [topic.id]: next },
    exploits: bonuses.exploit ? { ...(st.exploits || {}), [exploitKey]: today } : st.exploits,
    history: [{ topicId: topic.id, topicName: topic.name, oppName: opponent.name, oppAvatar: opponent.avatar, champion: opponent.champion, ai: !!opponent.ai, myScore, oppScore, outcome, at: now }, ...st.history].slice(0, 30),
  }
  const data = {
    outcome, myScore, oppScore, opponent, topicId: topic.id, bonuses, total,
    exploitMissed: exploitTaken && exploitPossible > 0,
    before: prev.xp, after: next.xp, log, questions, ranks: newRanks, ranksBefore: ranks,
  }
  return { state, data }
}
