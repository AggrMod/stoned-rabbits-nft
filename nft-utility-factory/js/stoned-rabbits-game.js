// Stoned Rabbits: Pirate Adventure - A Mario Bros Style Platformer
// Created for NFT Utility Factory

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.6;
const JUMP_POWER = -13;
const MOVE_SPEED = 4;
const TILE_SIZE = 32;
const COLS = Math.floor(canvas.width / TILE_SIZE);
const ROWS = Math.floor(canvas.height / TILE_SIZE);

// Game State
const gameState = {
  currentLevel: 0,
  score: 0,
  lives: 3,
  paused: false,
  gameOver: false,
  victory: false,
  keys: {},
  particles: [],
  highScore: parseInt(localStorage.getItem('pirateHighScore') || '0')
};

// Tile Types
const TILES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE: 4,
  SHIP: 5,
  PLANK: 6,
  WATER: 7,
  TREASURE: 8
};

// Colors for tiles (pirate theme)
const TILE_COLORS = {
  [TILES.GROUND]: '#8B4513',
  [TILES.BRICK]: '#A0522D',
  [TILES.QUESTION]: '#FFD700',
  [TILES.PIPE]: '#228B22',
  [TILES.SHIP]: '#654321',
  [TILES.PLANK]: '#DEB887',
  [TILES.WATER]: '#4169E1',
  [TILES.TREASURE]: '#FFD700'
};

// Player Object
const player = {
  x: 100,
  y: 400,
  width: 28,
  height: 32,
  vx: 0,
  vy: 0,
  onGround: false,
  direction: 1, // 1 = right, -1 = left
  invincible: 0,
  animation: 0
};

// Enemies Array
let enemies = [];

// Collectibles Array
let collectibles = [];

// Level Designs (0 = empty, 1 = ground, 2 = brick, 3 = question block, 4 = pipe, 5 = ship, 6 = plank, 7 = water, 8 = treasure)
const levels = [
  {
    name: "Treasure Cove",
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,0,0,0,0,2,0,0,8],
      [0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,6],
      [0,0,0,0,2,2,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    enemies: [
      { x: 250, y: 430, type: 'crab' },
      { x: 400, y: 430, type: 'crab' },
      { x: 550, y: 430, type: 'parrot' }
    ],
    collectibles: [
      { x: 320, y: 150, type: 'coin' },
      { x: 680, y: 350, type: 'coin' },
      { x: 450, y: 400, type: 'coin' },
      { x: 200, y: 350, type: 'rum' }
    ]
  },
  {
    name: "Pirate Ship Deck",
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,6,6,6,0,0,0,0,0,0,0,0,0,6,6,6,0,0,0,0,0,0,8],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5],
      [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
      [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    enemies: [
      { x: 200, y: 270, type: 'parrot' },
      { x: 350, y: 270, type: 'crab' },
      { x: 500, y: 270, type: 'parrot' },
      { x: 650, y: 270, type: 'crab' }
    ],
    collectibles: [
      { x: 320, y: 200, type: 'coin' },
      { x: 352, y: 200, type: 'coin' },
      { x: 384, y: 200, type: 'coin' },
      { x: 150, y: 400, type: 'rum' },
      { x: 600, y: 150, type: 'coin' }
    ]
  }
];

let currentMap = [];

// Initialize level
function initLevel(levelIndex) {
  if (levelIndex >= levels.length) {
    gameState.victory = true;
    return;
  }

  gameState.currentLevel = levelIndex;
  const level = levels[levelIndex];
  currentMap = JSON.parse(JSON.stringify(level.map));

  // Reset player position
  player.x = 100;
  player.y = 400;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 0;

  // Initialize enemies
  enemies = level.enemies.map(e => ({
    x: e.x,
    y: e.y,
    width: 28,
    height: 28,
    vx: e.type === 'parrot' ? 2 : 1.5,
    type: e.type,
    direction: -1,
    alive: true
  }));

  // Initialize collectibles
  collectibles = level.collectibles.map(c => ({
    x: c.x,
    y: c.y,
    width: 24,
    height: 24,
    type: c.type,
    collected: false,
    animation: 0
  }));
}

