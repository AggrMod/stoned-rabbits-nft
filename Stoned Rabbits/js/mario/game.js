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

// ==================== DEBUG CLI ====================
const DEBUG = {
  enabled: true,
  log: function(msg) { if (this.enabled) console.log('[DEBUG]', msg); },
  showHitboxes: false,
  godMode: false,
  showStats: true
};

// CLI Commands - accessible from browser console
window.cli = {
  help: () => {
    console.log(`
=== MARIO CLONE DEBUG CLI ===
cli.god()        - Toggle god mode (invincible)
cli.small()      - Set player to small form
cli.super()      - Set player to super form
cli.fire()       - Set player to fire form
cli.star()       - Give starman (10s invincibility)
cli.coins(n)     - Add n coins
cli.lives(n)     - Set lives to n
cli.score(n)     - Add n to score
cli.tp(x,y)      - Teleport to tile position
cli.spawn(type)  - Spawn enemy (goomba/koopa)
cli.hitbox()     - Toggle hitbox display
cli.stats()      - Show player stats
cli.reset()      - Reset level
    `);
  },
  god: () => { DEBUG.godMode = !DEBUG.godMode; console.log('God mode:', DEBUG.godMode); },
  small: () => { if (game.player) { game.player.setState('small'); console.log('Set to small'); }},
  super: () => { if (game.player) { game.player.setState('super'); console.log('Set to super'); }},
  fire: () => { if (game.player) { game.player.setState('fire'); console.log('Set to fire'); }},
  star: () => { if (game.player) { game.player.activateStar(); console.log('Starman activated!'); }},
  coins: (n) => { if (game) { game.coins_count += n; console.log('Coins:', game.coins_count); }},
  lives: (n) => { if (game) { game.lives = n; console.log('Lives:', game.lives); }},
  score: (n) => { if (game) { game.score += n; console.log('Score:', game.score); }},
  tp: (x, y) => { if (game.player) { game.player.x = x * 32; game.player.y = y * 32; console.log('Teleported to', x, y); }},
  spawn: (type) => { if (game) { game.enemies.push(new Enemy(game.player.x + 100, game.player.y, type || 'goomba')); console.log('Spawned', type); }},
  hitbox: () => { DEBUG.showHitboxes = !DEBUG.showHitboxes; console.log('Hitboxes:', DEBUG.showHitboxes); },
  stats: () => { if (game.player) { console.log('Player:', game.player); }},
  reset: () => { if (game) { game.restart(); console.log('Level reset'); }}
};
console.log('🎮 Debug CLI ready! Type cli.help() for commands');

