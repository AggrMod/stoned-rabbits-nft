// Super Mario Bros Clone - Main Game Engine
// Created with Claude Code

// ==================== CONSTANTS ====================
const GRAVITY = 0.5;
const TERMINAL_VELOCITY = 15;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const RUN_MULTIPLIER = 1.5;
const FRICTION = 0.8;
const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

// ==================== IMAGE LOADER ====================
const images = {
  rabbit: null,
  rabbitIdle1: null,
  rabbitIdle2: null,
  rabbitIdle3: null,
  crab: null,
  coin: null,
  crate: null,
  ground: null,
  chest: null,
  bg: null
};

let imagesLoaded = 0;
const totalImages = 10;

function loadImage(name, src) {
  const img = new Image();
  img.onload = () => {
    images[name] = img;
    imagesLoaded++;
    console.log(`✓ Loaded ${name}.png (${imagesLoaded}/${totalImages})`);

    if (imagesLoaded === totalImages) {
      console.log('✓ All images loaded! Game ready to start!');
    }
  };
  img.onerror = () => {
    console.error(`✗ Failed to load ${name}.png`);
  };
  img.src = src;
}

// Load all game images
const basePath = '../images/game/';
loadImage('rabbit', basePath + 'rabbit.png');
loadImage('rabbitIdle1', basePath + 'rabbit idle 1.png');
loadImage('rabbitIdle2', basePath + 'rabbit idle 2.png');
loadImage('rabbitIdle3', basePath + 'rabbit idle 3.png');
loadImage('crab', basePath + 'crab.png');
loadImage('coin', basePath + 'coin.png');
loadImage('crate', basePath + 'crate.png');
loadImage('ground', basePath + 'ground.png');
loadImage('chest', basePath + 'chest.png');
loadImage('bg', basePath + 'bg.png');

// Expose images globally for debugging
window.gameImages = images;

// ==================== PLAYER CLASS ====================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 48;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.jumping = false;
    this.facing = 'right';
    this.state = 'small'; // small, big, fire
    this.invincible = false;
    this.invincibleTimer = 0;
    this.idleFrame = 0;
    this.idleAnimationCounter = 0;
  }

  update(input, level) {
    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
      if (this.vy > TERMINAL_VELOCITY) {
        this.vy = TERMINAL_VELOCITY;
      }
    }

    // Horizontal movement
    let moveSpeed = MOVE_SPEED;
    if (input.shift) {
      moveSpeed *= RUN_MULTIPLIER;
    }

    if (input.left) {
      this.vx = -moveSpeed;
      this.facing = 'left';
    } else if (input.right) {
      this.vx = moveSpeed;
      this.facing = 'right';
    } else {
      // Apply friction
      this.vx *= FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Jumping
    if (input.jump && this.grounded && !this.jumping) {
      this.vy = JUMP_FORCE;
      this.jumping = true;
      this.grounded = false;
    }

    // Release jump button
    if (!input.jump) {
      this.jumping = false;
      // Variable jump height - cut velocity if button released early
      if (this.vy < -4) {
        this.vy = -4;
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Collision detection with level
    this.checkCollisions(level);

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Keep player in bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > level.width * TILE_SIZE) {
      this.x = level.width * TILE_SIZE - this.width;
    }

    // Idle animation
    if (Math.abs(this.vx) < 0.1 && this.grounded) {
      this.idleAnimationCounter++;
      if (this.idleAnimationCounter >= 15) { // Change frame every 15 ticks (~0.25 seconds)
        this.idleAnimationCounter = 0;
        this.idleFrame = (this.idleFrame + 1) % 3; // Cycle through 3 frames
      }
    } else {
      this.idleAnimationCounter = 0;
      this.idleFrame = 0;
    }

    // Death condition - fall off screen
    if (this.y > CANVAS_HEIGHT + 100) {
      game.loseLife();
    }
  }

  checkCollisions(level) {
    this.grounded = false;

    // Get tile positions around player
    const left = Math.floor(this.x / TILE_SIZE);
    const right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
    const top = Math.floor(this.y / TILE_SIZE);
    const bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);

    // Check collisions with solid tiles
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const tile = level.getTile(x, y);

        if (tile === 1 || tile === 2 || tile === 3) { // Solid tiles
          const tileX = x * TILE_SIZE;
          const tileY = y * TILE_SIZE;

          // AABB collision
          if (this.x < tileX + TILE_SIZE &&
              this.x + this.width > tileX &&
              this.y < tileY + TILE_SIZE &&
              this.y + this.height > tileY) {

            // Determine collision side
            const overlapLeft = (this.x + this.width) - tileX;
            const overlapRight = (tileX + TILE_SIZE) - this.x;
            const overlapTop = (this.y + this.height) - tileY;
            const overlapBottom = (tileY + TILE_SIZE) - this.y;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            // Resolve collision
            if (minOverlap === overlapTop && this.vy > 0) {
              // Landing on top
              this.y = tileY - this.height;
              this.vy = 0;
              this.grounded = true;
            } else if (minOverlap === overlapBottom && this.vy < 0) {
              // Hit from below
              this.y = tileY + TILE_SIZE;
              this.vy = 0;

              // Break brick when hit from below
              if (tile === 2) {
                console.log('Breaking brick at', x, y);
                level.breakTile(x, y);
                game.addScore(50);
              }
              // Hit question block (treasure chest)
              else if (tile === 3) {
                console.log('Hitting question block at', x, y);
                level.hitQuestionBlock(x, y);
              }
            } else if (minOverlap === overlapLeft) {
              // Hit from left
              this.x = tileX - this.width;
              this.vx = 0;
            } else if (minOverlap === overlapRight) {
              // Hit from right
              this.x = tileX + TILE_SIZE;
              this.vx = 0;
            }
          }
        }
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();

    // Invincibility flashing
    if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Draw rabbit sprite
    if (images.rabbit) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;

      // Select appropriate sprite based on idle animation
      let spriteImage = images.rabbit;
      if (Math.abs(this.vx) < 0.1 && this.grounded) {
        // Player is idle - use idle animation frames
        const idleImages = [images.rabbitIdle1, images.rabbitIdle2, images.rabbitIdle3];
        if (idleImages[this.idleFrame]) {
          spriteImage = idleImages[this.idleFrame];
        }
      }

      // Flip horizontally if facing right (sprite faces left by default)
      if (this.facing === 'right') {
        ctx.save();
        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(spriteImage, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
      } else {
        ctx.drawImage(spriteImage, drawX, drawY, this.width, this.height);
      }
    } else {
      // Fallback to colored rectangle if image not loaded
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }

    ctx.restore();
  }

  takeDamage() {
    if (this.invincible) return;

    if (this.state === 'small') {
      game.loseLife();
    } else {
      // Power down
      this.state = 'small';
      this.invincible = true;
      this.invincibleTimer = 120; // 2 seconds at 60fps
    }
  }

  powerUp(type) {
    if (type === 'mushroom') {
      this.state = 'big';
      this.height = 48;
      game.addScore(1000);
    } else if (type === 'flower') {
      this.state = 'fire';
      game.addScore(1000);
    }
  }
}

