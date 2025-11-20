# Frontend Development Guide

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Design System](#design-system)
4. [Component Library](#component-library)
5. [State Management](#state-management)
6. [Wallet Integration](#wallet-integration)
7. [Best Practices](#best-practices)

---

## Overview

The frontend consists of two distinct visual identities:
- **Stoned Rabbits** - Custom CSS with dark theme and vibrant accents
- **NFT Utility Factory** - Tailwind CSS with glassmorphism effects

---

## Project Structure

```
stoned-rabbits-nft/
├── Stoned Rabbits/
│   ├── index.html              # Main landing page
│   ├── pages/
│   │   ├── revenue-pass.html   # Revenue Pass info
│   │   └── lottery.html        # Lottery system
│   ├── css/
│   │   ├── style.css           # Main styles
│   │   └── responsive.css      # Media queries
│   ├── js/
│   │   ├── app.js              # Main application logic
│   │   ├── wallet.js           # Wallet integration
│   │   └── nft.js              # NFT operations
│   ├── images/                 # Assets
│   └── fonts/                  # Custom fonts
│
└── NFT Utility Factory/
    ├── index.html              # Main factory page
    ├── css/
    │   └── styles.css          # Tailwind utilities
    └── js/
        └── form-handler.js     # Form submissions
```

---

## Design System

### Color Palette

#### Stoned Rabbits
```css
:root {
  /* Primary Colors */
  --primary-green: #237253;
  --primary-orange: #ed683e;
  --accent-gold: #ffd166;

  /* Backgrounds */
  --bg-dark: #0a0a0a;
  --bg-darker: #000000;
  --bg-card: rgba(255, 255, 255, 0.03);

  /* Borders & Effects */
  --border-subtle: rgba(255, 255, 255, 0.1);
  --glass-effect: rgba(255, 255, 255, 0.06);
  --shadow-glow: rgba(255, 209, 102, 0.3);

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
}
```

#### NFT Utility Factory
```javascript
// Tailwind config
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#237253',
        secondary: '#ed683e',
        accent: '#ffd166',
        bg1: '#000',
        bg2: '#0a0a0a',
        border: 'rgba(255, 255, 255, 0.12)',
        glass: 'rgba(255, 255, 255, 0.06)'
      }
    }
  }
}
```

### Typography

```css
/* Headings */
h1 { font-size: 3.5rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 2.5rem; font-weight: 600; line-height: 1.3; }
h3 { font-size: 1.875rem; font-weight: 600; line-height: 1.4; }
h4 { font-size: 1.5rem; font-weight: 500; line-height: 1.5; }

/* Body Text */
body { font-family: 'Inter', -apple-system, sans-serif; font-size: 1rem; line-height: 1.6; }
p { margin-bottom: 1rem; }

/* Small Text */
.small { font-size: 0.875rem; color: var(--text-secondary); }
.tiny { font-size: 0.75rem; color: var(--text-muted); }
```

### Spacing System

```css
/* 8px base unit */
--space-1: 0.5rem;   /* 8px */
--space-2: 1rem;     /* 16px */
--space-3: 1.5rem;   /* 24px */
--space-4: 2rem;     /* 32px */
--space-6: 3rem;     /* 48px */
--space-8: 4rem;     /* 64px */
--space-12: 6rem;    /* 96px */
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

---

## Component Library

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-green), var(--primary-orange));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(237, 104, 62, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid var(--border-subtle);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent-gold);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--accent-gold);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  background: rgba(255, 209, 102, 0.1);
}
```

### Cards

```css
/* Glass Card */
.card-glass {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all 0.3s ease;
}

.card-glass:hover {
  transform: translateY(-5px);
  border-color: var(--accent-gold);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Feature Card */
.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-green), var(--primary-orange));
}

/* Stat Card */
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
}

.stat-card .stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--accent-gold);
  display: block;
  text-shadow: 0 0 20px rgba(255, 209, 102, 0.5);
}

.stat-card .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Forms

```css
/* Input */
input, textarea, select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent-gold);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(255, 209, 102, 0.1);
}

select option {
  background: #111;
  color: white;
}

/* Label */
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Checkbox */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
```

### Modals

```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

/* Modal Content */
.modal-content {
  background: var(--bg-dark);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Notifications

```css
/* Toast Notification */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 2000;
  animation: slideInRight 0.3s ease;
}

.toast.success { border-left: 4px solid #10b981; }
.toast.error { border-left: 4px solid #ef4444; }
.toast.info { border-left: 4px solid #3b82f6; }

@keyframes slideInRight {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## State Management

### Global State

```javascript
// Simple state management
const AppState = {
  // Wallet
  wallet: {
    connected: false,
    address: null,
    provider: null,
    balance: 0
  },

  // NFTs
  nfts: {
    loading: false,
    data: [],
    error: null
  },

  // UI
  ui: {
    showWalletModal: false,
    showNFTModal: false,
    notifications: []
  },

  // Methods
  setWallet(data) {
    this.wallet = { ...this.wallet, ...data };
    this.saveToLocalStorage();
    this.notifySubscribers();
  },

  setNFTs(data) {
    this.nfts = { ...this.nfts, ...data };
    this.notifySubscribers();
  },

  toggleModal(modalName) {
    this.ui[modalName] = !this.ui[modalName];
    this.notifySubscribers();
  },

  addNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    this.ui.notifications.push(notification);
    this.notifySubscribers();

    // Auto-remove after 5 seconds
    setTimeout(() => this.removeNotification(notification.id), 5000);
  },

  removeNotification(id) {
    this.ui.notifications = this.ui.notifications.filter(n => n.id !== id);
    this.notifySubscribers();
  },

  // Persistence
  saveToLocalStorage() {
    localStorage.setItem('appState', JSON.stringify({
      wallet: { address: this.wallet.address }
    }));
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem('appState');
    if (saved) {
      const data = JSON.parse(saved);
      this.wallet.address = data.wallet?.address || null;
    }
  },

  // Observer pattern
  subscribers: [],
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  },
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this));
  }
};

