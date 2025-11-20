# API Integration Guide

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Helius RPC API](#helius-rpc-api)
3. [Magic Eden API](#magic-eden-api)
4. [CoinGecko API](#coingecko-api)
5. [Future Backend API](#future-backend-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Testing APIs](#testing-apis)

---

## Overview

The Stoned Rabbits NFT ecosystem integrates with three external APIs:

| API | Purpose | Authentication | Rate Limit |
|-----|---------|----------------|------------|
| Helius RPC | Solana blockchain access | API Key | Tier-based |
| Magic Eden | Collection stats & floor price | None | 60 req/min |
| CoinGecko | SOL/USD price conversion | None | 50 req/min |

---

## Helius RPC API

### Overview

Helius provides enhanced Solana RPC endpoints with additional features like NFT metadata indexing.

**Base URL:** `https://mainnet.helius-rpc.com`
**API Key:** `2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5`
**Documentation:** https://docs.helius.dev

### Configuration

```javascript
const HELIUS_API_KEY = "2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5";
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const connection = new solanaWeb3.Connection(
  HELIUS_RPC_URL,
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  }
);
```

### Endpoints

#### 1. Get NFTs by Owner

**Purpose:** Fetch all NFTs owned by a wallet address

**Endpoint:**
```
GET https://mainnet.helius-rpc.com/v0/addresses/{address}/nfts?api-key={apiKey}
```

**Example Request:**

```javascript
async function fetchOwnedNFTs(walletAddress) {
  const url = `${HELIUS_RPC_URL}/v0/addresses/${walletAddress}/nfts?api-key=${HELIUS_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Helius API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
```

**Example Response:**

```json
[
  {
    "mint": "5fJ9x...",
    "owner": "FR1Lz5mtb...",
    "name": "Stoned Rabbit #1234",
    "symbol": "STONNED",
    "uri": "https://arweave.net/...",
    "image": "https://arweave.net/image.png",
    "description": "A Stoned Rabbit NFT",
    "attributes": [
      {
        "trait_type": "Background",
        "value": "Blue"
      },
      {
        "trait_type": "Eyes",
        "value": "Red"
      }
    ],
    "grouping": [
      {
        "group_key": "collection",
        "group_value": "4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K"
      }
    ],
    "collection": {
      "name": "Stoned Rabbits",
      "family": "Stoned Rabbits",
      "verified": true
    }
  }
]
```

**Filter by Collection:**

```javascript
async function fetchCollectionNFTs(walletAddress, collectionId) {
  const allNFTs = await fetchOwnedNFTs(walletAddress);

  return allNFTs.filter(nft =>
    nft.grouping?.some(g =>
      g.group_key === 'collection' &&
      g.group_value === collectionId
    ) && nft.collection?.verified === true
  );
}

// Usage
const stonedRabbits = await fetchCollectionNFTs(
  userWallet,
  "4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K"
);
```

#### 2. Get Token Metadata

**Purpose:** Fetch metadata for a specific NFT mint

**Endpoint:**
```
GET https://mainnet.helius-rpc.com/v0/token-metadata?mint={mintAddress}&api-key={apiKey}
```

**Example Request:**

```javascript
async function fetchNFTMetadata(mintAddress) {
  const url = `${HELIUS_RPC_URL}/v0/token-metadata?mint=${mintAddress}&api-key=${HELIUS_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status}`);
  }

  const data = await response.json();

  return {
    name: data.onChainData?.data?.name,
    symbol: data.onChainData?.data?.symbol,
    uri: data.onChainData?.data?.uri,
    image: data.offChainData?.image,
    attributes: data.offChainData?.attributes,
    collection: data.onChainData?.collection,
    verified: data.onChainData?.collection?.verified
  };
}
```

#### 3. Standard Solana RPC Methods

Helius also supports all standard Solana RPC methods:

**Get Balance:**
```javascript
async function getBalance(publicKey) {
  const balance = await connection.getBalance(publicKey);
  return balance / solanaWeb3.LAMPORTS_PER_SOL;
}
```

**Get Transaction:**
```javascript
async function getTransaction(signature) {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0
  });
  return tx;
}
```

**Send Transaction:**
```javascript
async function sendTransaction(transaction) {
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    }
  );

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
```

**Get Token Accounts:**
```javascript
async function getTokenAccounts(publicKey) {
  const accounts = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
  );

  return accounts.value.map(account => ({
    mint: account.account.data.parsed.info.mint,
    amount: account.account.data.parsed.info.tokenAmount.uiAmount,
    decimals: account.account.data.parsed.info.tokenAmount.decimals
  }));
}
```

### Rate Limits

**Free Tier:**
- 30 requests per second
- 100,000 requests per day

**Pro Tier:**
- 100 requests per second
- 1,000,000 requests per day

**Current Tier:** Free (sufficient for current usage)

### Error Handling

```javascript
async function safeHeliusCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message.includes('429')) {
      // Rate limit exceeded
      console.warn('Rate limit hit, waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await apiFunction(); // Retry once
    }

    if (error.message.includes('403')) {
      // Invalid API key
      console.error('Invalid Helius API key');
      throw new Error('RPC authentication failed');
    }

    if (error.message.includes('503')) {
      // Service unavailable
      console.warn('Helius service unavailable, using fallback RPC');
      // Switch to fallback RPC
      return await useFallbackRPC(apiFunction);
    }

    // Unknown error
    throw error;
  }
}
```

---

## Magic Eden API

### Overview

Magic Eden provides public APIs for accessing NFT collection data on Solana.

**Base URL:** `https://api-mainnet.magiceden.dev/v2`
**Authentication:** None required (public endpoints)
**Documentation:** https://api.magiceden.dev/