// Collision detection
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function getTileAt(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);

  if (row < 0 || row >= currentMap.length || col < 0 || col >= currentMap[0].length) {
    return TILES.EMPTY;
  }

  return currentMap[row][col];
}

function isSolid(tile) {
  return tile === TILES.GROUND || tile === TILES.BRICK ||
         tile === TILES.QUESTION || tile === TILES.PIPE ||
         tile === TILES.SHIP || tile === TILES.PLANK;
}

// Player physics and collision
function updatePlayer() {
  if (gameState.paused || gameState.gameOver || gameState.victory) return;

  // Horizontal movement
  if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
    player.vx = -MOVE_SPEED;
    player.direction = -1;
  } else if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
    player.vx = MOVE_SPEED;
    player.direction = 1;
  } else {
    player.vx = 0;
  }

  // Jumping
  if ((gameState.keys[' '] || gameState.keys['ArrowUp'] || gameState.keys['w']) && player.onGround) {
    player.vy = JUMP_POWER;
    player.onGround = false;
  }

  // Apply gravity
  player.vy += GRAVITY;

  // Terminal velocity
  if (player.vy > 15) player.vy = 15;

  // Horizontal collision
  player.x += player.vx;

  // Check horizontal collisions
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  const playerTop = player.y;
  const playerBottom = player.y + player.height;

  for (let row = Math.floor(playerTop / TILE_SIZE); row <= Math.floor(playerBottom / TILE_SIZE); row++) {
    for (let col = Math.floor(playerLeft / TILE_SIZE); col <= Math.floor(playerRight / TILE_SIZE); col++) {
      if (row >= 0 && row < currentMap.length && col >= 0 && col < currentMap[0].length) {
        const tile = currentMap[row][col];
        if (isSolid(tile)) {
          // Collision detected
          if (player.vx > 0) {
            player.x = col * TILE_SIZE - player.width;
          } else if (player.vx < 0) {
            player.x = (col + 1) * TILE_SIZE;
          }
          player.vx = 0;
        } else if (tile === TILES.WATER) {
          // Hit water - death
          loseLife();
        } else if (tile === TILES.TREASURE) {
          // Win level!
          gameState.score += 1000;
          nextLevel();
        }
      }
    }
  }

  // Vertical collision
  player.y += player.vy;
  player.onGround = false;

  const newPlayerLeft = player.x;
  const newPlayerRight = player.x + player.width;
  const newPlayerTop = player.y;
  const newPlayerBottom = player.y + player.height;

  for (let row = Math.floor(newPlayerTop / TILE_SIZE); row <= Math.floor(newPlayerBottom / TILE_SIZE); row++) {
    for (let col = Math.floor(newPlayerLeft / TILE_SIZE); col <= Math.floor(newPlayerRight / TILE_SIZE); col++) {
      if (row >= 0 && row < currentMap.length && col >= 0 && col < currentMap[0].length) {
        const tile = currentMap[row][col];
        if (isSolid(tile)) {
          if (player.vy > 0) {
            // Landing on top
            player.y = row * TILE_SIZE - player.height;
            player.vy = 0;
            player.onGround = true;
          } else if (player.vy < 0) {
            // Hitting from below
            player.y = (row + 1) * TILE_SIZE;
            player.vy = 0;

            // Hit question block
            if (tile === TILES.QUESTION) {
              currentMap[row][col] = TILES.BRICK;
              gameState.score += 100;
              createParticle(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE, '#FFD700');
            }
          }
        } else if (tile === TILES.WATER) {
          loseLife();
        } else if (tile === TILES.TREASURE) {
          gameState.score += 1000;
          nextLevel();
        }
      }
    }
  }

  // Keep player in bounds
  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

  // Fall off screen
  if (player.y > canvas.height) {
    loseLife();
  }

  // Update invincibility
  if (player.invincible > 0) {
    player.invincible--;
  }

  // Animation counter
  player.animation = (player.animation + 1) % 60;
}

