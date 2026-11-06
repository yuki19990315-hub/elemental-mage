# Guidance for coding assistants

This is a standalone mobile portrait top-down bullet-hell roguelite project. Read `docs/GAME_DESIGN.md` and `docs/TECHNICAL_PLAN.md` first.

Canonical user requirements: 2 simultaneous elemental equips, 3 attack buttons (element 1, element 2, their fusion), translucent joystick on left and attack controls on right, projectiles fired in facing direction, randomized dungeon rooms, enemy bullet patterns, multiple bosses, guaranteed two-item choice immediately before boss (choose only one), extensible architecture.

Do not silently turn proposed values (enemy counts, element choices, cooldown, room count, engine) into guaranteed requirements. Preserve character / enemies / bullets / environment as separate RGBA PNGs. `tools/generate_art.py` is a reproducible starter only, not polished production art. Separate static `assets/previews/mobile_mockup.png` from actual gameplay captures. Any unimplemented feature should remain marked as such.

Before changing content: run `python tools/validate.py`; for JS: run `node --check prototype/game.js`. Do not modify an unrelated repository.