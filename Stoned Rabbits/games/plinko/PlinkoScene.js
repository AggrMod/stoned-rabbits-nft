/**
 * Stoned Rabbits Plinko Game Scene
 * Main game logic for Plinko with NFT integration
 */

class PlinkoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlinkoScene' });

    // Game state
    this.userNFTs = [];
    this.selectedNFT = null;
    this.walletPublicKey = null;
    this.balance = 0;
    this.currentBet = 0.1;
    this.multipliers = [0.2, 0.5, 1, 2, 5, 10, 5, 2, 1, 0.5, 0.2];
    this.isDropping = false;
    this.totalWinnings = 0;

    // Game configuration
    this.boardWidth = 600;
    this.boardHeight = 700;
    this.boardX = 200;
    this.boardY = 50;
    this.pegRows = 12;
    this.pegSpacing = 45;
    this.ballRadius = 12;
  }

  init(data) {
    // Receive wallet data from main initialization
    this.walletPublicKey = data.walletPublicKey || null;
    this.userNFTs = data.nfts || [];
    this.balance = data.balance || 1.0; // Demo balance
  }

  preload() {
    // Create simple graphics programmatically (no external assets needed initially)
    // This allows the game to work immediately without asset dependencies

    // Create peg graphic
    const pegGraphics = this.add.graphics();
    pegGraphics.fillStyle(0xffffff, 1);
    pegGraphics.fillCircle(8, 8, 8);
    pegGraphics.generateTexture('peg', 16, 16);
    pegGraphics.destroy();

    // Create ball graphic (will be replaced with NFT image if available)
    const ballGraphics = this.add.graphics();
    ballGraphics.fillStyle(0xff6b35, 1);
    ballGraphics.fillCircle(12, 12, 12);
    ballGraphics.lineStyle(2, 0xffffff, 1);
    ballGraphics.strokeCircle(12, 12, 12);
    ballGraphics.generateTexture('default-ball', 24, 24);
    ballGraphics.destroy();

    // Create multiplier zone backgrounds
    const multColors = [0xff4444, 0xff8844, 0xffaa44, 0xffdd44, 0x44ff44,
                        0x00ff00, 0x44ff44, 0xffdd44, 0xffaa44, 0xff8844, 0xff4444];

    multColors.forEach((color, index) => {
      const zoneGraphics = this.add.graphics();
      zoneGraphics.fillStyle(color, 0.8);
      zoneGraphics.fillRoundedRect(0, 0, 50, 60, 8);
      zoneGraphics.generateTexture(`mult-zone-${index}`, 50, 60);
      zoneGraphics.destroy();
    });

    // If user has NFTs, try to load first one as texture
    if (this.userNFTs && this.userNFTs.length > 0) {
      const firstNFT = this.userNFTs[0];
      if (firstNFT.image) {
        // Load NFT image
        this.load.image('nft-ball-0', firstNFT.image);
      }
    }
  }

  create() {
    // Background
    this.add.rectangle(400, 400, 800, 800, 0x0a0a0a);

    // Game board background
    const boardBg = this.add.graphics();
    boardBg.fillStyle(0x1a1a2e, 1);
    boardBg.fillRoundedRect(this.boardX - 20, this.boardY - 20,
                            this.boardWidth + 40, this.boardHeight + 40, 15);
    boardBg.lineStyle(3, 0x16213e, 1);
    boardBg.strokeRoundedRect(this.boardX - 20, this.boardY - 20,
                              this.boardWidth + 40, this.boardHeight + 40, 15);

    // Title
    this.add.text(400, 30, 'STONED RABBITS PLINKO', {
      fontSize: '32px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Create the Plinko board
    this.createBoard();

    // Create multiplier zones at bottom
    this.createMultiplierZones();

    // Create UI
    this.createUI();

    // Setup physics world
    this.matter.world.setBounds(this.boardX, this.boardY,
                                this.boardWidth, this.boardHeight);
    this.matter.world.on('collisionstart', this.handleCollision, this);

    // Instructions
    this.add.text(400, this.boardY - 10, 'Click above the board to drop a ball!', {
      fontSize: '16px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  createBoard() {
    // Create pegs in triangular/pyramid pattern
    const startX = this.boardX + this.boardWidth / 2;

    for (let row = 0; row < this.pegRows; row++) {
      const pegsInRow = row + 3; // Start with 3 pegs, increase each row
      const rowWidth = (pegsInRow - 1) * this.pegSpacing;
      const rowStartX = startX - rowWidth / 2;
      const y = this.boardY + 100 + row * this.pegSpacing;

      for (let col = 0; col < pegsInRow; col++) {
        const x = rowStartX + col * this.pegSpacing;

        // Create peg as static circle
        const peg = this.matter.add.circle(x, y, 8, {
          isStatic: true,
          restitution: 0.8,
          friction: 0.01,
          label: 'peg'
        });

        // Add peg sprite
        const pegSprite = this.add.image(x, y, 'peg');
        pegSprite.setTint(0x4ecdc4);
      }
    }
  }

  createMultiplierZones() {
    const zoneCount = this.multipliers.length;
    const zoneWidth = this.boardWidth / zoneCount;
    const zoneY = this.boardY + this.boardHeight - 70;

    this.multiplierZones = [];

    for (let i = 0; i < zoneCount; i++) {
      const x = this.boardX + i * zoneWidth;
      const centerX = x + zoneWidth / 2;

      // Zone background
      const zone = this.add.image(centerX, zoneY, `mult-zone-${i}`);
      zone.setDisplaySize(zoneWidth - 4, 60);

      // Multiplier text
      const multText = this.add.text(centerX, zoneY - 5, `${this.multipliers[i]}x`, {
        fontSize: '18px',
        fontFamily: 'Plus Jakarta Sans, Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Prize text
      const prizeText = this.add.text(centerX, zoneY + 15,
        `${(this.currentBet * this.multipliers[i]).toFixed(2)} SOL`, {
        fontSize: '12px',
        fontFamily: 'Plus Jakarta Sans, Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Store zone data
      this.multiplierZones.push({
        index: i,
        x: x,
        width: zoneWidth,
        multiplier: this.multipliers[i],
        centerX: centerX,
        prizeText: prizeText
      });

      // Create sensor zone for collision detection
      const sensor = this.matter.add.rectangle(
        centerX,
        this.boardY + this.boardHeight - 30,
        zoneWidth,
        40,
        {
          isStatic: true,
          isSensor: true,
          label: `multiplier-${i}`
        }
      );
    }
  }

  createUI() {
    const uiX = 50;
    const uiY = 150;

    // UI Panel background
    const uiPanel = this.add.graphics();
    uiPanel.fillStyle(0x16213e, 0.9);
    uiPanel.fillRoundedRect(20, uiY - 30, 140, 300, 10);
    uiPanel.lineStyle(2, 0x4ecdc4, 1);
    uiPanel.strokeRoundedRect(20, uiY - 30, 140, 300, 10);

    // Balance display
    this.add.text(uiX, uiY, 'BALANCE', {
      fontSize: '14px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.balanceText = this.add.text(uiX, uiY + 25, `${this.balance.toFixed(2)} SOL`, {
      fontSize: '20px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Bet amount controls
    this.add.text(uiX, uiY + 70, 'BET AMOUNT', {
      fontSize: '14px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.betText = this.add.text(uiX, uiY + 95, `${this.currentBet.toFixed(2)} SOL`, {
      fontSize: '18px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Bet adjustment buttons
    const decreaseBtn = this.createButton(uiX - 40, uiY + 130, '-', () => {
      this.changeBet(-0.05);
    });

    const increaseBtn = this.createButton(uiX + 40, uiY + 130, '+', () => {
      this.changeBet(0.05);
    });

    // Quick bet buttons
    const quickBets = [0.1, 0.5, 1.0];
    quickBets.forEach((amount, index) => {
      this.createButton(uiX, uiY + 170 + index * 35, `${amount} SOL`, () => {
        this.currentBet = amount;
        this.updateBetDisplay();
      }, true);
    });

    // Winnings display
    this.add.text(uiX, uiY + 280, 'TOTAL WON', {
      fontSize: '14px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.winningsText = this.add.text(uiX, uiY + 305, `${this.totalWinnings.toFixed(2)} SOL`, {
      fontSize: '18px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#44ff44',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // NFT selector info (if NFTs available)
    if (this.userNFTs && this.userNFTs.length > 0) {
      const nftY = 500;
      this.add.text(uiX, nftY, 'YOUR NFT', {
        fontSize: '14px',
        fontFamily: 'Plus Jakarta Sans, Arial',
        color: '#ffd166',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.add.text(uiX, nftY + 25, 'Using NFT\nas ball!', {
        fontSize: '12px',
        fontFamily: 'Plus Jakarta Sans, Arial',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5, 0);
    }
  }

  createButton(x, y, text, callback, wide = false) {
    const width = wide ? 120 : 50;
    const height = 30;

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x4ecdc4, 1);
    buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
    buttonBg.setInteractive(
      new Phaser.Geom.Rectangle(x - width/2, y - height/2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    // Button text
    const buttonText = this.add.text(x, y, text, {
      fontSize: wide ? '14px' : '18px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x5fddd6, 1);
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4ecdc4, 1);
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
    });

    buttonBg.on('pointerdown', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x3dbdb6, 1);
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
      callback();

      // Reset after delay
      this.time.delayedCall(100, () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x4ecdc4, 1);
        buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
      });
    });

    return buttonBg;
  }

  changeBet(amount) {
    this.currentBet = Math.max(0.05, Math.min(10, this.currentBet + amount));
    this.currentBet = Math.round(this.currentBet * 100) / 100; // Round to 2 decimals
    this.updateBetDisplay();
  }

  updateBetDisplay() {
    this.betText.setText(`${this.currentBet.toFixed(2)} SOL`);

    // Update prize amounts in multiplier zones
    this.multiplierZones.forEach(zone => {
      zone.prizeText.setText(`${(this.currentBet * zone.multiplier).toFixed(2)} SOL`);
    });
  }

  update() {
    // Game loop - can add continuous updates here if needed
  }

  dropBall(pointer) {
    // Don't drop if already dropping or insufficient balance
    if (this.isDropping || this.balance < this.currentBet) {
      if (this.balance < this.currentBet) {
        this.showMessage('Insufficient balance!', 0xff4444);
      }
      return;
    }

    // Deduct bet from balance
    this.balance -= this.currentBet;
    this.updateBalanceDisplay();
    this.isDropping = true;

    // Drop position (within top third of board, centered horizontally)
    const dropX = this.boardX + this.boardWidth / 2 + (Math.random() - 0.5) * 40;
    const dropY = this.boardY + 50;

    // Determine ball texture (use NFT if available)
    let ballTexture = 'default-ball';
    if (this.userNFTs && this.userNFTs.length > 0 && this.textures.exists('nft-ball-0')) {
      ballTexture = 'nft-ball-0';
    }

    // Create ball
    const ball = this.matter.add.sprite(dropX, dropY, ballTexture, null, {
      shape: 'circle',
      radius: this.ballRadius,
      restitution: 0.7,
      friction: 0.001,
      frictionAir: 0.01,
      density: 0.001,
      label: 'ball'
    });

    ball.setCircle(this.ballRadius);
    ball.setScale(this.ballRadius * 2 / 24); // Scale to correct size
    ball.setBounce(0.7);

    // Add slight random initial velocity
    ball.setVelocity((Math.random() - 0.5) * 0.5, 1);

    // Track this ball for multiplier detection
    ball.setData('betAmount', this.currentBet);
    ball.setData('active', true);

    // Auto-cleanup after ball settles
    this.time.delayedCall(8000, () => {
      if (ball && ball.scene) {
        ball.destroy();
        this.isDropping = false;
      }
    });
  }

  handleCollision(event) {
    event.pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;

      // Check if ball hit a multiplier zone
      const ball = bodyA.label === 'ball' ? bodyA : (bodyB.label === 'ball' ? bodyB : null);
      const multiplier = bodyA.label?.startsWith('multiplier') ? bodyA :
                        (bodyB.label?.startsWith('multiplier') ? bodyB : null);

      if (ball && multiplier && ball.gameObject?.getData('active')) {
        // Get multiplier index
        const zoneIndex = parseInt(multiplier.label.split('-')[1]);
        const mult = this.multipliers[zoneIndex];

        // Calculate winnings
        const betAmount = ball.gameObject.getData('betAmount');
        const winAmount = betAmount * mult;

        // Award winnings
        this.balance += winAmount;
        this.totalWinnings += (winAmount - betAmount);

        // Mark ball as processed
        ball.gameObject.setData('active', false);

        // Update displays
        this.updateBalanceDisplay();
        this.updateWinningsDisplay();

        // Show win message
        this.showWinMessage(mult, winAmount, this.multiplierZones[zoneIndex].centerX);

        // Visual feedback on zone
        this.flashMultiplierZone(zoneIndex);

        // Destroy ball after short delay
        this.time.delayedCall(500, () => {
          if (ball.gameObject && ball.gameObject.scene) {
            ball.gameObject.destroy();
          }
          this.isDropping = false;
        });
      }
    });
  }

  showWinMessage(multiplier, amount, x) {
    const message = multiplier >= 5 ? 'BIG WIN!' : (multiplier >= 2 ? 'WIN!' : 'Win');
    const color = multiplier >= 5 ? '#00ff00' : (multiplier >= 2 ? '#ffdd44' : '#ffffff');

    const winText = this.add.text(x, this.boardY + this.boardHeight - 150,
      `${message}\n${multiplier}x\n+${amount.toFixed(2)} SOL`, {
      fontSize: multiplier >= 5 ? '24px' : '18px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: color,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Animate text
    this.tweens.add({
      targets: winText,
      y: winText.y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        winText.destroy();
      }
    });
  }

  flashMultiplierZone(index) {
    const zone = this.multiplierZones[index];
    // Create flash effect
    const flash = this.add.rectangle(
      zone.centerX,
      this.boardY + this.boardHeight - 70,
      zone.width - 4,
      60,
      0xffffff,
      0.5
    );

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  updateBalanceDisplay() {
    this.balanceText.setText(`${this.balance.toFixed(2)} SOL`);

    // Flash balance
    this.tweens.add({
      targets: this.balanceText,
      scale: 1.2,
      duration: 200,
      yoyo: true
    });
  }

  updateWinningsDisplay() {
    const color = this.totalWinnings >= 0 ? '#44ff44' : '#ff4444';
    this.winningsText.setText(`${this.totalWinnings.toFixed(2)} SOL`);
    this.winningsText.setColor(color);

    // Flash winnings
    this.tweens.add({
      targets: this.winningsText,
      scale: 1.3,
      duration: 200,
      yoyo: true
    });
  }

  showMessage(text, color = 0xffffff) {
    const message = this.add.text(400, 400, text, {
      fontSize: '24px',
      fontFamily: 'Plus Jakarta Sans, Arial',
      color: '#' + color.toString(16),
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: message,
      y: 350,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        message.destroy();
      }
    });
  }
}
