import { Input } from './engine/Input.js';
import { Physics } from './engine/Physics.js';
import { PPU } from './engine/PPU.js';
import { AudioController } from './engine/Audio.js';
import { Player, Goomba, Mushroom, Particle } from './game/Entities.js';
import { Level } from './game/Level.js';

console.log('Game Module Loaded');

const canvas = document.getElementById('nes-screen');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const sprites = new Image();
sprites.src = 'assets/sprites.png';

const playerSprites = new Image();
playerSprites.src = 'assets/player_sprites.png';

const playerRunSprites = new Image();
playerRunSprites.src = 'assets/player_run.png';

const playerIdleSprites = new Image();
playerIdleSprites.src = 'assets/player_idle.png';

const playerJumpSprites = new Image();
playerJumpSprites.src = 'assets/player_jump.png';

// Helper to load images
function loadAsset(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// Initialize Engine Components
const input = new Input();
const physics = new Physics();
const audio = new AudioController(); // Audio Engine

// We need to wait for images to load before starting? 
// Or just pass them in. PPU checks .complete
const ppu = new PPU(ctx, {
    main: sprites,
    player: playerSprites,
    player_run: playerRunSprites,
    player_idle: playerIdleSprites,
    player_jump: playerJumpSprites
});

const level = new Level();

// Start Audio on First Interaction
const startAudio = () => {
    audio.start();
    window.removeEventListener('keydown', startAudio);
    window.removeEventListener('click', startAudio);
    window.removeEventListener('touchstart', startAudio);
};
window.addEventListener('keydown', startAudio);
window.addEventListener('click', startAudio);
window.addEventListener('touchstart', startAudio);

// Mute Button Logic
const muteBtn = document.getElementById('btn-mute');
if (muteBtn) {
    // Sync initial state
    muteBtn.innerText = audio.isMuted ? 'UNMUTE' : 'MUTE';

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent game interaction
        const isMuted = audio.toggleMute();
        muteBtn.innerText = isMuted ? 'UNMUTE' : 'MUTE';
    });
}

// Touch Controls Logic
const bindTouch = (id, action) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const press = (e) => {
        e.preventDefault(); // Prevent mouse emulation
        input.setButton(action, true);
    };
    const release = (e) => {
        e.preventDefault();
        input.setButton(action, false);
    };

    btn.addEventListener('touchstart', press);
    btn.addEventListener('touchend', release);
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
};

bindTouch('btn-left', 'LEFT');
bindTouch('btn-right', 'RIGHT');
bindTouch('btn-a', 'A');
bindTouch('btn-b', 'B');

// FRAME ALIGNMENT MODE
const FRAME_ALIGN_MODE = false;
let currentFrameIndex = 0;
let currentAnim = 'player_run';

// Game Entities
const player = new Player(100, 194); // Start on ground (184 + 10px drop), visible on screen

window.addEventListener('keydown', (e) => {
    if (FRAME_ALIGN_MODE) {
        const anim = ppu.spriteMap[currentAnim];
        const sprite = anim[currentFrameIndex];

        // Frame Navigation
        if (e.key === 'n') {
            currentFrameIndex = (currentFrameIndex - 1 + anim.length) % anim.length;
        }
        if (e.key === 'm') {
            currentFrameIndex = (currentFrameIndex + 1) % anim.length;
        }

        // Sprite Sheet Adjustment
        if (e.key === 'i') sprite.y -= 1; // Up
        if (e.key === 'k') sprite.y += 1; // Down
        if (e.key === 'j') sprite.x -= 1; // Left
        if (e.key === 'l') sprite.x += 1; // Right

        // Big Steps
        if (e.key === 'I') sprite.y -= 10;
        if (e.key === 'K') sprite.y += 10;
        if (e.key === 'J') sprite.x -= 10;
        if (e.key === 'L') sprite.x += 10;
    }
});

const enemies = [
    new Goomba(120, 100),
    new Goomba(180, 100),
    new Goomba(220, 100)
];
const items = [];
const particles = [];

// Spawn Callback
level.onSpawn = (x, y, type) => {
    if (type === 'powerup') {
        items.push(new Mushroom(x, y));
    } else if (type === 'particles') {
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(x + 8, y + 8));
        }
    }
};

// Camera State
let scrollX = 0;

function update() {
    // Input Handling (Freeze if Align Mode)
    if (!FRAME_ALIGN_MODE) {
        input.update();
        player.update(input, physics, level, audio);
    } else {
        input.update();
        // In Align Mode, just apply gravity/physics but NO input
        const dummyInput = { isPressed: () => false, isJustPressed: () => false };
        player.update(dummyInput, physics, level, audio);

        // Force Player State to RUN for visualization
        player.state = 'RUN';
    }

    // Camera Logic: Follow player if they move past center screen

    // Camera Logic: Follow player if they move past center screen
    if (player.x > scrollX + 100) {
        scrollX = player.x - 100;
    }
    // Clamp Camera
    scrollX = Math.max(0, Math.min(scrollX, (level.width * 16) - 256));

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        // Only update if close to screen (simple culling)
        if (enemy.x > scrollX - 32 && enemy.x < scrollX + 288) {
            enemy.update(physics, level);
        }

        if (enemy.dead) {
            enemies.splice(i, 1);
            continue;
        }

        if (physics.isColliding(player, enemy)) {
            if (player.vy > 0 && player.y + player.height - 4 < enemy.y + enemy.height / 2) {
                player.stompEnemy(enemy);
                audio.playBump(); // Stomp sound
            }
        }
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.update(physics, level);

        if (physics.isColliding(player, item)) {
            // Collect Item
            player.score += 1000;
            player.grow(); // Become Big!
            items.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.dead) particles.splice(i, 1);
    }

    // Level End Check
    if (player.x > 3180) {
        player.victory = true;

        // Simple restart after a delay
        if (!player.victoryTimer) player.victoryTimer = 0;
        player.victoryTimer++;

        if (player.victoryTimer > 180) {
            location.reload(); // Restart
        }
    }
}

function draw() {
    // Clear Screen
    ctx.fillStyle = '#5c94fc'; // Sky Blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    level.draw(ppu, scrollX);

    // Draw Entities (Shifted by ScrollX)
    ctx.save();
    ctx.translate(-Math.floor(scrollX), 0);

    for (const item of items) item.draw(ppu);
    for (const enemy of enemies) enemy.draw(ppu);

    if (FRAME_ALIGN_MODE) {
        // Draw Player manually with specific frame
        // Use Player's draw logic but override frame
        // We need to replicate Player.draw logic here or modify Player.draw to accept override
        // Easier to just modify Player.draw temporarily or hack it here

        // Let's just draw the sprite directly using PPU
        // Calculate draw position same as Player.draw
        let scale = player.isBig ? 1.5 : 1.0;
        let offsetX = player.isBig ? -23 : -15;
        let offsetY = 0;
        let drawX = player.x + (player.width / 2) + offsetX;
        let drawY = (player.y + player.height) - (32 * scale) + offsetY;

        ppu.renderSprite(currentAnim, currentFrameIndex, drawX, drawY, !player.facingRight, scale);

        // Draw Hitbox
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(player.x, player.y, player.width, player.height);

    } else {
        player.draw(ppu);
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.fillText(`SCORE: ${player.score}`, 10, 10);
    if (player.victory) {
        ctx.fillStyle = 'gold';
        ctx.font = '20px monospace';
        ctx.fillText('VICTORY!', 80, 120);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start Game Loop
requestAnimationFrame(loop);
