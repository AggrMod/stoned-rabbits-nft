// Wallet Integration for Stoned Rabbits NFT
// Supports: Phantom, Solflare, Backpack

// ==================== PROVIDER DETECTION ====================

function getAllProviders() {
  const w = window;
  const providers = new Set();

  // Check for multiple providers injected by wallets
  if (Array.isArray(w?.solana?.providers)) {
    w.solana.providers.forEach(p => p && providers.add(p));
  } else if (w?.solana && !Array.isArray(w.solana.providers)) {
    providers.add(w.solana);
  }

  // Check specific wallet injections
  if (w?.phantom?.solana) providers.add(w.phantom.solana);
  if (w?.solflare) providers.add(w.solflare);
  if (w?.backpack?.solana) providers.add(w.backpack.solana);

  return Array.from(providers);
}

function getProviderName(provider) {
  if (provider.isPhantom) return 'Phantom';
  if (provider.isSolflare) return 'Solflare';
  if (provider.isBackpack) return 'Backpack';
  return 'Unknown Wallet';
}

function getProviderIcon(provider) {
  const name = getProviderName(provider).toLowerCase();
  return `images/${name}-icon.png`;
}

// ==================== CONNECTION FLOW ====================

function showWalletModal() {
  const providers = getAllProviders();

  if (providers.length === 0) {
    showError(
      'No Solana wallet detected!\n\n' +
      'Please install:\n' +
      '• Phantom: https://phantom.app\n' +
      '• Solflare: https://solflare.com\n' +
      '• Backpack: https://backpack.app'
    );
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'wallet-modal';

  modal.innerHTML = `
    <div class="modal-content glass-card">
      <button class="modal-close" onclick="closeWalletModal()">&times;</button>
      <h3>Connect Wallet</h3>
      <p class="text-secondary">Choose your preferred wallet:</p>

      <div class="wallet-options">
        ${providers.map((provider, index) => `
          <button
            class="wallet-option"
            onclick="selectWallet(${index})"
            data-provider-index="${index}"
          >
            <img
              src="${getProviderIcon(provider)}"
              alt="${getProviderName(provider)}"
              width="40"
              height="40"
              onerror="this.src='images/wallet-icon.png'"
            >
            <span>${getProviderName(provider)}</span>
            ${provider.isPhantom ? '<span class="badge">Popular</span>' : ''}
          </button>
        `).join('')}
      </div>

      <button class="btn-ghost" onclick="closeWalletModal()">
        Cancel
      </button>

      <p class="small text-muted mt-4">
        New to Solana?
        <a href="https://docs.solana.com/wallet-guide" target="_blank">
          Learn about wallets →
        </a>
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  // Store providers for selection
  window._walletProviders = providers;

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeWalletModal();
    }
  });
}

function closeWalletModal() {
  const modal = document.getElementById('wallet-modal');
  if (modal) {
    modal.remove();
  }
}

async function selectWallet(providerIndex) {
  const provider = window._walletProviders[providerIndex];

  try {
    closeWalletModal();
    showLoading('Connecting wallet...');

    // Connect to provider
    await provider.connect();

    // Get public key
    const publicKey = provider.publicKey.toString();

    // Get balance
    const connection = getConnection();
    const balance = await connection.getBalance(provider.publicKey);

    // Store in global state
    window.provider = provider;
    window.publicKey = publicKey;

    // Save connection preference
    saveWalletConnection(publicKey);

    // Update UI
    updateWalletUI(publicKey, balance);

    // Setup event listeners
    setupWalletEventListeners(provider);

    // Show success
    showSuccess(`Connected to ${getProviderName(provider)}!`);

    // Fetch user NFTs (if NFT page)
    if (typeof fetchUserNFTs === 'function') {
      await fetchUserNFTs(publicKey);
    }

  } catch (error) {
    console.error('Connection failed:', error);
    handleWalletError(error);
  } finally {
    hideLoading();
  }
}

// ==================== UI UPDATES ====================

function updateWalletUI(address, balance) {
  // Update connect button
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn) {
    connectBtn.innerHTML = `
      <i class="fas fa-wallet"></i>
      ${address.slice(0, 4)}...${address.slice(-4)}
    `;
    connectBtn.classList.add('connected');
  }

  // Show disconnect option
  const disconnectBtn = document.getElementById('disconnect-btn');
  if (disconnectBtn) {
    disconnectBtn.style.display = 'block';
  }

  // Display balance
  const balanceEl = document.getElementById('wallet-balance');
  if (balanceEl) {
    balanceEl.textContent = `${(balance / 1e9).toFixed(4)} SOL`;
  }

  // Enable wallet-dependent features
  document.querySelectorAll('[data-requires-wallet]').forEach(el => {
    el.disabled = false;
    el.classList.remove('disabled');
  });
}

// ==================== DISCONNECT FLOW ====================

async function disconnectWallet() {
  try {
    // Disconnect from provider
    if (window.provider?.disconnect) {
      await window.provider.disconnect();
    }

    // Clear state
    window.provider = null;
    window.publicKey = null;

    // Clear saved connection
    clearWalletConnection();

    // Update UI
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
      connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
      connectBtn.classList.remove('connected');
    }

    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
      disconnectBtn.style.display = 'none';
    }

    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = '';
    }

    // Disable wallet-dependent features
    document.querySelectorAll('[data-requires-wallet]').forEach(el => {
      el.disabled = true;
      el.classList.add('disabled');
    });

    // Clear NFT display
    if (typeof clearNFTDisplay === 'function') {
      clearNFTDisplay();
    }

    showSuccess('Wallet disconnected');

  } catch (error) {
    console.error('Disconnect failed:', error);
    showError('Failed to disconnect wallet');
  }
}

// ==================== EVENT LISTENERS ====================

function setupWalletEventListeners(provider) {
  // Account changed
  provider.on('accountChanged', (publicKey) => {
    if (publicKey) {
      console.log('Account changed to:', publicKey.toString());

      // Update state
      window.publicKey = publicKey.toString();

      // Refresh NFTs
      if (typeof fetchUserNFTs === 'function') {
        fetchUserNFTs(publicKey.toString());
      }

      showInfo('Wallet account changed');
    } else {
      // Disconnected
      disconnectWallet();
    }
  });

  // Disconnect event
  provider.on('disconnect', () => {
    console.log('Wallet disconnected');
    disconnectWallet();
  });

  // Network changed (Phantom only)
  if (provider.isPhantom) {
    provider.on('connect', () => {
      const network = provider._network;
      console.log('Connected to network:', network);

      if (network !== 'mainnet-beta') {
        showWarning(
          `Connected to ${network}.\n\n` +
          'Please switch to Mainnet Beta for full functionality.'
        );
      }
    });
  }
}

// ==================== AUTO-RECONNECT ====================

async function checkPreviousConnection() {
  // Check if user was previously connected
  const savedAddress = localStorage.getItem('wallet_address');

  if (!savedAddress) return;

  const providers = getAllProviders();

  for (const provider of providers) {
    try {
      // Try to connect eagerly (without popup)
      await provider.connect({ onlyIfTrusted: true });

      if (provider.publicKey.toString() === savedAddress) {
        window.provider = provider;
        window.publicKey = savedAddress;

        updateWalletUI(savedAddress, 0);

        // Setup event listeners
        setupWalletEventListeners(provider);

        // Fetch balance
        const connection = getConnection();
        const balance = await connection.getBalance(provider.publicKey);

        const balanceEl = document.getElementById('wallet-balance');
        if (balanceEl) {
          balanceEl.textContent = `${(balance / 1e9).toFixed(4)} SOL`;
        }

        // Fetch NFTs
        if (typeof fetchUserNFTs === 'function') {
          await fetchUserNFTs(savedAddress);
        }

        console.log('Auto-reconnected to wallet');
        return;
      }
    } catch (error) {
      // Silent fail, user needs to manually connect
      continue;
    }
  }

  // Clear saved address if couldn't reconnect
  localStorage.removeItem('wallet_address');
}

function saveWalletConnection(address) {
  localStorage.setItem('wallet_address', address);
}

function clearWalletConnection() {
  localStorage.removeItem('wallet_address');
}

// ==================== TRANSACTION SIGNING ====================

async function signAndSendTransaction(transaction) {
  if (!window.provider || !window.provider.isConnected) {
    throw new Error('Wallet not connected');
  }

  try {
    const connection = getConnection();

    // Set recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('finalized');

    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = window.provider.publicKey;

    // Sign transaction
    const signed = await window.provider.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signed.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      }
    );

    // Confirm transaction
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    return signature;

  } catch (error) {
    console.error('Transaction failed:', error);

    // Parse common errors
    if (error.message.includes('User rejected')) {
      throw new Error('Transaction rejected by user');
    }

    if (error.message.includes('insufficient')) {
      throw new Error('Insufficient SOL for transaction fees');
    }

    if (error.message.includes('Blockhash not found')) {
      throw new Error('Transaction expired, please try again');
    }

    throw error;
  }
}

async function signMessage(message) {
  if (!window.provider || !window.provider.signMessage) {
    throw new Error('Wallet does not support message signing');
  }

  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await window.provider.signMessage(encodedMessage);

    return {
      signature: Buffer.from(signature.signature).toString('hex'),
      publicKey: signature.publicKey.toString()
    };

  } catch (error) {
    console.error('Message signing failed:', error);

    if (error.code === 4001) {
      throw new Error('Message signing rejected by user');
    }

    throw error;
  }
}

// ==================== MOBILE SUPPORT ====================

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function openInPhantomMobile() {
  const dappUrl = encodeURIComponent(window.location.href);
  const deepLink = `https://phantom.app/ul/browse/${dappUrl}?ref=${window.location.origin}`;
  window.location.href = deepLink;
}

function openInSolflareMobile() {
  const dappUrl = encodeURIComponent(window.location.href);
  window.location.href = `https://solflare.com/ul/v1/browse/${dappUrl}`;
}

function showMobileWalletOptions() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'mobile-wallet-modal';

  modal.innerHTML = `
    <div class="modal-content glass-card">
      <h3>Connect Mobile Wallet</h3>

      <button class="wallet-option" onclick="openInPhantomMobile()">
        <img src="images/phantom-icon.png" alt="Phantom" width="40" height="40" onerror="this.src='images/wallet-icon.png'">
        <span>Open in Phantom</span>
      </button>

      <button class="wallet-option" onclick="openInSolflareMobile()">
        <img src="images/solflare-icon.png" alt="Solflare" width="40" height="40" onerror="this.src='images/wallet-icon.png'">
        <span>Open in Solflare</span>
      </button>

      <p class="small text-muted mt-4">
        Don't have a wallet?
        <a href="https://phantom.app/download" target="_blank">Download Phantom</a>
      </p>

      <button class="btn-ghost" onclick="this.closest('.modal-overlay').remove()">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

// ==================== ERROR HANDLING ====================

function handleWalletError(error) {
  const errorMessages = {
    // Connection errors
    4001: 'Connection rejected by user',
    4100: 'Wallet is not authorized',
    4900: 'Wallet is disconnected',

    // Transaction errors
    'User rejected': 'Transaction cancelled',
    'insufficient funds': 'Insufficient SOL for transaction',
    'Blockhash not found': 'Transaction expired',

    // Network errors
    'Failed to fetch': 'Network error, check your connection',
    'timeout': 'Request timed out, please try again'
  };

  const message = errorMessages[error.code] ||
                  errorMessages[error.message] ||
                  'An unexpected error occurred';

  showError(message);
  console.error('Wallet error:', error);
}

// ==================== UTILITY FUNCTIONS ====================

function requireWalletConnection() {
  if (!window.provider || !window.provider.isConnected) {
    showWalletModal();
    throw new Error('Wallet not connected');
  }
}

async function executeTransaction(tx, description) {
  showLoading(`${description}...`);

  try {
    const signature = await signAndSendTransaction(tx);

    showLoading('Confirming transaction...');

    const connection = getConnection();
    await connection.confirmTransaction(signature);

    showSuccess(
      `${description} successful!\n\n` +
      `<a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener noreferrer">View on Solscan</a>`
    );

    return signature;

  } catch (error) {
    handleWalletError(error);
    throw error;

  } finally {
    hideLoading();
  }
}

// ==================== INITIALIZATION ====================

// Call on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Auto-reconnect if previously connected
    checkPreviousConnection();

    // Setup connect button
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        if (isMobile() && getAllProviders().length === 0) {
          showMobileWalletOptions();
        } else {
          showWalletModal();
        }
      });
    }

    // Setup disconnect button
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', disconnectWallet);
    }
  });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showWalletModal,
    disconnectWallet,
    signAndSendTransaction,
    signMessage,
    requireWalletConnection,
    executeTransaction,
    getAllProviders,
    getProviderName
  };
}