// Update enemies
function updateEnemies() {
  if (gameState.paused || gameState.gameOver || gameState.victory) return;

  enemies.forEach(enemy => {
    if (!enemy.alive) return;

    // Move enemy
    enemy.x += enemy.vx * enemy.direction;

    // Check wall collisions and turn around
    const enemyLeft = enemy.x;
    const enemyRight = enemy.x + enemy.width;
    const enemyBottom = enemy.y + enemy.height;

    // Check if there's ground ahead or hit a wall
    const tileAhead = getTileAt(
      enemy.direction > 0 ? enemyRight : enemyLeft,
      enemyBottom + 5
    );

    const tileWall = getTileAt(
      enemy.direction > 0 ? enemyRight : enemyLeft,
      enemy.y + enemy.height / 2
    );

    if (!isSolid(tileAhead) || isSolid(tileWall)) {
      enemy.direction *= -1;
    }

    // Parrots fly up and down
    if (enemy.type === 'parrot') {
      enemy.y += Math.sin(Date.now() / 300) * 0.8;
    } else {
      // Apply gravity to crabs
      let onGround = false;
      for (let checkY = enemy.y + enemy.height; checkY < enemy.y + enemy.height + 5; checkY++) {
        if (isSolid(getTileAt(enemy.x + enemy.width/2, checkY))) {
          onGround = true;
          break;
        }
      }
      if (!onGround && enemy.y < canvas.height) {
        enemy.y += 2;
      }
    }

    // Check collision with player
    if (player.invincible === 0 && checkCollision(player, enemy)) {
      // Check if player is jumping on enemy
      if (player.vy > 0 && player.y < enemy.y) {
        // Kill enemy
        enemy.alive = false;
        gameState.score += 200;
        player.vy = -8; // Bounce
        createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000');
      } else {
        // Player gets hit
        loseLife();
      }
    }
  });
}

// Update collectibles
function updateCollectibles() {
  if (gameState.paused || gameState.gameOver || gameState.victory) return;

  collectibles.forEach(item => {
    if (item.collected) return;

    item.animation = (item.animation + 1) % 60;

    // Check collision with player
    if (checkCollision(player, item)) {
      item.collected = true;

      if (item.type === 'coin') {
        gameState.score += 50;
      } else if (item.type === 'rum') {
        gameState.score += 200;
        player.invincible = 180; // 3 seconds of invincibility
      }

      createParticle(item.x + item.width/2, item.y + item.height/2, '#FFD700');
    }
  });
}

// Particle effects
function createParticle(x, y, color) {
  for (let i = 0; i < 8; i++) {
    gameState.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      color: color
    });
  }
}

function updateParticles() {
  gameState.particles = gameState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    return p.life > 0;
  });
}

// Game over and level management
function loseLife() {
  if (player.invincible > 0) return;

  gameState.lives--;
  player.invincible = 120;

  if (gameState.lives <= 0) {
    gameState.gameOver = true;
    checkHighScore();
  } else {
    // Reset position
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
  }
}

function nextLevel() {
  if (gameState.currentLevel + 1 < levels.length) {
    initLevel(gameState.currentLevel + 1);
  } else {
    gameState.victory = true;
    gameState.score += 5000; // Victory bonus
    checkHighScore();
  }
}

function restartGame() {
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.gameOver = false;
  gameState.victory = false;
  gameState.particles = [];
  initLevel(0);
}

function checkHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('pirateHighScore', gameState.score.toString());

    // Prompt for name and save to leaderboard
    setTimeout(() => {
      const name = prompt('🏆 New High Score! Enter your pirate name:') || 'Anonymous Pirate';
      addToLeaderboard(name, gameState.score);
    }, 500);
  }
}