// ==================== ENEMY CLASS ====================
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 48;
    this.vx = -2;
    this.vy = 0;
    this.type = type; // 'goomba', 'koopa'
    this.alive = true;
    this.defeated = false;
    this.defeatTimer = 0;
  }

  update(level) {
    if (!this.alive) {
      if (this.defeated) {
        this.defeatTimer--;
        if (this.defeatTimer <= 0) {
          return false; // Remove from game
        }
      }
      return true;
    }

    // Apply gravity
    this.vy += GRAVITY;
    if (this.vy > TERMINAL_VELOCITY) {
      this.vy = TERMINAL_VELOCITY;
    }

    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Simple collision with level
    const tileX = Math.floor(this.x / TILE_SIZE);
    const tileY = Math.floor((this.y + this.height) / TILE_SIZE);

    // Check ground
    if (level.getTile(tileX, tileY) > 0) {
      this.y = tileY * TILE_SIZE - this.height;
      this.vy = 0;
    }

    // Check walls - reverse direction
    const frontTileX = this.vx > 0 ?
      Math.floor((this.x + this.width) / TILE_SIZE) :
      Math.floor(this.x / TILE_SIZE);

    if (level.getTile(frontTileX, tileY) > 0) {
      this.vx = -this.vx;
    }

    return true;
  }

  checkPlayerCollision(player) {
    if (!this.alive || player.invincible) return;

    // AABB collision
    if (player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y) {

      // Check if player jumped on enemy
      if (player.vy > 0 && player.y + player.height - 10 < this.y + this.height / 2) {
        // Player stomped enemy
        this.defeat();
        player.vy = JUMP_FORCE / 2; // Bounce
        game.addScore(200);
      } else {
        // Enemy hit player
        player.takeDamage();
      }
    }
  }

  defeat() {
    this.alive = false;
    this.defeated = true;
    this.defeatTimer = 30;
  }

  draw(ctx, camera) {
    if (!this.alive && !this.defeated) return;

    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    if (this.defeated) {
      // Draw squished enemy
      if (images.crab) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(images.crab, drawX, drawY + this.height - 10, this.width, 10);
        ctx.restore();
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(drawX, drawY + this.height - 10, this.width, 10);
      }
    } else {
      // Draw crab sprite
      if (images.crab) {
        ctx.drawImage(images.crab, drawX, drawY, this.width, this.height);
      } else {
        // Fallback to colored rectangle
        ctx.fillStyle = this.type === 'goomba' ? '#8B4513' : '#00AA00';
        ctx.fillRect(drawX, drawY, this.width, this.height);
      }
    }
  }
}