### Collections

#### Get Collection Stats

**Purpose:** Fetch floor price, volume, and holder count

**Endpoint:**
```
GET https://api-mainnet.magiceden.dev/v2/collections/{symbol}/stats
```

**Collection Symbols:**
- Main: `stonned_rabitts`
- Revenue Pass: `stoned_rabbits_revenue_sharing_pass`

**Example Request:**

```javascript
async function fetchCollectionStats(symbol) {
  const url = `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Collection not found');
    }
    throw new Error(`Magic Eden API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Usage
const stats = await fetchCollectionStats('stonned_rabitts');
console.log('Floor Price:', stats.floorPrice / 1e9, 'SOL');
console.log('Listed Count:', stats.listedCount);
console.log('Volume All:', stats.volumeAll / 1e9, 'SOL');
```

**Example Response:**

```json
{
  "symbol": "stonned_rabitts",
  "floorPrice": 3200000000,
  "listedCount": 156,
  "volumeAll": 12500000000000,
  "avgPrice24hr": 3500000000
}
```

**Parsed Data:**

```javascript
function parseCollectionStats(data) {
  return {
    symbol: data.symbol,
    floorPrice: data.floorPrice / solanaWeb3.LAMPORTS_PER_SOL,
    floorPriceFormatted: `${(data.floorPrice / solanaWeb3.LAMPORTS_PER_SOL).toFixed(2)} SOL`,
    listedCount: data.listedCount,
    volumeAll: data.volumeAll / solanaWeb3.LAMPORTS_PER_SOL,
    volumeAllFormatted: `${(data.volumeAll / solanaWeb3.LAMPORTS_PER_SOL).toFixed(2)} SOL`,
    avgPrice24hr: data.avgPrice24hr / solanaWeb3.LAMPORTS_PER_SOL
  };
}
```

#### Get Collection Info

**Purpose:** Fetch collection metadata

**Endpoint:**
```
GET https://api-mainnet.magiceden.dev/v2/collections/{symbol}
```

**Example Request:**

```javascript
async function fetchCollectionInfo(symbol) {
  const url = `https://api-mainnet.magiceden.dev/v2/collections/${symbol}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Magic Eden API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
```

**Example Response:**

```json
{
  "symbol": "stonned_rabitts",
  "name": "Stoned Rabbits",
  "description": "A collection of 3,333 Stoned Rabbits...",
  "image": "https://...",
  "twitter": "https://twitter.com/StonedRabbitts",
  "discord": "https://discord.gg/...",
  "website": "https://...",
  "categories": ["pfp", "art"]
}
```

### Rate Limits

**Public Endpoints:**
- 60 requests per minute
- No authentication required

**Best Practices:**
- Cache responses for 5 minutes
- Implement exponential backoff on errors
- Display cached data during rate limit periods

### Caching Implementation

```javascript
const cache = {
  data: {},
  timestamps: {},

  set(key, value, ttlMs) {
    this.data[key] = value;
    this.timestamps[key] = Date.now() + ttlMs;
  },

  get(key) {
    if (Date.now() > this.timestamps[key]) {
      delete this.data[key];
      delete this.timestamps[key];
      return null;
    }
    return this.data[key];
  }
};

async function getCachedCollectionStats(symbol) {
  const cacheKey = `collection_stats_${symbol}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Using cached collection stats');
    return cached;
  }

  // Fetch fresh data
  const stats = await fetchCollectionStats(symbol);

  // Cache for 5 minutes
  cache.set(cacheKey, stats, 5 * 60 * 1000);

  return stats;
}
```

### Error Handling

```javascript
async function safeMagicEdenCall(apiFunction, fallbackValue) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message.includes('429')) {
      console.warn('Magic Eden rate limit exceeded');
      // Return fallback value
      return fallbackValue;
    }

    if (error.message.includes('404')) {
      console.error('Collection not found on Magic Eden');
      return null;
    }

    // Log and return fallback
    console.error('Magic Eden API error:', error);
    return fallbackValue;
  }
}

// Usage
const stats = await safeMagicEdenCall(
  () => fetchCollectionStats('stonned_rabitts'),
  { floorPrice: 0, listedCount: 0, volumeAll: 0 }
);
```

---

## CoinGecko API

### Overview

CoinGecko provides cryptocurrency price data.

**Base URL:** `https://api.coingecko.com/api/v3`
**Authentication:** None required (public tier)
**Documentation:** https://www.coingecko.com/api/documentation

### Endpoints

#### Get SOL Price

**Purpose:** Fetch current SOL/USD exchange rate

**Endpoint:**
```
GET https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
```

**Example Request:**

```javascript
async function getSolPrice() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  return data.solana.usd;
}

// Usage
const solPrice = await getSolPrice();
console.log('1 SOL =', solPrice, 'USD');
```

**Example Response:**

```json
{
  "solana": {
    "usd": 112.45
  }
}
```

#### Convert USD to SOL

```javascript
async function usdToSol(usdAmount) {
  const solPrice = await getSolPrice();
  return usdAmount / solPrice;
}

async function usdToSolLamports(usdAmount) {
  const sol = await usdToSol(usdAmount);
  return Math.floor(sol * solanaWeb3.LAMPORTS_PER_SOL);
}

// Usage
const lamports = await usdToSolLamports(50); // $50 in lamports
console.log('$50 =', lamports, 'lamports');
```

#### Get Multiple Prices

**Purpose:** Fetch prices for multiple cryptocurrencies

**Endpoint:**
```
GET https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd
```

**Example Request:**

```javascript
async function getCryptoPrices() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    sol: data.solana.usd,
    usdc: data['usd-coin'].usd
  };
}
```

### Rate Limits

**Free Tier:**
- 50 calls per minute
- No API key required

**Best Practices:**
- Cache prices for 60 seconds
- Use fallback static rate if API unavailable
- Display "~" to indicate approximate values

### Caching with Fallback

```javascript
const FALLBACK_SOL_PRICE = 100; // Static fallback price

let cachedSolPrice = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

async function getCachedSolPrice() {
  const now = Date.now();

  // Return cached price if still valid
  if (cachedSolPrice && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSolPrice;
  }

  try {
    // Fetch fresh price
    const price = await getSolPrice();

    // Update cache
    cachedSolPrice = price;
    cacheTimestamp = now;

    return price;
  } catch (error) {
    console.warn('Failed to fetch SOL price, using fallback');

    // Use fallback if API fails
    if (cachedSolPrice) {
      return cachedSolPrice; // Return stale cache
    }

    return FALLBACK_SOL_PRICE; // Return static fallback
  }
}
```

### Display Helpers

```javascript
function formatPrice(usd, crypto = 'SOL') {
  return {
    usd: `$${usd.toFixed(2)}`,
    crypto: `${(usd / cachedSolPrice).toFixed(4)} ${crypto}`,
    approximate: cachedSolPrice === FALLBACK_SOL_PRICE
  };
}

// Usage
const price = formatPrice(50);
console.log(price.approximate ? '~' : '', price.crypto);
// Output: "~ 0.5000 SOL" (if using fallback)
```

---

## Future Backend API

### Overview

When the backend is implemented, it will provide these endpoints:

**Base URL:** `https://api.stonedrabbitsnft.com/v1`
**Authentication:** JWT tokens or API keys

### Planned Endpoints

#### Lottery System

**Purchase Tickets:**
```
POST /api/lottery/purchase
```

**Request Body:**
```json
{
  "walletAddress": "FR1Lz5mt...",
  "ticketCount": 10,
  "transactionSignature": "5fJ9x...",
  "paymentMethod": "SOL",
  "amountPaid": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "ticketsIssued": [1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241, 1242, 1243],
  "totalTickets": 10,
  "transactionVerified": true
}
```

**Burn Claim:**
```
POST /api/lottery/burn-claim
```

**Request Body:**
```json
{
  "walletAddress": "FR1Lz5mt...",
  "nftsBurned": ["mint1", "mint2", "mint3"],
  "transactionSignatures": ["sig1", "sig2", "sig3"],
  "ticketsClaimed": 12
}
```

**Get User Tickets:**
```
GET /api/lottery/tickets/{walletAddress}
```

**Response:**
```json
{
  "walletAddress": "FR1Lz5mt...",
  "totalTickets": 22,
  "ticketNumbers": [1234, 1235, ...],
  "entries": [
    {
      "method": "purchase",
      "ticketCount": 10,
      "timestamp": "2025-11-20T12:00:00Z",
      "transactionSignature": "5fJ9x..."
    },
    {
      "method": "burn",
      "ticketCount": 12,
      "nftsBurned": 3,
      "timestamp": "2025-11-21T15:30:00Z"
    }
  ]
}
```

#### Utility Factory

**Submit Project Request:**
```
POST /api/utility-factory/project
```

**Request Body:**
```json
{
  "projectName": "Cool NFT Project",
  "email": "founder@coolnft.com",
  "package": "professional",
  "services": ["staking", "discord-bot", "website"],
  "paymentMethod": "sol",
  "details": "We need a staking platform with...",
  "timeline": "2 months",
  "budget": 2000
}
```

**Response:**
```json
{
  "success": true,
  "projectId": "proj_abc123",
  "status": "pending_review",
  "estimatedReviewTime": "24 hours",
  "message": "Thank you for your submission. We'll review and get back to you within 24 hours."
}
```

**Get Project Status:**
```
GET /api/utility-factory/project/{projectId}
```

**Response:**
```json
{
  "projectId": "proj_abc123",
  "status": "in_progress",
  "currentPhase": "development",
  "progress": 45,
  "estimatedCompletion": "2026-01-15",
  "updates": [
    {
      "date": "2025-11-22",
      "message": "Project approved, starting development"
    },
    {
      "date": "2025-11-25",
      "message": "Staking platform 50% complete"
    }
  ]
}
```

#### Revenue Pass

**Get Distribution History:**
```
GET /api/revenue-pass/distributions
```

**Response:**
```json
{
  "distributions": [
    {
      "date": "2026-02-01",
      "totalRevenue": 50000,
      "distributionAmount": 5000,
      "perPass": 6.43,
      "slotMachines": [
        { "name": "Stoned Rabbits Classic", "revenue": 25000 },
        { "name": "Carrot Frenzy", "revenue": 15000 },
        { "name": "Rabbit Hole", "revenue": 10000 }
      ]
    }
  ]
}
```

**Claim Distribution:**
```
POST /api/revenue-pass/claim
```

**Request Body:**
```json
{
  "walletAddress": "FR1Lz5mt...",
  "passTokenId": "mint123",
  "distributionId": "dist_202602"
}
```

### Authentication

**JWT Token Flow:**

```javascript
// Login (future)
async function login(walletAddress, signature) {
  const response = await fetch('https://api.stonedrabbitsnft.com/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature })
  });

  const data = await response.json();
  localStorage.setItem('jwt_token', data.token);
  return data.token;
}

// Authenticated request
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('jwt_token');

  const response = await fetch(`https://api.stonedrabbitsnft.com/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('jwt_token');
    throw new Error('Authentication required');
  }

  return await response.json();
}
```

---

## Error Handling

### Unified Error Handler

```javascript
class APIError extends Error {
  constructor(service, status, message) {
    super(`${service} API Error (${status}): ${message}`);
    this.service = service;
    this.status = status;
  }
}