// Leaderboard
function addToLeaderboard(name, score) {
  let leaderboard = JSON.parse(localStorage.getItem('pirateLeaderboard') || '[]');

  leaderboard.push({
    name: name,
    score: score,
    date: new Date().toLocaleDateString()
  });

  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);

  // Keep top 10
  leaderboard = leaderboard.slice(0, 10);

  localStorage.setItem('pirateLeaderboard', JSON.stringify(leaderboard));
  updateLeaderboardDisplay();
}

function updateLeaderboardDisplay() {
  const leaderboard = JSON.parse(localStorage.getItem('pirateLeaderboard') || '[]');
  const listElement = document.getElementById('leaderboardList');

  if (leaderboard.length === 0) {
    listElement.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.6;">No scores yet. Be the first pirate captain!</div>';
    return;
  }

  listElement.innerHTML = leaderboard.map((entry, index) => {
    let className = 'leaderboard-entry';
    if (index === 0) className += ' gold';
    else if (index === 1) className += ' silver';
    else if (index === 2) className += ' bronze';

    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💀';

    return `
      <div class="${className}">
        <span>${medal} ${index + 1}. ${entry.name}</span>
        <span>${entry.score.toLocaleString()} pts</span>
      </div>
    `;
  }).join('');
}

// Drawing functions
function drawTile(tile, x, y) {
  const color = TILE_COLORS[tile] || '#000000';

  ctx.fillStyle = color;
  ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

  // Add details based on tile type
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

  if (tile === TILES.QUESTION) {
    ctx.fillStyle = '#FF6347';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
  } else if (tile === TILES.TREASURE) {
    ctx.fillStyle = '#FF6347';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💎', x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
  } else if (tile === TILES.WATER) {
    // Animated water
    ctx.fillStyle = 'rgba(65, 105, 225, 0.8)';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

function drawPlayer() {
  // Draw rabbit character
  ctx.save();

  // Flicker when invincible
  if (player.invincible > 0 && Math.floor(player.animation / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Body (pirate rabbit)
  ctx.fillStyle = player.invincible > 0 ? '#FFD700' : '#E0E0E0';
  ctx.fillRect(player.x + 6, player.y + 8, 16, 20);

  // Head
  ctx.fillStyle = player.invincible > 0 ? '#FFD700' : '#F0F0F0';
  ctx.beginPath();
  ctx.arc(player.x + 14, player.y + 8, 8, 0, Math.PI * 2);
  ctx.fill();

  // Pirate hat
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo(player.x + 8, player.y + 4);
  ctx.lineTo(player.x + 20, player.y + 4);
  ctx.lineTo(player.x + 18, player.y);
  ctx.lineTo(player.x + 10, player.y);
  ctx.closePath();
  ctx.fill();

  // Eye patch
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(player.x + (player.direction > 0 ? 16 : 12), player.y + 8, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ears (long rabbit ears)
  ctx.fillStyle = player.invincible > 0 ? '#FFD700' : '#F0F0F0';
  ctx.fillRect(player.x + 8, player.y - 4, 3, 8);
  ctx.fillRect(player.x + 17, player.y - 4, 3, 8);

  // Legs (animated when moving)
  const legOffset = Math.abs(player.vx) > 0 ? Math.sin(player.animation / 5) * 2 : 0;
  ctx.fillStyle = player.invincible > 0 ? '#FFD700' : '#E0E0E0';
  ctx.fillRect(player.x + 8, player.y + 28, 5, 4 + legOffset);
  ctx.fillRect(player.x + 15, player.y + 28, 5, 4 - legOffset);

  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;

    if (enemy.type === 'crab') {
      // Draw crab
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(enemy.x + 4, enemy.y + 10, 20, 12);

      // Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(enemy.x + 8, enemy.y + 8, 3, 0, Math.PI * 2);
      ctx.arc(enemy.x + 20, enemy.y + 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Claws
      ctx.fillStyle = '#FF6347';
      ctx.fillRect(enemy.x, enemy.y + 14, 4, 6);
      ctx.fillRect(enemy.x + 24, enemy.y + 14, 4, 6);

      // Legs
      ctx.fillStyle = '#FF4500';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(enemy.x + 6 + i * 6, enemy.y + 22, 2, 4);
      }
    } else if (enemy.type === 'parrot') {
      // Draw parrot
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.ellipse(enemy.x + 14, enemy.y + 14, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings (flapping)
      const wingFlap = Math.sin(Date.now() / 100) * 3;
      ctx.fillStyle = '#228B22';
      ctx.fillRect(enemy.x + 4 - wingFlap, enemy.y + 10, 6, 8);
      ctx.fillRect(enemy.x + 18 + wingFlap, enemy.y + 10, 6, 8);

      // Beak
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(enemy.x + 14, enemy.y + 16);
      ctx.lineTo(enemy.x + 8, enemy.y + 14);
      ctx.lineTo(enemy.x + 14, enemy.y + 14);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(enemy.x + 16, enemy.y + 12, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawCollectibles() {
  collectibles.forEach(item => {
    if (item.collected) return;

    const bounce = Math.sin(item.animation / 10) * 3;

    if (item.type === 'coin') {
      // Gold coin
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(item.x + item.width/2, item.y + item.height/2 + bounce, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Coin detail
      ctx.fillStyle = '#DAA520';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', item.x + item.width/2, item.y + item.height/2 + bounce);
    } else if (item.type === 'rum') {
      // Rum bottle (power-up)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(item.x + 6, item.y + 4 + bounce, 12, 16);

      ctx.fillStyle = '#654321';
      ctx.fillRect(item.x + 8, item.y + bounce, 8, 4);

      // Label
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(item.x + 7, item.y + 10 + bounce, 10, 6);
    }
  });
}

function drawParticles() {
  gameState.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  // Level name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`Level ${gameState.currentLevel + 1}: ${levels[gameState.currentLevel].name}`, 10, 25);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 50);
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('🏴‍☠️ VICTORY! 🏴‍☠️', canvas.width/2, canvas.height/2 - 80);

  ctx.fillStyle = '#32CD32';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('You found all the treasure!', canvas.width/2, canvas.height/2 - 20);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2 + 30);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('Press R to play again', canvas.width/2, canvas.height/2 + 80);
}

function drawPaused() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('Press P to resume', canvas.width/2, canvas.height/2 + 50);
}

// Main game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw level
  for (let row = 0; row < currentMap.length; row++) {
    for (let col = 0; col < currentMap[row].length; col++) {
      const tile = currentMap[row][col];
      if (tile !== TILES.EMPTY) {
        drawTile(tile, col, row);
      }
    }
  }

  // Update and draw game objects
  updateParticles();
  drawParticles();

  updateCollectibles();
  drawCollectibles();

  updateEnemies();
  drawEnemies();

  updatePlayer();
  drawPlayer();

  drawHUD();

  // Draw overlays
  if (gameState.paused) {
    drawPaused();
  } else if (gameState.gameOver) {
    drawGameOver();
  } else if (gameState.victory) {
    drawVictory();
  }

  // Update UI
  document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
  document.getElementById('livesDisplay').textContent = gameState.lives;
  document.getElementById('levelDisplay').textContent = gameState.currentLevel + 1;
  document.getElementById('highScoreDisplay').textContent = gameState.highScore.toLocaleString();

  requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', (e) => {
  gameState.keys[e.key] = true;

  if (e.key === 'r' || e.key === 'R') {
    restartGame();
  }

  if (e.key === 'p' || e.key === 'P') {
    gameState.paused = !gameState.paused;
  }

  // Prevent default for game keys
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  gameState.keys[e.key] = false;
});

// Clear leaderboard button
document.getElementById('clearLeaderboard').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the leaderboard?')) {
    localStorage.removeItem('pirateLeaderboard');
    updateLeaderboardDisplay();
  }
});

// Initialize game
initLevel(0);
updateLeaderboardDisplay();
gameLoop();

console.log('🏴‍☠️ Stoned Rabbits: Pirate Adventure loaded! Ahoy matey! 🏴‍☠️');
