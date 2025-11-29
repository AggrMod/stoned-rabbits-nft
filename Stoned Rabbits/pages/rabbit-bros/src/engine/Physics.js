export class Physics {
    constructor() {
        // Tuned Constants for NES-like feel
        this.gravity = 0.4;
        this.friction = 0.85;
        this.acceleration = 0.2;
        this.jumpForce = -7.5;
        this.maxSpeed = 2.5;
        this.maxFallSpeed = 8.0;
    }

    applyGravity(entity, input) {
        // Variable Jump Height
        // If holding jump and moving up, gravity is lower (floaty)
        // If falling or not holding jump, gravity is normal
        let g = this.gravity;
        if (input && input.isPressed('A') && entity.vy < 0) {
            g = this.gravity * 0.5;
        }

        entity.vy += g;
        if (entity.vy > this.maxFallSpeed) {
            entity.vy = this.maxFallSpeed;
        }
    }

    applyFriction(entity) {
        entity.vx *= this.friction;
        if (Math.abs(entity.vx) < 0.05) {
            entity.vx = 0;
        }
    }

    update(entity, level) {
        // 1. X Axis Movement & Collision
        entity.x += entity.vx;
        this.handleCollision(entity, level, true);

        // 2. Y Axis Movement & Collision
        entity.grounded = false; // Reset grounded state
        entity.y += entity.vy;
        this.handleCollision(entity, level, false);

        // 3. Screen Boundaries
        if (entity.x < 0) entity.x = 0;
        if (entity.y > 240) { // Pit Death
            entity.dead = true;
        }
    }

    handleCollision(entity, level, isXAxis) {
        // Calculate Entity Bounds
        // Note: We use a slightly smaller hitbox for physics to prevent snagging
        const bounds = {
            x: entity.x,
            y: entity.y,
            w: entity.width,
            h: entity.height
        };

        // Check for overlaps with solid tiles
        if (this.checkOverlap(bounds, level)) {
            if (isXAxis) {
                // Resolve X
                if (entity.vx > 0) { // Moving Right
                    // Snap to left edge of tile
                    const tileX = Math.floor((entity.x + entity.width) / 16);
                    entity.x = (tileX * 16) - entity.width;
                } else if (entity.vx < 0) { // Moving Left
                    // Snap to right edge of tile
                    const tileX = Math.floor(entity.x / 16);
                    entity.x = (tileX + 1) * 16;
                }
                entity.vx = 0;
            } else {
                // Resolve Y
                if (entity.vy > 0) { // Falling
                    // Snap to top of tile
                    const tileY = Math.floor((entity.y + entity.height) / 16);
                    entity.y = (tileY * 16) - entity.height;
                    entity.grounded = true;
                } else if (entity.vy < 0) { // Jumping
                    // Snap to bottom of tile
                    const tileY = Math.floor(entity.y / 16);
                    entity.y = (tileY + 1) * 16;

                    // Trigger Block Hit
                    const centerX = entity.x + entity.width / 2;
                    const gridX = Math.floor(centerX / 16);
                    const gridY = tileY; // The tile we hit
                    if (level.hitTile) level.hitTile(gridX, gridY, entity);
                }
                entity.vy = 0;
            }
        }
    }

    checkOverlap(rect, level) {
        // Convert rect to grid coordinates
        const startX = Math.floor(rect.x / 16);
        const endX = Math.floor((rect.x + rect.w - 0.01) / 16);
        const startY = Math.floor(rect.y / 16);
        const endY = Math.floor((rect.y + rect.h - 0.01) / 16);

        // Check every tile in the range
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // Bounds check
                if (y >= 0 && y < level.height && x >= 0 && x < level.width) {
                    const tile = level.grid[y][x];
                    if (tile && tile.solid) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isColliding(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    isOnGround(entity, level) {
        // Check 1 pixel below the entity
        const bounds = {
            x: entity.x,
            y: entity.y + 1,
            w: entity.width,
            h: entity.height
        };
        return this.checkOverlap(bounds, level);
    }
}
