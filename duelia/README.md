# Duelia

Duels de quiz en 7 questions : réponds juste **et** vite.

- 20 points par bonne réponse, 2 de moins par seconde écoulée ; dernière question ×2
- Bonus d'arrivée (+40), de victoire (+100, +50 en cas d'égalité), sans-faute (+30)
- Niveaux par thème et niveau global, classement par thème avec son champion à défier
- Thèmes officiels + thèmes créés par les joueurs, partageables par lien (`#t=…`)

```bash
cd duelia
npm install
npm run dev
```

Pour l'instant, les adversaires sont simulés (chaque thème a sa communauté stable, plus ou moins forte)
et la progression est stockée dans le navigateur. Étape suivante : un backend temps réel
(Supabase Realtime par exemple) pour les vrais duels en ligne, les thèmes partagés et les classements mondiaux.