// ==================== COIN CLASS ====================
class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.collected = false;
    this.animation = 0;
  }

  checkCollision(player) {
    if (this.collected) return;

    if (player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y) {
      this.collected = true;
      game.collectCoin();
    }
  }

  draw(ctx, camera) {
    if (this.collected) return;

    this.animation += 0.1;

    ctx.save();
    ctx.translate(this.x - camera.x + this.width / 2, this.y - camera.y + this.height / 2);
    ctx.rotate(this.animation);

    if (images.coin) {
      ctx.drawImage(images.coin, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      // Fallback to colored square
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }
}

// ==================== LEVEL CLASS ====================
class Level {
  constructor() {
    this.width = 200; // Level width in tiles
    this.height = 15; // Level height in tiles
    this.tiles = [];
    this.generateLevel();
  }

  generateLevel() {
    // Initialize empty level
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = 0; // Empty
      }
    }

    // Create ground
    for (let x = 0; x < this.width; x++) {
      this.tiles[13][x] = 1; // Ground tile
      this.tiles[14][x] = 1;
    }

    // Add some platforms (breakable bricks)
    for (let x = 20; x < 25; x++) {
      this.tiles[10][x] = 2;
    }
    for (let x = 30; x < 35; x++) {
      this.tiles[8][x] = 2;
    }
    for (let x = 40; x < 50; x++) {
      this.tiles[10][x] = 2;
    }

    // Add question blocks
    this.tiles[9][23] = 3;
    this.tiles[9][27] = 3;
    this.tiles[9][32] = 3;

    // Add bricks (closer to start for testing)
    for (let x = 10; x < 15; x++) {
      this.tiles[9][x] = 2;
    }
    // More bricks later in level
    for (let x = 70; x < 76; x++) {
      this.tiles[9][x] = 2;
    }

    // Add pipe
    this.tiles[11][80] = 1;
    this.tiles[12][80] = 1;
    this.tiles[10][80] = 1;
    this.tiles[11][81] = 1;
    this.tiles[12][81] = 1;
    this.tiles[10][81] = 1;

    // Add some gaps
    for (let x = 60; x < 64; x++) {
      this.tiles[13][x] = 0;
      this.tiles[14][x] = 0;
    }
    for (let x = 90; x < 94; x++) {
      this.tiles[13][x] = 0;
      this.tiles[14][x] = 0;
    }

    // Stairs at the end
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) {
        this.tiles[13 - j][190 + i] = 1;
      }
    }

    // Flag pole
    for (let y = 3; y < 13; y++) {
      this.tiles[y][195] = 1;
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 0;
    }
    return this.tiles[y][x];
  }

  breakTile(x, y) {
    if (this.tiles[y][x] === 2) {
      this.tiles[y][x] = 0;
      // TODO: Add particle effect
    }
  }

  hitQuestionBlock(x, y) {
    if (this.tiles[y][x] === 3) {
      this.tiles[y][x] = 1; // Turn into regular block
      // Spawn coin above block
      game.coins.push(new Coin(x * TILE_SIZE + 8, y * TILE_SIZE - 20));
      game.collectCoin();
    }
  }

  draw(ctx, camera) {
    // Only draw visible tiles
    const startX = Math.floor(camera.x / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1, this.width);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endY = Math.min(startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1, this.height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.getTile(x, y);
        if (tile > 0) {
          const drawX = x * TILE_SIZE - camera.x;
          const drawY = y * TILE_SIZE - camera.y;

          // Draw tiles with images
          if (tile === 1) {
            // Ground tile
            if (images.ground) {
              ctx.drawImage(images.ground, drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#8B4513';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
          } else if (tile === 2) {
            // Brick/Crate tile
            if (images.crate) {
              ctx.drawImage(images.crate, drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#CD853F';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
          } else if (tile === 3) {
            // Question block (use chest as special item block)
            if (images.chest) {
              ctx.drawImage(images.chest, drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#FFD700';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#000';
              ctx.font = '20px Arial';
              ctx.fillText('?', drawX + 10, drawY + 22);
            }
          }
        }
      }
    }
  }
}

// ==================== CAMERA CLASS ====================
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  update(player, levelWidth) {
    // Center camera on player horizontally
    this.x = player.x - CANVAS_WIDTH / 2 + player.width / 2;

    // Clamp camera to level bounds
    if (this.x < 0) this.x = 0;
    if (this.x > levelWidth * TILE_SIZE - CANVAS_WIDTH) {
      this.x = levelWidth * TILE_SIZE - CANVAS_WIDTH;
    }

    // Keep camera at ground level
    this.y = 0;
  }
}

// ==================== MAIN GAME CLASS ====================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.gameState = 'start'; // start, playing, paused, gameover

    // Game objects
    this.player = null;
    this.level = null;
    this.camera = null;
    this.enemies = [];
    this.coins = [];

    // Game stats
    this.score = 0;
    this.coinCount = 0;
    this.lives = 3;
    this.time = 300;
    this.world = '1-1';

    // Input
    this.input = {
      left: false,
      right: false,
      jump: false,
      shift: false
    };

    this.setupInput();
    this.lastTime = 0;
    this.timeCounter = 0;
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = true;
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        this.input.jump = true;
        e.preventDefault();
      }
      if (e.key === 'Shift') this.input.shift = true;
      if (e.key === 'r' || e.key === 'R') this.restart();
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = false;
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.input.jump = false;
      if (e.key === 'Shift') this.input.shift = false;
    });
  }

  startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    this.gameState = 'playing';

    // Initialize game
    this.level = new Level();
    this.player = new Player(100, 300);
    this.camera = new Camera();

    // Spawn enemies
    this.enemies = [
      new Enemy(400, 200, 'goomba'),
      new Enemy(600, 200, 'goomba'),
      new Enemy(800, 200, 'koopa'),
      new Enemy(1200, 200, 'goomba'),
      new Enemy(1500, 200, 'koopa'),
      new Enemy(2000, 200, 'goomba'),
      new Enemy(2500, 200, 'goomba')
    ];

    // Spawn some coins
    for (let i = 0; i < 20; i++) {
      this.coins.push(new Coin(
        300 + i * 150 + Math.random() * 50,
        200 + Math.random() * 100
      ));
    }

    this.running = true;
    this.gameLoop();
  }

  gameLoop(currentTime = 0) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update();
    this.draw();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Update timer (every 60 frames = 1 second at 60fps)
    this.timeCounter++;
    if (this.timeCounter >= 60) {
      this.timeCounter = 0;
      this.time--;
      if (this.time <= 0) {
        this.loseLife();
      }
    }

    // Update player
    this.player.update(this.input, this.level);

    // Update camera
    this.camera.update(this.player, this.level.width);

    // Update enemies
    this.enemies = this.enemies.filter(enemy => {
      const keep = enemy.update(this.level);
      enemy.checkPlayerCollision(this.player);
      return keep;
    });

    // Update coins
    this.coins.forEach(coin => {
      coin.checkCollision(this.player);
    });

    // Check win condition - reached flag
    if (this.player.x > 195 * TILE_SIZE) {
      this.levelComplete();
    }

    // Update UI
    this.updateUI();
  }

  draw() {
    // Draw background
    if (images.bg) {
      // Draw background with parallax effect
      const bgX = -(this.camera.x * 0.3) % CANVAS_WIDTH;
      this.ctx.drawImage(images.bg, bgX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Draw second copy for seamless scrolling
      if (bgX < 0) {
        this.ctx.drawImage(images.bg, bgX + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    } else {
      // Fallback to solid color
      this.ctx.fillStyle = '#5C94FC';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw level
    this.level.draw(this.ctx, this.camera);

    // Draw coins
    this.coins.forEach(coin => coin.draw(this.ctx, this.camera));

    // Draw enemies
    this.enemies.forEach(enemy => enemy.draw(this.ctx, this.camera));

    // Draw player
    this.player.draw(this.ctx, this.camera);
  }

  addScore(points) {
    this.score += points;
  }

  collectCoin() {
    this.coinCount++;
    this.addScore(100);

    // 1-up every 100 coins
    if (this.coinCount % 100 === 0) {
      this.lives++;
    }
  }

  loseLife() {
    this.lives--;

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Respawn
      this.player.x = 100;
      this.player.y = 300;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.state = 'small';
      this.time = 300;
    }
  }

  gameOver() {
    this.running = false;
    this.gameState = 'gameover';
    document.getElementById('finalScore').textContent = this.score.toString().padStart(6, '0');
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }

  levelComplete() {
    const timeBonus = this.time * 50;
    this.addScore(5000 + timeBonus);
    alert(`Level Complete!\nScore: ${this.score}\nTime Bonus: ${timeBonus}`);
    this.restart();
  }

  restart() {
    this.running = false;
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');

    this.score = 0;
    this.coinCount = 0;
    this.lives = 3;
    this.time = 300;
    this.timeCounter = 0;
    this.gameState = 'start';
  }

  updateUI() {
    document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
    document.getElementById('coins').textContent = '×' + this.coinCount.toString().padStart(2, '0');
    document.getElementById('world').textContent = this.world;
    document.getElementById('time').textContent = this.time.toString();
    document.getElementById('lives').textContent = '×' + this.lives;
  }
}

// Initialize game when page loads
const game = new Game();
console.log('🍄 Super Mario Bros Clone loaded! Press START GAME to play! 🍄');