// Initialize
AppState.loadFromLocalStorage();
```

### Usage

```javascript
// Subscribe to state changes
AppState.subscribe((state) => {
  if (state.wallet.connected) {
    updateWalletUI(state.wallet.address);
  }

  // Update notifications
  renderNotifications(state.ui.notifications);
});

// Update state
AppState.setWallet({
  connected: true,
  address: 'FR1Lz5mt...',
  balance: 1.5
});

// Show notification
AppState.addNotification('Wallet connected successfully!', 'success');
```

---

## Wallet Integration

### Multi-Wallet Detection

```javascript
// Get all available wallet providers
function getAllProviders() {
  const w = window;
  const providers = new Set();

  // Check for injected providers
  if (w?.solana?.providers) {
    w.solana.providers.forEach(p => providers.add(p));
  } else if (w?.solana) {
    providers.add(w.solana);
  }

  // Check specific wallets
  if (w?.phantom?.solana) providers.add(w.phantom.solana);
  if (w?.solflare) providers.add(w.solflare);
  if (w?.backpack?.solana) providers.add(w.backpack.solana);

  return Array.from(providers);
}

// Wallet connection UI
function showWalletModal() {
  const providers = getAllProviders();

  if (providers.length === 0) {
    showNotification('No wallet found. Please install Phantom, Solflare, or Backpack.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Connect Wallet</h3>
      <div class="wallet-options">
        ${providers.map((provider, index) => `
          <button class="wallet-option" data-index="${index}">
            <img src="images/${getProviderIcon(provider)}" alt="${getProviderName(provider)}">
            <span>${getProviderName(provider)}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle wallet selection
  modal.querySelectorAll('.wallet-option').forEach((btn, index) => {
    btn.addEventListener('click', () => connectWallet(providers[index]));
  });
}

// Connect to selected wallet
async function connectWallet(provider) {
  try {
    await provider.connect();
    const address = provider.publicKey.toString();

    AppState.setWallet({
      connected: true,
      address,
      provider
    });

    AppState.addNotification('Wallet connected!', 'success');
    closeModal();

    // Fetch user NFTs
    await fetchUserNFTs(address);
  } catch (error) {
    console.error('Wallet connection failed:', error);
    AppState.addNotification('Failed to connect wallet', 'error');
  }
}
```

---

## Best Practices

### Performance

1. **Lazy Load Images**
   ```html
   <img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" alt="NFT">
   ```

2. **Debounce Search**
   ```javascript
   function debounce(func, wait) {
     let timeout;
     return function(...args) {
       clearTimeout(timeout);
       timeout = setTimeout(() => func.apply(this, args), wait);
     };
   }

   const searchNFTs = debounce((query) => {
     // Search logic
   }, 300);
   ```

3. **Cache API Responses**
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

   async function cachedFetch(url) {
     const cached = cache.get(url);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }

     const data = await fetch(url).then(r => r.json());
     cache.set(url, { data, timestamp: Date.now() });
     return data;
   }
   ```

### Accessibility

```html
<!-- ARIA labels -->
<button aria-label="Connect Wallet">
  <i class="fas fa-wallet"></i>
</button>

<!-- Focus management -->
<style>
  *:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
</style>

<!-- Keyboard navigation -->
<script>
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
</script>
```

### Mobile Responsive

```css
/* Mobile First Approach */
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  .card-grid { grid-template-columns: 1fr; }
  .btn { width: 100%; }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
