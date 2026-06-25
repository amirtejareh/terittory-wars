# Territory Wars / جنگ قلمروها

A mobile-first tactical territory-control game scaffolded as a TypeScript monorepo.

## Packages

- `@territory-wars/game-engine`: pure rules, combat, turns, resources, heroes, and AI.
- `@territory-wars/mobile`: Expo SDK 56 + React Native + Skia.
- `@territory-wars/telegram`: React + PixiJS Telegram Mini App.
- `@territory-wars/server`: Node.js API for Telegram auth, match validation, shop, and Stars webhooks.

## Commands

```sh
npm install
npm run dev:mobile
npm run dev:telegram
npm run dev:server
npm test
npm run typecheck
```

## GitHub

This project is local-only until you connect a remote. After creating a GitHub repository:

```sh
cd territory-wars
git init
git remote add origin <your-github-repo-url>
git add .
git commit -m "Create Territory Wars monorepo"
git push -u origin main
```

## Notes

Expo code must follow the versioned SDK 56 docs. The relevant SDK baseline is Expo `~56`, React Native `0.85`, React `19.2.3`, and Skia bundled version `2.6.2`.

