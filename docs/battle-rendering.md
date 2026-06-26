# Battle Rendering Plan

The battle screen should become data-driven in three layers:

1. **Static frame art**
   - Use the very raw battle frame as the base background.
   - This image should keep decorative UI frames, board frame, empty portrait circles, button frames, and empty text slots.
   - It should not contain player names, timer text, mana numbers, trophy counts, turn labels, selected tile glow, or tile ownership colors.

2. **Server snapshot**
   - The server returns a battle bootstrap payload from `/api/battle/bootstrap`.
   - The payload contains the canonical `GameState`, a compact `snapshot` for UI labels, and asset ids.
   - Mobile and Telegram both use this payload first, then fall back to local bot state when the API is unavailable.

3. **Client renderers**
   - Mobile uses `BattleArtwork` with React Native overlays.
   - Telegram uses `BattleArtwork` with HTML/CSS overlays.
   - Both read shared board and hotspot coordinates from `@territory-wars/game-engine`.

## Next Asset Split

The current `battle-empty.png` still contains some baked text and icons. For the real dynamic screen, add this file:

```txt
packages/mobile/assets/boards/battle-raw.png
```

Recommended contents:

- Decorative frame and empty board
- Empty player portrait frames
- Empty name/stat plaques
- Empty timer plaque
- Empty action button frames
- Empty bottom nav frames

Keep these dynamic and rendered by the clients:

- Player names and avatars
- HP, mana, trophy, level, timer, turn text
- Tile owner color overlays
- Selected tile and legal move highlights
- End turn label and ability labels
- Shop/purchase state

