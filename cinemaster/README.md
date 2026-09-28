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
