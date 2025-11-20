# Wallet Integration Component

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Overview

Multi-wallet support for Phantom, Solflare, and Backpack wallets across all pages.

---

## Supported Wallets

### 1. Phantom
- **Type:** Browser extension + mobile app
- **Website:** https://phantom.app
- **Detection:** `window.phantom?.solana`
- **Best for:** General users, beginners

### 2. Solflare
- **Type:** Browser extension + mobile app + web wallet
- **Website:** https://solflare.com
- **Detection:** `window.solflare`
- **Best for:** Advanced users, hardware wallet support

### 3. Backpack
- **Type:** Browser extension + mobile app
- **Website:** https://backpack.app
- **Detection:** `window.backpack?.solana`
- **Best for:** Multi-chain users (Solana + Ethereum)

---

## Provider Detection

### Get All Available Providers

```javascript
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
```

### Identify Provider

```javascript
function getProviderName(provider) {
  if (provider.isPhantom) return 'Phantom';
  if (provider.isSolflare) return 'Solflare';
  if (provider.isBackpack) return 'Backpack';
  return 'Unknown Wallet';
}

function getProviderIcon(provider) {
  const name = getProviderName(provider).toLowerCase();
  return `${name}-icon.png`;
}
```

---

## Connection Flow

### Step 1: Display Wallet Selection Modal

```javascript
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
    <div class="modal-content">
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
              src="images/${getProviderIcon(provider)}"
              alt="${getProviderName(provider)}"
              width="40"
              height="40"
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
}

function closeWalletModal() {
  const modal = document.getElementById('wallet-modal');
  if (modal) {
    modal.remove();
  }
}
```

### Step 2: Connect to Selected Wallet

```javascript
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
    const balance = await connection.getBalance(provider.publicKey);

    // Store in app state
    window.provider = provider;
    window.publicKey = publicKey;

    AppState.setWallet({
      connected: true,
      provider: getProviderName(provider),
      address: publicKey,
      balance: balance / solanaWeb3.LAMPORTS_PER_SOL
    });

    // Update UI
    updateWalletUI(publicKey, balance);

    // Show success
    showSuccess(`Connected to ${getProviderName(provider)}!`);

    // Fetch user NFTs
    await fetchUserNFTs(publicKey);

  } catch (error) {
    console.error('Connection failed:', error);

    if (error.code === 4001) {
      showError('Connection rejected. Please try again.');
    } else {
      showError(
        'Failed to connect wallet.\n\n' +
        'Possible issues:\n' +
        '• Wallet is locked\n' +
        '• Wrong network selected\n' +
        '• Extension needs refresh'
      );
    }
  } finally {
    hideLoading();
  }
}
```

### Step 3: Update UI After Connection

```javascript
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
```

---

## Disconnect Flow

```javascript
async function disconnectWallet() {
  try {
    // Disconnect from provider
    if (window.provider?.disconnect) {
      await window.provider.disconnect();
    }

    // Clear state
    window.provider = null;
    window.publicKey = null;

    AppState.setWallet({
      connected: false,
      provider: null,
      address: null,
      balance: 0
    });

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

    // Disable wallet-dependent features
    document.querySelectorAll('[data-requires-wallet]').forEach(el => {
      el.disabled = true;
      el.classList.add('disabled');
    });

    // Clear NFT display
    clearNFTDisplay();

    showSuccess('Wallet disconnected');

  } catch (error) {
    console.error('Disconnect failed:', error);
    showError('Failed to disconnect wallet');
  }
}
```

---

## Event Listeners

### Account Changed

```javascript
// Listen for account changes
if (window.provider) {
  window.provider.on('accountChanged', (publicKey) => {
    if (publicKey) {
      console.log('Account changed to:', publicKey.toString());

      // Update app state
      window.publicKey = publicKey.toString();
      AppState.setWallet({
        address: publicKey.toString()
      });

      // Refresh NFTs
      fetchUserNFTs(publicKey.toString());

      showInfo('Wallet account changed');
    } else {
      // Disconnected
      disconnectWallet();
    }
  });
}
```

### Disconnect Event

