export class Level {
    constructor() {
        this.width = 220; // World 1-1 length
        this.height = 15;
        this.tileSize = 16;
        this.grid = [];
        this.onSpawn = null;

        // Initialize Empty Grid
        for (let y = 0; y < this.height; y++) {
            this.grid.push(new Array(this.width).fill(null));
        }

        // --- Level Generation ---

        // 1. Ground (Floor)
        for (let x = 0; x < this.width; x++) {
            // Pits at: 69-70, 86-88, 153-154
            if ((x >= 69 && x <= 70) || (x >= 86 && x <= 88) || (x >= 153 && x <= 154)) {
                continue;
            }
            this.grid[13][x] = { type: 0, palette: 0, solid: true }; // Ground Top
            this.grid[14][x] = { type: 0, palette: 0, solid: true }; // Ground Bottom
        }

        // 2. Helper to place blocks
        const placeBlock = (x, y, type = 2) => {
            if (x < this.width && y < this.height) {
                this.grid[y][x] = { type: type, palette: 1, solid: true };
            }
        };
        const placePipe = (x, height) => {
            for (let h = 0; h < height; h++) {
                placeBlock(x, 12 - h, 2); // Left side pipe (using block for now)
                placeBlock(x + 1, 12 - h, 2); // Right side pipe
            }
        };

        // 3. Structures

        // First ? Block
        placeBlock(16, 9, 3); // Chest as ? block

        // First Brick/Question Formation
        placeBlock(20, 9, 2); placeBlock(21, 9, 3); placeBlock(22, 9, 2); placeBlock(23, 9, 3); placeBlock(24, 9, 2);
        placeBlock(22, 5, 3); // Top ? block

        // Pipes
        placePipe(28, 2);
        placePipe(38, 3);
        placePipe(46, 4);
        placePipe(57, 4); // 4th pipe (exit pipe)

        // Hidden 1-Up Area (approx)
        placeBlock(64, 8, 3); // Hidden block (visible for now)

        // Brick Row with Goombas
        for (let i = 77; i <= 84; i++) placeBlock(i, 9, 2); // Bricks
        for (let i = 80; i <= 87; i++) placeBlock(i, 5, 2); // Top row

        // Starman Area
        placeBlock(94, 9, 2); placeBlock(94, 5, 3);
        placeBlock(100, 9, 2); // Star brick
        placeBlock(101, 9, 3);
        placeBlock(106, 9, 3); placeBlock(109, 9, 3); placeBlock(112, 9, 3);
        placeBlock(109, 5, 3);

        // Staircase 1
        for (let i = 0; i < 4; i++) {
            for (let h = 0; h <= i; h++) placeBlock(134 + i, 12 - h, 2);
        }
        // Staircase 2
        for (let i = 0; i < 4; i++) {
            for (let h = 0; h <= i; h++) placeBlock(140 + (3 - i), 12 - h, 2);
        }

        // Staircase 3 (Big one)
        for (let i = 0; i < 8; i++) {
            for (let h = 0; h <= i; h++) placeBlock(181 + i, 12 - h, 2);
        }

        // Flagpole Base (Removed to avoid confusion with ship)
        // placeBlock(198, 12, 2);
    }

    isSolid(x, y) {
        // Convert pixel coords to grid coords
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        // Out of bounds check
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }

        const tile = this.grid[gridY][gridX];
        return tile && tile.solid;
    }

    hitTile(x, y, entity) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        const tile = this.grid[y][x];
        if (!tile) return;

        // Chest Interaction (ID 3)
        if (tile.type === 3) {
            tile.type = 4; // Open Chest
            if (this.onSpawn) {
                this.onSpawn(x * 16, y * 16, 'powerup');
                this.onSpawn(x * 16, y * 16, 'particles');
            }
        }

        // Brick Interaction (ID 2)
        if (tile.type === 2) {
            if (entity && entity.isBig) {
                // Break Brick
                this.grid[y][x] = null; // Remove tile
                if (this.onSpawn) {
                    this.onSpawn(x * 16, y * 16, 'particles'); // Debris
                }
            } else {
                // TODO: Bump Brick (Visual only)
            }
        }
    }

    draw(ppu, scrollX = 0) {
        const startCol = Math.floor(scrollX / this.tileSize);
        const endCol = startCol + 17; // Draw 16 columns + 1 buffer

        for (let y = 0; y < this.height; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (x < 0 || x >= this.width) continue;

                const tile = this.grid[y][x];
                if (tile) {
                    // Draw shifted by scrollX
                    ppu.renderTile(tile.type, (x * this.tileSize) - scrollX, y * this.tileSize, tile.palette);
                }
            }
        }

    }
}
