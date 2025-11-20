# Troubleshooting Guide

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Wallet Connection Issues](#wallet-connection-issues)
2. [Transaction Failures](#transaction-failures)
3. [NFT Display Problems](#nft-display-problems)
4. [API Errors](#api-errors)
5. [Smart Contract Issues](#smart-contract-issues)
6. [Performance Problems](#performance-problems)
7. [Browser Compatibility](#browser-compatibility)

---

## Wallet Connection Issues

### Issue: "No wallet detected"

**Symptoms:**
- Button shows "No wallet found"
- Extension is installed but not recognized

**Solutions:**

1. **Verify Extension Installation**
```bash
# Check if wallet extension is installed
# Chrome: chrome://extensions/
# Firefox: about:addons
```

2. **Refresh Page**
```javascript
// Sometimes wallet providers need page reload
window.location.reload();
```

3. **Check Browser Console**
```javascript
// Open DevTools (F12) and check:
console.log('Phantom:', window.phantom);
console.log('Solflare:', window.solflare);
console.log('Backpack:', window.backpack);
```

4. **Clear Cache**
```
Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Safari: Cmd+Option+E
```

5. **Try Different Browser**
- Phantom works best on Chrome/Brave
- Solflare supports all major browsers
- Backpack optimized for Chrome

### Issue: "Wallet connection rejected"

**Symptoms:**
- User clicks connect but nothing happens
- Connection popup appears then disappears

**Solutions:**

1. **Check Wallet Lock Status**
```
User needs to unlock wallet extension first
```

2. **Permissions**
```
Ensure wallet has permission to connect to site
Check wallet settings > Connected Sites
```

3. **Multiple Wallets**
```javascript
// If multiple wallets installed, specify which one
if (window.solana?.isPhantom) {
  await window.solana.connect();
} else if (window.solflare) {
  await window.solflare.connect();
}
```

### Issue: "Wrong network"

**Symptoms:**
- Wallet connected but to devnet/testnet
- Transactions fail with network error

**Solutions:**

1. **Check Network**
```javascript
const connection = new solanaWeb3.Connection(RPC_URL);
const genesisHash = await connection.getGenesisHash();
console.log('Network:', genesisHash);
// Mainnet: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d
```

2. **Switch Network in Wallet**
```
Phantom: Settings > Change Network > Mainnet Beta
Solflare: Settings > Network > Mainnet
```

---

## Transaction Failures

### Issue: "Transaction failed: insufficient funds"

**Symptoms:**
- Error: "Attempt to debit an account but found no record of a prior credit"
- Transaction rejected before signing

**Solutions:**

1. **Check SOL Balance**
```javascript
const balance = await connection.getBalance(publicKey);
console.log('Balance:', balance / solanaWeb3.LAMPORTS_PER_SOL, 'SOL');

// Need ~0.01 SOL for transaction fees
if (balance < 10_000_000) {
  alert('Insufficient SOL for transaction fees. Please add at least 0.01 SOL to your wallet.');
}
```

2. **Airdrop SOL (Devnet Only)**
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

3. **Buy SOL**
```
- Coinbase
- Binance
- Kraken
- Jupiter (DEX)
```

### Issue: "Transaction timeout"

**Symptoms:**
- Transaction pending for >60 seconds
- Eventually fails with timeout error

**Solutions:**

1. **Check Network Status**
```bash
# Solana status
curl https://status.solana.com/api/v2/status.json

# Helius status
curl https://mainnet.helius-rpc.com/health
```

2. **Retry with Higher Priority Fee**
```javascript
const transaction = new solanaWeb3.Transaction();

// Add compute budget instruction for higher priority
transaction.add(
  solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000 // Increase for faster processing
  })
);

transaction.add(yourInstruction);
```

3. **Use Different RPC**
```javascript
// Try fallback RPC
const fallbackRPC = 'https://api.mainnet-beta.solana.com';
const fallbackConnection = new solanaWeb3.Connection(fallbackRPC);
```

### Issue: "Transaction successful but changes not reflected"

**Symptoms:**
- Transaction confirmed on-chain
- UI not updated

**Solutions:**

1. **Wait for Confirmation**
```javascript
// Ensure proper confirmation level
await connection.confirmTransaction(signature, 'confirmed');
// Wait extra 2 seconds for indexers
await new Promise(resolve => setTimeout(resolve, 2000));
```

2. **Force Refresh**
```javascript
// Clear cache and refetch
cache.clear();
await fetchUserNFTs(walletAddress);
```

3. **Check Explorer**
```javascript
// Verify on Solscan
const explorerUrl = `https://solscan.io/tx/${signature}`;
console.log('Verify transaction:', explorerUrl);
```

---

## NFT Display Problems

### Issue: "NFTs not loading"

**Symptoms:**
- Spinner indefinitely
- Empty NFT grid
- "No NFTs found" message

**Solutions:**

1. **Check API Response**
```javascript
// Debug Helius API call
const url = `${HELIUS_RPC_URL}/v0/addresses/${wallet}/nfts?api-key=${API_KEY}`;
const response = await fetch(url);
console.log('Status:', response.status);
console.log('Data:', await response.json());
```

2. **Verify Collection Filter**
```javascript
// Ensure collection ID is correct
const COLLECTION_ID = '4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K';

const collectionNFTs = allNFTs.filter(nft =>
  nft.grouping?.some(g =>
    g.group_key === 'collection' &&
    g.group_value === COLLECTION_ID
  )
);

console.log('Found', collectionNFTs.length, 'NFTs in collection');
```

3. **Check CORS**
```javascript
// If CORS error, use proxy or server-side fetch
fetch(url, {
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Issue: "NFT images not displaying"

**Symptoms:**
- NFT loaded but image shows broken icon
- Alt text visible

**Solutions:**

1. **Check Image URL**
```javascript
console.log('Image URL:', nft.image);

// Arweave URLs should start with https://arweave.net/
// IPFS URLs need gateway: https://ipfs.io/ipfs/...
```

2. **Add Fallback Image**
```javascript
function NFTImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        e.target.src = '/images/placeholder-nft.png';
      }}
    />
  );
}
```

3. **Check Mixed Content**
```
If site is HTTPS, all images must be HTTPS too
Convert http:// to https:// in image URLs
```

### Issue: "Duplicate NFTs showing"

**Symptoms:**
- Same NFT appears multiple times
- Incorrect count

**Solutions:**

```javascript
// Deduplicate by mint address
const uniqueNFTs = Array.from(
  new Map(nfts.map(nft => [nft.mint, nft])).values()
);

console.log('Before dedup:', nfts.length);
console.log('After dedup:', uniqueNFTs.length);
```

---

## API Errors

### Issue: "Helius API rate limit exceeded"

**Error Message:**
```
{
  "error": "Rate limit exceeded",
  "status": 429
}
```

**Solutions:**

1. **Implement Caching**
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedHeliusCall(key, apiCall) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await apiCall();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
}
```

2. **Add Retry Logic**
```javascript
async function retryableAPICall(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}
```

3. **Upgrade Plan**
```
Free tier: 30 req/sec
Pro tier: 100 req/sec
Consider upgrading if hitting limits frequently
```

### Issue: "Magic Eden API not responding"

**Solutions:**

1. **Check Status**
```bash
curl -I https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts/stats
```

2. **Use Fallback Data**
```javascript
const fallbackStats = {
  floorPrice: 3_200_000_000, // 3.2 SOL
  listedCount: 0,
  volumeAll: 0
};

try {
  stats = await fetchCollectionStats('stonned_rabitts');
} catch (error) {
  console.warn('Magic Eden API failed, using fallback');
  stats = fallbackStats;
}
```

3. **Display Approximate Values**
```javascript
// Indicate data may be stale
<div>
  Floor: {stats.floorPrice ? '~' : ''}{stats.floorPrice} SOL
  <small>(May be approximate)</small>
</div>
```

### Issue: "CoinGecko API returning null"

**Solutions:**

1. **Use Static Fallback**
```javascript
const FALLBACK_SOL_PRICE = 100; // USD

async function getSolPrice() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.warn('CoinGecko failed, using fallback price');
    return FALLBACK_SOL_PRICE;
  }
}
```

2. **Use Alternative API**
```javascript
// Try Jupiter price API
const jupiterPrice = await fetch(
  'https://price.jup.ag/v4/price?ids=SOL'
).then(r => r.json());
```

---

## Smart Contract Issues

### Issue: "Program error: Custom error 0x1"

**Symptoms:**
- Transaction fails with cryptic error code
- Can't decode error message

**Solutions:**

1. **Decode Error**
```typescript
// Map error codes to messages
const ERROR_CODES = {
  0x0: 'InstructionMissing',
  0x1: 'InvalidAccountData',
  0x2: 'InvalidInstructionData',
  0x1770: 'NotPassHolder', // Custom error 6000
  0x1771: 'AlreadyClaimed', // Custom error 6001
};

function decodeError(code: number): string {
  return ERROR_CODES[code] || `Unknown error: ${code}`;
}
```

2. **Check Account State**
```javascript
// Verify account exists and has correct data
const account = await program.account.revenuePool.fetch(poolPDA);
console.log('Pool state:', account);
```

3. **Verify Signers**
```javascript
// Ensure all required signers are present
transaction.sign(
  feePayer,
  authority,
  // ... other required signers
);
```

### Issue: "Simulation failed: Blockhash not found"

**Solutions:**

```javascript
// Get fresh blockhash before sending
const { blockhash, lastValidBlockHeight } =
  await connection.getLatestBlockhash('finalized');

transaction.recentBlockhash = blockhash;
transaction.lastValidBlockHeight = lastValidBlockHeight;

// Send within validity window
const signature = await connection.sendRawTransaction(
  transaction.serialize()
);

// Confirm with blockhash
await connection.confirmTransaction({
  signature,
  blockhash,
  lastValidBlockHeight
});
```

---

## Performance Problems

### Issue: "Website loading slowly"

**Solutions:**

1. **Optimize Images**
```html
<!-- Use WebP format -->
<img src="image.webp" alt="NFT" loading="lazy">

<!-- Compress with TinyPNG or ImageOptim -->
```

2. **Minify Assets**
```bash
# Minify CSS
npx clean-css-cli -o style.min.css style.css

# Minify JS
npx terser app.js -o app.min.js
```

3. **Enable Caching**
```nginx
# Nginx cache headers
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

4. **Use CDN**
```html
<!-- Load libraries from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.87.6/lib/index.iife.min.js"></script>
```

### Issue: "High memory usage"

**Solutions:**

```javascript
// Clear cache periodically
setInterval(() => {
  if (cache.size > 100) {
    cache.clear();
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Remove event listeners when done
function cleanup() {
  element.removeEventListener('click', handler);
  observer.disconnect();
}

// Lazy load NFTs
function lazyLoadNFTs(nfts) {
  const batchSize = 20;
  let currentIndex = 0;

  function loadBatch() {
    const batch = nfts.slice(currentIndex, currentIndex + batchSize);
    renderNFTs(batch);
    currentIndex += batchSize;
  }

  loadBatch(); // Initial load

  // Load more on scroll
  window.addEventListener('scroll', () => {
    if (nearBottomOfPage() && currentIndex < nfts.length) {
      loadBatch();
    }
  });
}
```

---

## Browser Compatibility

### Issue: "Features not working in Safari"

**Solutions:**

1. **Polyfills**
```html
<!-- BigInt polyfill for older browsers -->
<script src="https://cdn.jsdelivr.net/npm/big-integer@1.6.51/BigInteger.min.js"></script>
```

2. **Check Feature Support**
```javascript
if (!window.BigInt) {
  alert('Your browser is not supported. Please use Chrome, Firefox, or Brave.');
}

// Check Web3 support
if (typeof window.solana === 'undefined') {
  alert('Please install a Solana wallet extension.');
}
```

3. **Safari-Specific Fixes**
```css
/* Fix backdrop-filter in Safari */
.glass {
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

/* Fix flexbox in Safari */
.flex-container {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
}
```

### Issue: "Mobile wallet not connecting"

**Solutions:**

1. **Use Deep Links**
```javascript
// Redirect to wallet app on mobile
function connectMobile() {
  const dappUrl = encodeURIComponent(window.location.href);

  if (isPhantomInstalled) {
    window.location.href = `https://phantom.app/ul/browse/${dappUrl}?ref=${window.location.href}`;
  } else {
    window.location.href = 'https://phantom.app/download';
  }
}
```

2. **Detect Mobile**
```javascript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile && !window.solana) {
  showMobileWalletPrompt();
}
```

3. **WalletConnect (Future)**
```
Implement WalletConnect protocol for mobile wallet connection
```

---

## Debug Mode

### Enable Debug Logging

```javascript
// Add to URL: ?debug=true
const DEBUG = new URLSearchParams(window.location.search).get('debug') === 'true';

function debugLog(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Usage
debugLog('Wallet connected:', walletAddress);
debugLog('NFTs fetched:', nfts.length);
```

### Console Helpers

```javascript
// Expose to window for console debugging
window.debugTools = {
  connection,
  getBalance: async (address) => {
    const balance = await connection.getBalance(new solanaWeb3.PublicKey(address));
    return balance / solanaWeb3.LAMPORTS_PER_SOL;
  },
  fetchNFTs: (address) => fetchOwnedNFTs(address),
  clearCache: () => cache.clear(),
  getState: () => AppState
};

// Usage in console:
// await debugTools.getBalance('YOUR_ADDRESS')
// await debugTools.fetchNFTs('YOUR_ADDRESS')
```

---

## Getting Help

If issues persist after trying these solutions:

1. **Check Browser Console** (F12)
   - Copy error messages
   - Take screenshots

2. **Gather Information**
   - Browser and version
   - Wallet and version
   - Transaction signature (if applicable)
   - Steps to reproduce

3. **Contact Support**
   - Discord: https://discord.gg/px9kyxbBhc
   - Twitter DM: @StonedRabbitts
   - Email: [via website form]

4. **Search Documentation**
   - Check other docs in `/docs/` folder
   - Review component-specific guides

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