```javascript
window.provider.on('disconnect', () => {
  console.log('Wallet disconnected');
  disconnectWallet();
});
```

### Network Changed (Phantom only)

```javascript
if (window.provider.isPhantom) {
  window.provider.on('connect', () => {
    const network = window.provider._network;
    console.log('Connected to network:', network);

    if (network !== 'mainnet-beta') {
      showWarning(
        `Connected to ${network}.\n\n` +
        'Please switch to Mainnet Beta for full functionality.'
      );
    }
  });
}
```

---

## Auto-Reconnect

### Check for Previous Connection

```javascript
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

        AppState.setWallet({
          connected: true,
          provider: getProviderName(provider),
          address: savedAddress
        });

        updateWalletUI(savedAddress, 0);

        // Fetch balance & NFTs
        const balance = await connection.getBalance(provider.publicKey);
        AppState.setWallet({ balance: balance / 1e9 });

        await fetchUserNFTs(savedAddress);

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

// Call on page load
window.addEventListener('load', checkPreviousConnection);
```

### Save Connection Preference

```javascript
function saveWalletConnection(address) {
  localStorage.setItem('wallet_address', address);
}

function clearWalletConnection() {
  localStorage.removeItem('wallet_address');
}
```

---

## Transaction Signing

### Sign and Send Transaction

```javascript
async function signAndSendTransaction(transaction) {
  if (!window.provider || !window.provider.isConnected) {
    throw new Error('Wallet not connected');
  }

  try {
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
```

### Sign Message (Authentication)

```javascript
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

// Usage for authentication
async function authenticateWallet() {
  const challenge = `Sign this message to authenticate:\n\nTimestamp: ${Date.now()}`;

  const { signature, publicKey } = await signMessage(challenge);

  // Verify with backend
  const response = await fetch('/api/v1/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge, signature, publicKey })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('auth_token', data.token);
    return data.token;
  }

  throw new Error('Authentication failed');
}
```

---

## Mobile Wallet Support

### Deep Linking

```javascript
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

// Show mobile-specific connect options
function showMobileWalletOptions() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Connect Mobile Wallet</h3>

      <button class="wallet-option" onclick="openInPhantomMobile()">
        <img src="images/phantom-icon.png" alt="Phantom">
        <span>Open in Phantom</span>
      </button>

      <button class="wallet-option" onclick="openInSolflareMobile()">
        <img src="images/solflare-icon.png" alt="Solflare">
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
```

---

## Error Handling

### Common Errors

```javascript
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
```

---

## Best Practices

### 1. Always Check Connection Status

```javascript
function requireWalletConnection() {
  if (!window.provider || !window.provider.isConnected) {
    showWalletModal();
    throw new Error('Wallet not connected');
  }
}

// Usage
async function buyTickets() {
  requireWalletConnection();
  // ... proceed with purchase
}
```

### 2. Display Transaction Progress

```javascript
async function executeTransaction(tx, description) {
  showLoading(`${description}...`);

  try {
    const signature = await signAndSendTransaction(tx);

    showLoading('Confirming transaction...');

    await connection.confirmTransaction(signature);

    showSuccess(
      `${description} successful!\n\n` +
      `<a href="https://solscan.io/tx/${signature}" target="_blank">View on Solscan</a>`
    );

    return signature;

  } catch (error) {
    handleWalletError(error);
    throw error;

  } finally {
    hideLoading();
  }
}
```

### 3. Graceful Degradation

```javascript
// Show appropriate UI based on wallet availability
if (getAllProviders().length === 0) {
  // Show "Install Wallet" CTA
  document.getElementById('install-wallet-cta').style.display = 'block';
} else if (!window.provider) {
  // Show "Connect Wallet" button
  document.getElementById('connect-wallet-btn').style.display = 'block';
} else {
  // Show wallet-dependent features
  document.getElementById('wallet-features').style.display = 'block';
}
```

---

## Related Documentation

- [01-architecture.md](../01-architecture.md) - Wallet integration architecture
- [06-frontend-guide.md](../06-frontend-guide.md) - State management
- [07-security.md](../07-security.md) - Wallet security

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
