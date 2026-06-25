# Territory Wars Architecture

Territory Wars is split into four packages:

- `packages/game-engine`: pure TypeScript rules, board state, combat, rewards, and bot decisions. No React, DOM, Expo, PixiJS, storage, or network dependencies.
- `packages/mobile`: Expo SDK 56 mobile app for Android and iOS. It renders the battle board with React Native and Skia, and consumes the engine package.
- `packages/telegram`: React + PixiJS Telegram Mini App. It uses Telegram `initData`, opens Stars invoices, and consumes the same engine package.
- `packages/server`: Node.js API that validates Telegram users, creates Stars invoice links, validates matches, grants rewards, and handles payment webhooks.

The important boundary is the engine. Clients can predict and animate locally, but the server must validate rewards and paid inventory. Ranked rewards should never trust a client-submitted result without replaying or validating the move log.

## Deployment Opinion

Vercel is a good first deployment target for the Telegram Mini App because it can host the Vite build and expose `/api/*` serverless functions from the same domain. That keeps Telegram Mini App setup simple and avoids CORS noise while the MVP is still small.

For real-time multiplayer, move match orchestration to a long-lived service later. The first MVP can use bot opponents plus server-authoritative result validation.

