# Super Rabbit Bros: Physics & Controls Refactor Plan

## Objective
Eliminate "falling through bricks" bugs and fix "messed up" jump controls by rewriting the core physics engine and player controller from the ground up.

## Phase 1: Core Physics Engine Rewrite (`src/engine/Physics.js`)
The current physics engine suffers from "tunneling" (moving too fast through thin blocks) and unstable ground detection.

- [ ] **Implement AABB vs Tilemap Solver**:
    - Replace the "Four Corner" check with a robust "Sweep" approach.
    - **X-Axis Resolution**: Move X -> Check Collision -> Correct Position -> Stop Velocity.
    - **Y-Axis Resolution**: Move Y -> Check Collision -> Correct Position -> Stop Velocity -> Set Grounded.
- [ ] **Fix Tunneling (Sub-stepping)**:
    - If velocity > tile_size (16px), break movement into smaller steps to ensure we don't skip over solid tiles.
- [ ] **Standardize Gravity & Drag**:
    - Tune constants for a "snappy" NES-style feel (high gravity, high jump force).

## Phase 2: Player Controller Overhaul (`src/game/Entities.js`)
The jump feels unresponsive because it likely requires frame-perfect inputs. We will add "Game Feel" mechanics.

- [ ] **Jump Buffering**:
    - If the player presses 'A' slightly *before* hitting the ground, remember it and execute the jump immediately upon landing.
- [ ] **Coyote Time**:
    - Allow the player to jump for a few frames *after* walking off a ledge.
- [ ] **Variable Jump Height**:
    - Ensure short hops (tap 'A') and high jumps (hold 'A') work consistently with Touch controls.
- [ ] **Hitbox Standardization**:
    - Hardcode the Player Hitbox to **20x24** (slightly narrower than visual) to prevent getting stuck on walls.

## Phase 3: Input & Integration (`src/engine/Input.js` & `src/main.js`)
- [ ] **Touch Latching**: Ensure touch inputs are held for at least 1 frame to prevent dropped inputs.
- [ ] **Debug Visualization**: Add a toggle to draw the actual hitboxes (Red Box) vs the Sprites to verify alignment.

## Execution Order
1.  Rewrite `Physics.js`.
2.  Refactor `Player` class in `Entities.js`.
3.  Tune Constants.
4.  Verify with Debug Mode.
