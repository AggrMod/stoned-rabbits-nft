import { Input } from '../engine/Input.js';
import { Physics } from '../engine/Physics.js';
import { PPU } from '../engine/PPU.js';
import { Player } from '../game/Entities.js';

const canvas = document.getElementById('debug-screen');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Load Assets
const sprites = new Image(); sprites.src = 'assets/sprites.png';
const playerSprites = new Image(); playerSprites.src = 'assets/player_sprites.png';
const playerRunSprites = new Image(); playerRunSprites.src = 'assets/player_run.png';
const playerIdleSprites = new Image(); playerIdleSprites.src = 'assets/player_idle.png';
const playerJumpSprites = new Image(); playerJumpSprites.src = 'assets/player_jump.png';

const ppu = new PPU(ctx, {
    main: sprites,
    player: playerSprites,
    player_run: playerRunSprites,
    player_idle: playerIdleSprites,
    player_jump: playerJumpSprites
});

const input = new Input();
const physics = new Physics();
const player = new Player(100, 100); // Spawn in air

// Simple Debug Level
const level = {
    width: 16,
    height: 15,
    grid: [],
    hitTile: () => { } // No-op
};

// Initialize Grid
for (let y = 0; y < level.height; y++) {
    level.grid.push(new Array(level.width).fill(null));
}

// Create Floor
for (let x = 0; x < level.width; x++) {
    level.grid[13][x] = { type: 0, solid: true };
    level.grid[14][x] = { type: 0, solid: true };
}

// Create Platforms
level.grid[10][4] = { type: 2, solid: true };
level.grid[10][5] = { type: 2, solid: true };
level.grid[10][6] = { type: 2, solid: true };

level.grid[7][10] = { type: 2, solid: true };
level.grid[7][11] = { type: 2, solid: true };

// UI Bindings
const ui = {
    gravity: document.getElementById('rng-gravity'),
    jump: document.getElementById('rng-jump'),
    speed: document.getElementById('rng-speed'),
    reset: document.getElementById('btn-reset'),
    offset: document.getElementById('rng-offset'),
    metrics: {
        x: document.getElementById('val-x'),
        y: document.getElementById('val-y'),
        vx: document.getElementById('val-vx'),
        vy: document.getElementById('val-vy'),
        ground: document.getElementById('val-ground'),
        state: document.getElementById('val-state')
    }
};

// Update Physics Params from UI
function updateParams() {
    physics.gravity = parseFloat(ui.gravity.value);
    physics.jumpForce = parseFloat(ui.jump.value);
    physics.maxSpeed = parseFloat(ui.speed.value);
    player.visualOffsetX = parseFloat(ui.offset.value);

    document.getElementById('lbl-gravity').innerText = physics.gravity;
    document.getElementById('lbl-jump').innerText = physics.jumpForce;
    document.getElementById('lbl-speed').innerText = physics.maxSpeed;
    document.getElementById('lbl-offset').innerText = player.visualOffsetX;
}

ui.gravity.addEventListener('input', updateParams);
ui.jump.addEventListener('input', updateParams);
ui.speed.addEventListener('input', updateParams);
ui.offset.addEventListener('input', updateParams);
ui.reset.addEventListener('click', () => {
    player.x = 100;
    player.y = 50;
    player.vx = 0;
    player.vy = 0;
    ui.reset.blur(); // Remove focus so Spacebar doesn't trigger it again
});

function loop() {
    input.update();

    // Update Player
    player.update(input, physics, level, null); // No audio for debug

    // Draw
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Level
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tile = level.grid[y][x];
            if (tile) {
                ctx.fillStyle = tile.type === 0 ? '#8a2be2' : '#ffd700';
                ctx.fillRect(x * 16, y * 16, 16, 16);
            }
        }
    }

    // Draw Player
    player.draw(ppu);

    // Update Metrics
    ui.metrics.x.innerText = player.x.toFixed(2);
    ui.metrics.y.innerText = player.y.toFixed(2);
    ui.metrics.vx.innerText = player.vx.toFixed(2);
    ui.metrics.vy.innerText = player.vy.toFixed(2);
    ui.metrics.ground.innerText = player.grounded;
    ui.metrics.state.innerText = player.state;

    requestAnimationFrame(loop);
}

// Start
updateParams();
requestAnimationFrame(loop);