async function handleAPICall(service, apiFunction, fallbackValue = null) {
  try {
    return await apiFunction();
  } catch (error) {
    // Log error
    console.error(`[${service}] API call failed:`, error);

    // Parse error
    if (error instanceof APIError) {
      switch (error.status) {
        case 429:
          console.warn(`[${service}] Rate limit exceeded`);
          break;
        case 403:
          console.error(`[${service}] Authentication failed`);
          break;
        case 404:
          console.warn(`[${service}] Resource not found`);
          break;
        case 503:
          console.error(`[${service}] Service unavailable`);
          break;
        default:
          console.error(`[${service}] Unknown error: ${error.status}`);
      }
    }

    // Return fallback
    if (fallbackValue !== null) {
      console.log(`[${service}] Using fallback value`);
      return fallbackValue;
    }

    // Re-throw if no fallback
    throw error;
  }
}
```

### User-Friendly Error Messages

```javascript
function getUserFriendlyError(error) {
  if (error.message.includes('429')) {
    return 'Service is busy, please try again in a moment';
  }

  if (error.message.includes('Network')) {
    return 'Connection issue, please check your internet';
  }

  if (error.message.includes('wallet')) {
    return 'Please connect your wallet first';
  }

  if (error.message.includes('insufficient')) {
    return 'Insufficient balance for this transaction';
  }

  return 'An error occurred, please try again';
}

