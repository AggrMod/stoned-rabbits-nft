export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.dead = false;
    }

    update(physics, level) { }
    draw(ppu) { }
}

export class Player extends Entity {
    constructor(x, y) {
        // Hitbox: 20x24 (Tighter than visual 32x32)
        super(x, y, 20, 24);
        this.state = 'IDLE';
        this.facingRight = true;
        this.animTimer = 0;
        this.score = 0;
        this.isBig = false;

        // Game Feel Timers
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
    }

    grow() {
        this.isBig = true;
        // TODO: Play grow sound
    }

    update(input, physics, level, audio) {
        // 1. Timers
        if (this.grounded) {
            this.coyoteTimer = 6; // 6 frames grace period
        } else {
            this.coyoteTimer--;
        }

        if (input.isJustPressed('A')) {
            this.jumpBuffer = 10; // Remember jump for 10 frames
        } else {
            this.jumpBuffer--;
        }

        // 2. Horizontal Movement
        let maxSpeed = physics.maxSpeed;
        if (input.isPressed('B')) {
            maxSpeed = 3.5; // Dash Speed
        }

        if (input.isPressed('RIGHT')) {
            this.vx += physics.acceleration;
            if (this.vx > maxSpeed) this.vx = maxSpeed;
            this.facingRight = true;
            this.state = 'RUN';
        } else if (input.isPressed('LEFT')) {
            this.vx -= physics.acceleration;
            if (this.vx < -maxSpeed) this.vx = -maxSpeed;
            this.facingRight = false;
            this.state = 'RUN';
        } else {
            physics.applyFriction(this);
            this.state = 'IDLE';
        }

        // 3. Jump Logic (Buffer + Coyote)
        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
            this.vy = physics.jumpForce;
            this.grounded = false;
            this.coyoteTimer = 0;
            this.jumpBuffer = 0;
            if (audio) audio.playJump();
        }

        // 4. Physics
        physics.applyGravity(this, input);
        physics.update(this, level); // Moves and Resolves Collision

        // Double check grounded state with raycast
        if (physics.isOnGround(this, level) && this.vy >= 0) {
            this.grounded = true;
            this.vy = 0; // Stop falling if we are on ground
        }

        // 5. State Override
        if (!this.grounded) {
            this.state = 'JUMP';
        }

        this.animTimer++;
    }

    stompEnemy(enemy) {
        this.vy = -4; // Bounce off
        enemy.stomp();
        this.score += 100;
    }

    draw(ppu) {
        let sprite = 'player_idle';
        let frame = Math.floor(this.animTimer / 15);

        if (this.state === 'RUN') {
            sprite = 'player_run';
            frame = Math.floor(this.animTimer / 6);
        }

        // Draw X: Entity X + Offset
        let drawX = this.x + offsetX;

        // Draw Y: Entity Bottom - Sprite Height
        let drawY = (this.y + this.height) - destH + offsetY;

        ppu.renderSprite(sprite, frame, drawX, drawY, !this.facingRight, scale);

        // Debug Hitbox (ENABLED)
        ppu.ctx.strokeStyle = 'red';
        ppu.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = -0.5;
        this.animTimer = 0;
        this.squished = false;
        this.stompTimer = 0;
    }

    update(physics, level) {
        if (this.squished) {
            this.stompTimer++;
            if (this.stompTimer > 30) this.dead = true;
            return;
        }

        if (!this.direction) this.direction = -1;
        this.vx = this.direction * 0.5;

        physics.applyGravity(this, null);

        const prevX = this.x;
        physics.update(this, level);

        // Turn at walls
        if (Math.abs(this.x - prevX) < 0.1) {
            this.direction *= -1;
        }

        this.animTimer++;
    }

    draw(ppu) {
        if (this.squished) {
            ppu.renderSprite('goomba_walk', 0, this.x - 8, this.y - 8 + 8, false);
        } else {
            const frame = Math.floor(this.animTimer / 10);
            ppu.renderSprite('goomba_walk', frame, this.x - 8, this.y - 8, false);
        }
    }
}

export class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = 1.0;
        this.direction = 1;
        this.emerging = true;
        this.emergeTimer = 0;
        this.targetY = y - 16;
    }

    update(physics, level) {
        if (this.emerging) {
            this.y -= 0.5;
            if (this.y <= this.targetY) {
                this.y = this.targetY;
                this.emerging = false;
            }
            return;
        }

        this.vx = this.direction * 1.0;
        physics.applyGravity(this, null);

        const prevX = this.x;
        physics.update(this, level);

        if (Math.abs(this.x - prevX) < 0.1) {
            this.direction *= -1;
        }
    }

    draw(ppu) {
        ppu.renderSprite('mushroom', 0, this.x - 8, this.y - 8, false);
    }
}

export class Particle extends Entity {
    constructor(x, y) {
        super(x, y, 4, 4);
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -Math.random() * 4 - 2;
        this.life = 60;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    draw(ppu) {
        ppu.ctx.fillStyle = 'rgba(255, 255, 0, ' + (this.life / 60) + ')';
        ppu.ctx.fillRect(this.x, this.y, 4, 4);
    }
}
