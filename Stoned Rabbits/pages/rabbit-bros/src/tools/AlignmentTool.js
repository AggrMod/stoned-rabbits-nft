const canvas = document.getElementById('nes-screen');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const sprites = new Image();
sprites.src = 'assets/sprites.png';

// Initial Tile Coordinates
const coords = {
    ground: { x: 0, y: 384, w: 64, h: 64 },
    block: { x: 64, y: 384, w: 64, h: 64 }
};

let currentTile = 'ground';

sprites.onload = () => {
    draw();
};

document.addEventListener('keydown', (e) => {
    const tile = coords[currentTile];

    // Arrow keys to adjust X/Y
    if (e.key === 'ArrowUp') tile.y--;
    if (e.key === 'ArrowDown') tile.y++;
    if (e.key === 'ArrowLeft') tile.x--;
    if (e.key === 'ArrowRight') tile.x++;

    // WASD for faster movement (10px)
    if (e.key === 'w') tile.y -= 10;
    if (e.key === 's') tile.y += 10;
    if (e.key === 'a') tile.x -= 10;
    if (e.key === 'd') tile.x += 10;

    // Resizing Controls
    if (e.key === 'z') tile.w--; // Width -
    if (e.key === 'x') tile.w++; // Width +
    if (e.key === 'c') tile.h--; // Height -
    if (e.key === 'v') tile.h++; // Height +

    // Number keys to switch tiles
    if (e.key === '1') currentTile = 'ground';
    if (e.key === '2') currentTile = 'block';

    // Space to log
    if (e.key === ' ') {
        console.log(`"${currentTile}": {x: ${tile.x}, y: ${tile.y}, w: ${tile.w}, h: ${tile.h}}`);
    }

    draw();
});

function draw() {
    ctx.fillStyle = '#2b0f54';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tile = coords[currentTile];

    // Draw Source View (Actual Size)
    // Draw a background for the source view to see transparency
    ctx.fillStyle = '#444';
    ctx.fillRect(50, 50, tile.w, tile.h);

    ctx.drawImage(sprites, tile.x, tile.y, tile.w, tile.h, 50, 50, tile.w, tile.h);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, tile.w, tile.h);

    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.fillText(`Source (${tile.w}x${tile.h})`, 50, 40);

    // Draw Game View (Scaled to 32x32)
    // This simulates how it looks in game (squashed/stretched into the tile slot)
    ctx.fillStyle = '#444';
    ctx.fillRect(200, 50, 32, 32);
    ctx.drawImage(sprites, tile.x, tile.y, tile.w, tile.h, 200, 50, 32, 32);
    ctx.strokeRect(200, 50, 32, 32);

    ctx.fillStyle = 'white';
    ctx.fillText('Game (32x32)', 200, 40);

    // Info
    ctx.fillStyle = 'yellow';
    ctx.font = '12px monospace';
    ctx.fillText(`CURRENT: ${currentTile.toUpperCase()}`, 50, 150);
    ctx.fillStyle = 'lime';
    ctx.fillText(`X: ${tile.x}  Y: ${tile.y}`, 50, 170);
    ctx.fillText(`W: ${tile.w}  H: ${tile.h}`, 50, 190);

    // Instructions
    ctx.fillStyle = 'white';
    ctx.font = '8px monospace';
    ctx.fillText('1: Ground | 2: Block', 10, 210);
    ctx.fillText('Arrows: Move | WASD: Fast Move', 10, 220);
    ctx.fillText('Z/X: Width -/+ | C/V: Height -/+', 10, 230);
    ctx.fillText('Space: Log Coordinates', 10, 240);
}