// Usage
try {
  await someAPICall();
} catch (error) {
  const userMessage = getUserFriendlyError(error);
  showNotification(userMessage, 'error');
}
```

---

## Rate Limiting

### Client-Side Rate Limiter

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async throttle(key = 'default') {
    const now = Date.now();

    // Remove old requests outside window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );

    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      console.warn(`Rate limit reached, waiting ${waitTime}ms`);

      // Wait until oldest request expires
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Retry
      return this.throttle(key);
    }

    // Record this request
    this.requests.push(now);
  }

  reset() {
    this.requests = [];
  }
}

// Create limiters for each service
const rateLimiters = {
  helius: new RateLimiter(30, 1000), // 30 per second
  magicEden: new RateLimiter(60, 60000), // 60 per minute
  coinGecko: new RateLimiter(50, 60000) // 50 per minute
};

// Usage
async function rateLimitedAPICall(service, apiFunction) {
  await rateLimiters[service].throttle();
  return await apiFunction();
}
```

---

## Testing APIs

### Test Suite

```javascript
// test-apis.js

async function testHeliusAPI() {
  console.log('Testing Helius API...');

  try {
    // Test RPC connection
    const balance = await connection.getBalance(
      new solanaWeb3.PublicKey('FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL')
    );
    console.log('✓ Helius RPC connected, treasury balance:', balance / 1e9, 'SOL');

    // Test NFT fetching
    const nfts = await fetchOwnedNFTs('FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL');
    console.log('✓ Helius NFT API working, found', nfts.length, 'NFTs');

    return true;
  } catch (error) {
    console.error('✗ Helius API test failed:', error.message);
    return false;
  }
}

async function testMagicEdenAPI() {
  console.log('Testing Magic Eden API...');

  try {
    const stats = await fetchCollectionStats('stonned_rabitts');
    console.log('✓ Magic Eden API working, floor:', stats.floorPrice / 1e9, 'SOL');
    return true;
  } catch (error) {
    console.error('✗ Magic Eden API test failed:', error.message);
    return false;
  }
}

async function testCoinGeckoAPI() {
  console.log('Testing CoinGecko API...');

  try {
    const price = await getSolPrice();
    console.log('✓ CoinGecko API working, SOL price:', price, 'USD');
    return true;
  } catch (error) {
    console.error('✗ CoinGecko API test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== API Test Suite ===\n');

  const results = {
    helius: await testHeliusAPI(),
    magicEden: await testMagicEdenAPI(),
    coinGecko: await testCoinGeckoAPI()
  };

  console.log('\n=== Test Results ===');
  console.log('Helius:', results.helius ? '✓ PASS' : '✗ FAIL');
  console.log('Magic Eden:', results.magicEden ? '✓ PASS' : '✗ FAIL');
  console.log('CoinGecko:', results.coinGecko ? '✓ PASS' : '✗ FAIL');

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\nOverall:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');

  return allPassed;
}

// Run tests
runAllTests();
```

### Manual Testing

```bash
# Test Helius RPC
curl "https://mainnet.helius-rpc.com/?api-key=2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Test Magic Eden API
curl "https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts/stats"

# Test CoinGecko API
curl "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
```

---

## Next Steps

1. **Implement Caching:** Add caching layer for all API calls
2. **Error Monitoring:** Set up Sentry to track API errors
3. **Rate Limit Dashboard:** Monitor API usage in real-time
4. **Backend Development:** Build the backend API (Phase 2)
5. **Webhooks:** Implement webhooks for real-time updates

**Related Documentation:**
- [01-architecture.md](./01-architecture.md) - System architecture
- [05-backend-systems.md](./05-backend-systems.md) - Backend API design
- [10-troubleshooting.md](./10-troubleshooting.md) - API troubleshooting

---

**Last Updated:** November 2025
**Maintainer:** Stoned Rabbits Development Team
**Status:** ✅ Production Ready
