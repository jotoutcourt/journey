# Culto

Une appli « à la Duolingo » pour la culture générale : 5 minutes par jour pour briller en société.

- **10 thèmes, 30 leçons, 180 questions** : peinture, histoire, littérature, philosophie,
  musique classique, sciences, géographie, mythologie, vin & gastronomie, expressions.
- Chaque leçon : des fiches « À savoir », 6 questions (choix multiple, vrai/faux,
  phrase à trous, paires à associer, remise dans l'ordre) et une **phrase pour briller**.
- XP, série de jours 🔥, vies ❤️ (une revient toutes les 20 min), objectif quotidien,
  niveaux, succès, défi du jour, révision des erreurs, carnet des anecdotes à partager.
- Appli installable (PWA) qui marche hors connexion. Progression enregistrée sur le téléphone.

## Lancer

```bash
npm install
npm run dev      # développement
npm run build    # version de production dans dist/
```

## Ajouter du contenu

Tout le contenu est dans `src/data/themes.js`. Pour les questions à choix (`qcm`, `gap`),
la bonne réponse est toujours la **première** de la liste : l'appli mélange à l'affichage.

## Déployer sur Vercel

Nouveau projet Vercel sur ce dépôt, avec **Root Directory = `culto`** (framework Vite détecté).
