export class PPU {
    constructor(ctx, sheets) {
        this.ctx = ctx;
        this.sheets = sheets; // Object: { main: img, enemies: img2, ... }

        // Sprite Definitions
        this.spriteMap = {
            // Captain Rabbit (New Sheet)
            'player_idle': [
                { sheet: 'player_idle', x: 36, y: 48, w: 450, h: 450 },
                { sheet: 'player_idle', x: 554, y: 42, w: 450, h: 450 },
                { sheet: 'player_idle', x: 36, y: 552, w: 450, h: 450 },
                { sheet: 'player_idle', x: 550, y: 554, w: 450, h: 450 }
            ],
            'player_run': [
                { sheet: 'player_run', x: 3, y: 36, w: 256, h: 450 },
                { sheet: 'player_run', x: 252, y: 35, w: 256, h: 450 },
                { sheet: 'player_run', x: 506, y: 36, w: 256, h: 450 },
                { sheet: 'player_run', x: 761, y: 36, w: 256, h: 450 },
                { sheet: 'player_run', x: 11, y: 497, w: 256, h: 450 },
                { sheet: 'player_run', x: 268, y: 490, w: 256, h: 450 },
                { sheet: 'player_run', x: 512, y: 496, w: 256, h: 450 },
                { sheet: 'player_run', x: 772, y: 502, w: 256, h: 450 }
            ],
            'player_jump': [
                { sheet: 'player_jump', x: 36, y: 48, w: 450, h: 450 },
                { sheet: 'player_jump', x: 554, y: 42, w: 450, h: 450 },
                { sheet: 'player_jump', x: 36, y: 552, w: 450, h: 450 },
                { sheet: 'player_jump', x: 550, y: 554, w: 450, h: 450 }
            ],
            'player_fight': [
                { sheet: 'player', x: 0, y: 618, w: 180, h: 180 },
                { sheet: 'player', x: 0, y: 424, w: 180, h: 180 },
                { sheet: 'player', x: 330, y: 428, w: 180, h: 180 },
                { sheet: 'player', x: 500, y: 238, w: 180, h: 180 }
            ],
            'player_die': [
                { sheet: 'player', x: 146, y: 816, w: 180, h: 180 },
                { sheet: 'player', x: 0, y: 814, w: 180, h: 180 },
                { sheet: 'player', x: 154, y: 816, w: 180, h: 180 },
                { sheet: 'player', x: 342, y: 808, w: 250, h: 183 }
            ],

            // Enemies
            'goomba_walk': [
                { sheet: 'main', x: 428, y: 111, w: 64, h: 64 },
                { sheet: 'main', x: 583, y: 114, w: 64, h: 64 }
            ],

            // Items
            'mushroom': { sheet: 'main', x: 534, y: 757, w: 67, h: 68 },

            // Tiles
            'tile_ground': { sheet: 'main', x: 143, y: 633, w: 100, h: 50 },
            'tile_block': { sheet: 'main', x: 143, y: 633, w: 100, h: 50 },
            'tile_chest': { sheet: 'main', x: 421, y: 617, w: 84, h: 72 },
            'tile_chest_open': { sheet: 'main', x: 512, y: 597, w: 98, h: 101 }
        };

        this.palettes = {
            0: 'rgba(138, 43, 226, 0.3)',
            1: 'rgba(0, 255, 127, 0.3)',
            2: 'rgba(255, 215, 0, 0.3)', // Gold tint for chests
        };
    }

    renderTile(tileId, x, y, paletteId) {
        let sprite = this.spriteMap['tile_ground'];
        if (tileId === 2) sprite = this.spriteMap['tile_block'];
        if (tileId === 3) sprite = this.spriteMap['tile_chest'];
        if (tileId === 4) sprite = this.spriteMap['tile_chest_open'];

        if (sprite) {
            const sheetName = sprite.sheet || 'main';
            const img = this.sheets[sheetName];
            if (!img || !img.complete) return;

            this.ctx.drawImage(img, sprite.x, sprite.y, sprite.w, sprite.h, x, y, 16, 16);

            const color = this.palettes[paletteId];
            if (color) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'source-atop';
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, 16, 16);
                this.ctx.restore();
            }
        }
    }

    renderSprite(name, frameIndex, x, y, flipX, scale = 1) {
        const anim = this.spriteMap[name];
        if (!anim) return;

        const sprite = Array.isArray(anim) ? anim[frameIndex % anim.length] : anim;

        const sheetName = sprite.sheet || 'main';
        const img = this.sheets[sheetName];

        if (!img || !img.complete) return;

        this.ctx.save();

        let destW, destH;

        // High-Res Sprite Scaling Logic
        // Assume 256px source width = 32px game width
        // Threshold > 200 to exclude legacy 180x180 sprites (like jump)
        if (sprite.w > 200) {
            const scaleFactor = (32 * scale) / 256;
            destW = sprite.w * scaleFactor;
            destH = sprite.h * scaleFactor;
        } else {
            // Standard 16x16 or 32x32 sprites
            const ratio = sprite.h / sprite.w;
            destW = 32 * scale;
            destH = destW * ratio;
        }

        if (flipX) {
            // Translate to the right edge of the target size
            this.ctx.translate(Math.floor(x) + destW, Math.floor(y));
            this.ctx.scale(-1, 1); // Flip horizontally
            this.ctx.drawImage(img, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, destW, destH);
        } else {
            this.ctx.translate(Math.floor(x), Math.floor(y));
            this.ctx.drawImage(img, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, destW, destH);
        }
        this.ctx.restore();
    }
}