// ==================== PLAYER CLASS ====================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseWidth = 32;
    this.baseHeight = 32;
    this.width = 32;   // Small = 32, Super/Fire = 32 wide
    this.height = 32;  // Small = 32, Super/Fire = 64 tall
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.jumping = false;
    this.jumpHeld = false;
    this.facing = 'right';
    this.state = 'small'; // small, super, fire
    this.invincible = false;
    this.invincibleTimer = 0;
    this.starPower = false;
    this.starTimer = 0;
    this.idleFrame = 0;
    this.idleAnimationCounter = 0;
    this.transforming = false;
    this.transformTimer = 0;
    DEBUG.log('Player created at ' + x + ',' + y);
  }

  // Set player state (small, super, fire)
  setState(newState) {
    const oldState = this.state;
    this.state = newState;

    if (newState === 'small') {
      this.height = 32;
      // Adjust Y position when shrinking
      if (oldState !== 'small') {
        this.y += 32;
      }
    } else {
      this.height = 64;
      // Adjust Y position when growing
      if (oldState === 'small') {
        this.y -= 32;
      }
    }
    DEBUG.log('State changed: ' + oldState + ' -> ' + newState);
  }

  // Power up (mushroom or fire flower)
  powerUp(type) {
    if (type === 'mushroom') {
      if (this.state === 'small') {
        this.setState('super');
        game.addScore(1000);
        DEBUG.log('Powered up to Super!');
      }
    } else if (type === 'fireflower') {
      if (this.state === 'small') {
        this.setState('super');
      }
      this.setState('fire');
      game.addScore(1000);
      DEBUG.log('Powered up to Fire!');
    }
  }

  // Activate starman
  activateStar() {
    this.starPower = true;
    this.starTimer = 600; // 10 seconds at 60fps
    this.invincible = true;
    DEBUG.log('Star power activated!');
  }

  // Take damage
  takeDamage() {
    if (DEBUG.godMode || this.invincible) return;

    if (this.state === 'fire' || this.state === 'super') {
      // Shrink instead of dying
      this.setState('small');
      this.invincible = true;
      this.invincibleTimer = 120; // 2 seconds invincibility
      DEBUG.log('Hit! Shrunk to small');
    } else {
      // Small = death
      game.loseLife();
      DEBUG.log('Hit! Lost life');
    }
  }

  // Check if can break bricks
  canBreakBricks() {
    return this.state === 'super' || this.state === 'fire';
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

    // Star power timer
    if (this.starPower) {
      this.starTimer--;
      if (this.starTimer <= 0) {
        this.starPower = false;
        this.invincible = false;
        DEBUG.log('Star power ended');
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

              // Break brick when hit from below (ONLY if Super or Fire!)
              if (tile === 2) {
                if (this.canBreakBricks()) {
                  DEBUG.log('Breaking brick at ' + x + ',' + y);
                  level.breakTile(x, y);
                  game.addScore(50);
                } else {
                  // Small Mario bumps the brick but doesn't break it
                  DEBUG.log('Bumped brick (too small to break)');
                  // Could add bump animation here
                }
              }
              // Hit question block (treasure chest) - spawns power-up
              else if (tile === 3) {
                DEBUG.log('Hit question block at ' + x + ',' + y);
                level.hitQuestionBlock(x, y, this.state);
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
    if (!this.alive) return;

    // AABB collision
    if (player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y) {

      // Star power = instant kill enemies on contact!
      if (player.starPower) {
        this.defeat();
        game.addScore(200);
        DEBUG.log('Star power killed enemy!');
        return;
      }

      // Check if player jumped on enemy
      if (player.vy > 0 && player.y + player.height - 10 < this.y + this.height / 2) {
        // Player stomped enemy
        this.defeat();
        player.vy = JUMP_FORCE / 2; // Bounce
        game.addScore(200);
        DEBUG.log('Stomped enemy!');
      } else if (!player.invincible) {
        // Enemy hit player (only if not invincible)
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

// ==================== POWERUP CLASS ====================
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.type = type; // 'mushroom', 'fireflower', 'star'
    this.vx = 2; // Moves to the right like real Mario
    this.vy = 0;
    this.collected = false;
    this.grounded = false;
    DEBUG.log('PowerUp spawned: ' + type);
  }

  update(level) {
    if (this.collected) return;

    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY * 0.5;
      if (this.vy > 8) this.vy = 8;
    }

    // Move horizontally (mushrooms move!)
    if (this.type === 'mushroom' || this.type === 'star') {
      this.x += this.vx;
    }

    this.y += this.vy;

    // Simple ground collision
    this.grounded = false;
    const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const tileY = Math.floor((this.y + this.height) / TILE_SIZE);
    const tile = level.getTile(tileX, tileY);

    if (tile > 0) {
      this.grounded = true;
      this.y = tileY * TILE_SIZE - this.height;
      this.vy = 0;
    }

    // Reverse direction if hitting wall
    const wallTileX = Math.floor((this.x + (this.vx > 0 ? this.width : 0)) / TILE_SIZE);
    const wallTileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    if (level.getTile(wallTileX, wallTileY) > 0) {
      this.vx *= -1;
    }
  }

  checkCollision(player) {
    if (this.collected) return;

    if (player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y) {
      this.collected = true;

      if (this.type === 'mushroom') {
        player.powerUp('mushroom');
        DEBUG.log('Collected mushroom!');
      } else if (this.type === 'fireflower') {
        player.powerUp('fireflower');
        DEBUG.log('Collected fire flower!');
      } else if (this.type === 'star') {
        player.activateStar();
        DEBUG.log('Collected star!');
      }
    }
  }

  draw(ctx, camera) {
    if (this.collected) return;

    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Draw based on type
    if (this.type === 'mushroom') {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(drawX, drawY, this.width, this.height);
      // White spots
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(drawX + 8, drawY + 8, 4, 0, Math.PI * 2);
      ctx.arc(drawX + 24, drawY + 8, 4, 0, Math.PI * 2);
      ctx.arc(drawX + 16, drawY + 16, 4, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(drawX + 8, drawY + 20, 16, 12);
    } else if (this.type === 'fireflower') {
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(drawX + 8, drawY + 16, 16, 16);
      // Petals
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(drawX + 16, drawY + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(drawX + 16, drawY + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'star') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      const cx = drawX + 16, cy = drawY + 16;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = cx + Math.cos(angle) * 14;
        const y = cy + Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        const ix = cx + Math.cos(innerAngle) * 6;
        const iy = cy + Math.sin(innerAngle) * 6;
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();
    }
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

    // Create ground - World 1-1 style
    for (let x = 0; x < this.width; x++) {
      this.tiles[13][x] = 1; // Ground tile
      this.tiles[14][x] = 1;
    }

    // === WORLD 1-1 AUTHENTIC LAYOUT ===

    // Opening area - Question block stairs (like the iconic opening)
    this.tiles[9][16] = 3;  // Question block
    this.tiles[9][20] = 2;  // Brick
    this.tiles[9][21] = 3;  // Question block (has power-up)
    this.tiles[9][22] = 2;  // Brick
    this.tiles[9][23] = 3;  // Question block
    this.tiles[5][23] = 3;  // Question block above

    // More bricks and question blocks
    this.tiles[9][77] = 2;
    this.tiles[9][78] = 3;
    this.tiles[9][79] = 2;

    this.tiles[9][80] = 3;
    this.tiles[9][81] = 2;
    this.tiles[9][82] = 2;
    this.tiles[5][80] = 2;
    this.tiles[5][81] = 3;
    this.tiles[5][82] = 2;

    // Brick blocks in rows
    for (let x = 91; x < 94; x++) {
      this.tiles[9][x] = 2;
    }

    // Three pipes (World 1-1 iconic pipes)
    // First pipe (2 blocks tall)
    for (let y = 11; y < 13; y++) {
      this.tiles[y][28] = 1;
      this.tiles[y][29] = 1;
    }

    // Second pipe (3 blocks tall)
    for (let y = 10; y < 13; y++) {
      this.tiles[y][38] = 1;
      this.tiles[y][39] = 1;
    }

    // Third pipe (4 blocks tall) - The famous secret pipe!
    for (let y = 9; y < 13; y++) {
      this.tiles[y][46] = 1;
      this.tiles[y][47] = 1;
    }

    // Fourth pipe (4 blocks tall)
    for (let y = 9; y < 13; y++) {
      this.tiles[y][57] = 1;
      this.tiles[y][58] = 1;
    }

    // First pit (World 1-1 gap)
    for (let x = 63; x < 69; x++) {
      this.tiles[13][x] = 0;
      this.tiles[14][x] = 0;
    }

    // Brick pyramid after first pit
    // Bottom row
    for (let x = 71; x < 79; x++) {
      this.tiles[9][x] = 2;
    }
    // Middle row
    for (let x = 72; x < 78; x++) {
      this.tiles[8][x] = 2;
    }
    // Top row
    for (let x = 73; x < 77; x++) {
      this.tiles[7][x] = 2;
    }
    // Peak
    for (let x = 74; x < 76; x++) {
      this.tiles[6][x] = 2;
    }
    this.tiles[5][75] = 3; // Question block at peak

    // Second pit (bigger gap)
    for (let x = 106; x < 113; x++) {
      this.tiles[13][x] = 0;
      this.tiles[14][x] = 0;
    }

    // Blocks after second pit
    for (let x = 118; x < 122; x++) {
      this.tiles[9][x] = 2;
    }
    this.tiles[9][128] = 3;

    // Final area - blocks before stairs
    for (let x = 134; x < 138; x++) {
      this.tiles[9][x] = 2;
    }
    this.tiles[9][136] = 3; // Question block

    // More scattered blocks
    for (let x = 155; x < 158; x++) {
      this.tiles[9][x] = 2;
    }

    // Underground pipe (before stairs)
    for (let y = 9; y < 13; y++) {
      this.tiles[y][163] = 1;
      this.tiles[y][164] = 1;
    }

    // Ending stairs (9 steps ascending - World 1-1 iconic ending)
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j <= i; j++) {
        this.tiles[13 - j][179 + i] = 1; // Solid stairs
      }
    }

    // Descending stairs after flag
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9 - i; j++) {
        this.tiles[13 - j][190 + i] = 1;
      }
    }

    // Flag pole (World 1-1 ending!)
    for (let y = 3; y < 13; y++) {
      this.tiles[y][189] = 1;
    }
    this.tiles[2][189] = 3; // Flag at top
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

  hitQuestionBlock(x, y, playerState) {
    if (this.tiles[y][x] === 3) {
      this.tiles[y][x] = 1; // Turn into regular solid block

      // Spawn power-up based on player state
      if (playerState === 'small') {
        // Spawn mushroom to make player Super
        game.powerUps.push(new PowerUp(x * TILE_SIZE, y * TILE_SIZE - TILE_SIZE, 'mushroom'));
        DEBUG.log('Spawned mushroom!');
      } else {
        // Already Super or Fire - spawn coin instead
        game.coins.push(new Coin(x * TILE_SIZE + 8, y * TILE_SIZE - 20));
        game.collectCoin();
        DEBUG.log('Spawned coin (player already powered up)');
      }
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
    this.powerUps = []; // Mushrooms, fire flowers, stars

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

    // Reset arrays
    this.coins = [];
    this.enemies = [];
    this.powerUps = [];

    // Initialize game
    this.level = new Level();
    this.player = new Player(100, 300);
    this.camera = new Camera();
    DEBUG.log('Game started! Player state: ' + this.player.state);

    // Spawn enemies - World 1-1 style (16 Goombas + 1 Koopa)
    this.enemies = [
      // Opening goombas
      new Enemy(22 * 32, 12 * 32, 'goomba'),  // First enemy player meets
      new Enemy(40 * 32, 12 * 32, 'goomba'),
      new Enemy(51 * 32, 12 * 32, 'goomba'),
      new Enemy(53 * 32, 12 * 32, 'goomba'),  // Double goomba
      new Enemy(97 * 32, 12 * 32, 'goomba'),
      new Enemy(99 * 32, 12 * 32, 'goomba'),  // Double goomba
      // Goombas after first pit
      new Enemy(115 * 32, 12 * 32, 'goomba'),
      new Enemy(117 * 32, 12 * 32, 'goomba'), // Double goomba
      new Enemy(123 * 32, 12 * 32, 'goomba'),
      new Enemy(125 * 32, 12 * 32, 'goomba'), // Double goomba
      // More goombas
      new Enemy(128 * 32, 12 * 32, 'goomba'),
      new Enemy(130 * 32, 12 * 32, 'goomba'), // Double goomba
      new Enemy(170 * 32, 12 * 32, 'goomba'),
      new Enemy(171 * 32, 12 * 32, 'goomba'), // Double goomba
      new Enemy(174 * 32, 12 * 32, 'goomba'),
      new Enemy(176 * 32, 12 * 32, 'goomba'),
      // The one Koopa Troopa
      new Enemy(109 * 32, 12 * 32, 'koopa')
    ];

    // Spawn coins - World 1-1 style placement
    // Coins above opening blocks
    for (let i = 0; i < 3; i++) {
      this.coins.push(new Coin(20 * 32 + i * 32, 8 * 32));
    }
    // Coins near pyramid
    for (let i = 0; i < 5; i++) {
      this.coins.push(new Coin(73 * 32 + i * 32, 4 * 32));
    }
    // Coins after second pit
    for (let i = 0; i < 4; i++) {
      this.coins.push(new Coin(118 * 32 + i * 32, 8 * 32));
    }
    // Scattered coins throughout level
    this.coins.push(new Coin(50 * 32, 9 * 32));
    this.coins.push(new Coin(85 * 32, 8 * 32));
    this.coins.push(new Coin(100 * 32, 9 * 32));
    this.coins.push(new Coin(140 * 32, 8 * 32));
    this.coins.push(new Coin(160 * 32, 9 * 32));

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

    // Update power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      if (powerUp.collected) return false;
      powerUp.update(this.level);
      powerUp.checkCollision(this.player);
      return true;
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

    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx, this.camera));

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
window.game = new Game();
console.log('🍄 Super Mario Bros Clone loaded! Press START GAME to play! 🍄');
