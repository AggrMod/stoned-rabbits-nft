/**
 * Stoned Rabbits Plinko Game - Main Initialization
 * Handles wallet connection, NFT loading, and game initialization
 */

// Global game instance
let game = null;
let walletPublicKey = null;
let userNFTs = [];

// Solana connection
const COLLECTION_ADDRESS = 'HL779o1Da5adreFHUmgmiJfWy6JJTRtJ2C641DandQq3';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

/**
 * Initialize the Plinko game
 */
async function initPlinkoGame() {
  console.log('Initializing Stoned Rabbits Plinko...');

  // Check if already initialized
  if (game) {
    console.log('Game already initialized');
    return;
  }

  // Phaser game configuration
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    parent: 'plinko-game-container',
    backgroundColor: '#0a0a0a',
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1.2 },
        debug: false, // Set to true for debugging
        enableSleeping: false
      }
    },
    scene: [PlinkoScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  // Create game instance
  game = new Phaser.Game(config);

  // Wait for game to be ready
  game.events.once('ready', () => {
    console.log('Plinko game ready!');

    // Start the scene with initialization data
    const scene = game.scene.getScene('PlinkoScene');
    scene.scene.restart({
      walletPublicKey: walletPublicKey,
      nfts: userNFTs,
      balance: 10.0 // Demo balance, replace with real balance
    });

    // Setup click handler for ball drops
    game.input.on('pointerdown', (pointer) => {
      const scene = game.scene.getScene('PlinkoScene');
      if (scene && scene.scene.isActive()) {
        // Only drop if clicking in drop zone (top of board)
        if (pointer.y < 150) {
          scene.dropBall(pointer);
        }
      }
    });
  });
}

/**
 * Connect to Solana wallet
 */
async function connectWallet() {
  try {
    // Check if wallet is available
    if (!window.solana) {
      alert('Please install Phantom wallet to play!');
      window.open('https://phantom.app/', '_blank');
      return false;
    }

    const provider = window.solana;

    // Show connecting message
    updateWalletStatus('Connecting...');

    // Connect to wallet
    const response = await provider.connect();
    walletPublicKey = response.publicKey.toString();

    console.log('Connected to wallet:', walletPublicKey);
    updateWalletStatus(`Connected: ${walletPublicKey.substring(0, 8)}...`);

    // Load user's NFTs
    await loadUserNFTs();

    // Enable play button
    enablePlayButton();

    return true;
  } catch (error) {
    console.error('Wallet connection failed:', error);
    updateWalletStatus('Connection failed. Try again.');
    return false;
  }
}

/**
 * Load user's Stoned Rabbits NFTs
 */
async function loadUserNFTs() {
  try {
    updateWalletStatus('Loading your NFTs...');

    // Create connection
    const connection = new solanaWeb3.Connection(RPC_ENDPOINT, 'confirmed');

    // Get token accounts for user
    const publicKey = new solanaWeb3.PublicKey(walletPublicKey);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    console.log(`Found ${tokenAccounts.value.length} token accounts`);

    // Filter for NFTs (amount = 1, decimals = 0)
    const nftAccounts = tokenAccounts.value.filter(account => {
      const amount = account.account.data.parsed.info.tokenAmount;
      return amount.decimals === 0 && amount.uiAmount === 1;
    });

    console.log(`Found ${nftAccounts.length} potential NFTs`);

    // For demo purposes, create mock NFTs if none found
    if (nftAccounts.length === 0) {
      console.log('No NFTs found, using demo data');
      userNFTs = [{
        name: 'Demo Stoned Rabbit',
        image: '../images/rabbits_6.jpg',
        mint: 'demo'
      }];
    } else {
      // In production, fetch metadata for each NFT
      // For now, use first NFT account
      userNFTs = [{
        name: 'Your Stoned Rabbit',
        image: '../images/rabbits_6.jpg', // Placeholder
        mint: nftAccounts[0].account.data.parsed.info.mint
      }];
    }

    console.log(`Loaded ${userNFTs.length} NFTs`);
    updateWalletStatus(`Connected | ${userNFTs.length} NFTs found`);

  } catch (error) {
    console.error('Failed to load NFTs:', error);
    // Use demo data on error
    userNFTs = [{
      name: 'Demo Stoned Rabbit',
      image: '../images/rabbits_6.jpg',
      mint: 'demo'
    }];
    updateWalletStatus(`Connected | Using demo NFT`);
  }
}

/**
 * Disconnect wallet
 */
async function disconnectWallet() {
  try {
    if (window.solana) {
      await window.solana.disconnect();
    }
    walletPublicKey = null;
    userNFTs = [];

    updateWalletStatus('Not connected');
    disablePlayButton();

    // Show connect button
    document.getElementById('connect-wallet-btn').style.display = 'inline-block';
    document.getElementById('disconnect-wallet-btn').style.display = 'none';

  } catch (error) {
    console.error('Disconnect failed:', error);
  }
}

/**
 * Update wallet status display
 */
function updateWalletStatus(status) {
  const statusElement = document.getElementById('wallet-status');
  if (statusElement) {
    statusElement.textContent = status;
  }
}

/**
 * Enable play button
 */
function enablePlayButton() {
  const playBtn = document.getElementById('play-plinko-btn');
  if (playBtn) {
    playBtn.disabled = false;
    playBtn.classList.remove('disabled');
    playBtn.textContent = 'START PLAYING';
  }

  // Show disconnect button
  document.getElementById('connect-wallet-btn').style.display = 'none';
  document.getElementById('disconnect-wallet-btn').style.display = 'inline-block';
}

/**
 * Disable play button
 */
function disablePlayButton() {
  const playBtn = document.getElementById('play-plinko-btn');
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.classList.add('disabled');
    playBtn.textContent = 'CONNECT WALLET TO PLAY';
  }
}

/**
 * Start playing (initialize game)
 */
function startPlaying() {
  // Hide intro, show game
  const intro = document.getElementById('game-intro');
  const gameContainer = document.getElementById('game-container');

  if (intro) intro.style.display = 'none';
  if (gameContainer) gameContainer.style.display = 'block';

  // Initialize game
  initPlinkoGame();
}

/**
 * Back to intro
 */
function backToIntro() {
  const intro = document.getElementById('game-intro');
  const gameContainer = document.getElementById('game-container');

  if (intro) intro.style.display = 'block';
  if (gameContainer) gameContainer.style.display = 'none';

  // Destroy game to free resources
  if (game) {
    game.destroy(true);
    game = null;
  }
}

// Auto-connect if wallet was previously connected
window.addEventListener('load', async () => {
  console.log('Page loaded, checking for wallet...');

  // Check if wallet is already connected
  if (window.solana && window.solana.isConnected) {
    console.log('Wallet already connected, auto-connecting...');
    const provider = window.solana;
    try {
      const response = await provider.connect({ onlyIfTrusted: true });
      walletPublicKey = response.publicKey.toString();
      await loadUserNFTs();
      enablePlayButton();
    } catch (error) {
      console.log('Auto-connect failed, user will need to connect manually');
    }
  }
});

// Wallet event listeners
if (window.solana) {
  window.solana.on('connect', () => {
    console.log('Wallet connected event');
  });

  window.solana.on('disconnect', () => {
    console.log('Wallet disconnected event');
    disconnectWallet();
  });

  window.solana.on('accountChanged', (publicKey) => {
    if (publicKey) {
      console.log('Account changed:', publicKey.toString());
      walletPublicKey = publicKey.toString();
      loadUserNFTs();
    } else {
      disconnectWallet();
    }
  });
}
