# PopCard

Jeu de cartes à collectionner sur l'univers des films et séries : personnages (CHAR), lieux cultes (LIEU) et objets cultes (OBJET).

```bash
cd cinemaster
npm install
npm run dev
```

## Raretés

| Symbole | Rareté | Effet |
|---|---|---|
| ● | Commune | Cadre classique |
| ◆ | Peu commune | Cadre classique |
| ★ | Rare | Reverse holo (le cadre brille) |
| ★H | Holo Rare | Illustration holographique |
| ★★ | Full Art | Illustration pleine carte, arc-en-ciel + paillettes |
| ★★★ | Secrète Gold | Feuille d'or, numérotée au-delà du total |

Booster de 5 cartes : 3 communes/peu communes, 1 peu commune/rare, 1 emplacement rare
(rare 62 % · holo 25 % · full art 10 % · gold 3 %). Un booster gratuit toutes les 2 h (max 6),
ou 20 🎞️ pellicules obtenues en recyclant les doublons.

## Ajouter des cartes

Tout est dans `src/data/cards.js`. Pour ajouter une vraie illustration, dépose l'image dans
`public/cards/` et ajoute `image: '/cards/mon-image.jpg'` à la carte.

## Déploiement Vercel

1. Sur vercel.com : **Add New… → Project**, importe le dépôt `jotoutcourt/journey`.
2. **Root Directory** : `cinemaster` (le reste est lu dans `cinemaster/vercel.json`).
3. **Production Branch** (Settings → Git) : la branche qui contient PopCard.
4. Deploy.

Sur Vercel, l'Atelier fonctionne en mode local : les images déposées restent
sur l'appareil. Le partage des images de l'admin avec tous les joueurs n'existe
que sur la page publiée sur claude.ai.

## Appli installable

Sur le site Vercel, PopCard s'installe comme une appli :
- **iPhone** (Safari) : bouton Partager → **Sur l'écran d'accueil** ;
- **Android** (Chrome) : menu ⋮ → **Installer l'application**.

Elle s'ouvre alors en plein écran et fonctionne hors connexion.

## Comptes, sauvegarde en ligne et échanges (Supabase)

Le projet Supabase est déjà renseigné dans `src/lib/cloud.js` (clés publiques ;
on peut les remplacer par `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`).
À faire une seule fois dans le tableau de bord Supabase :

1. **SQL Editor → New query** : coller tout `supabase/schema.sql`, puis **Run**.
2. **Authentication → Emails → Templates → Magic Link** : ajouter le code dans
   le message, par exemple `<p>Ton code PopCard : <b>{{ .Token }}</b></p>`.
   (L'appli se connecte avec ce code à 6 chiffres : un lien ne marcherait pas
   dans l'appli installée sur iPhone.)
3. **Authentication → URL Configuration → Site URL** : l'adresse Vercel.

Les comptes ne fonctionnent que sur le site / l'appli installée, pas dans
l'aperçu claude.ai.
