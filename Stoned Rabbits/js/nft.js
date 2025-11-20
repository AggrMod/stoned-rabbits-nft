// NFT Operations for Stoned Rabbits NFT
// Handles: Gallery display, Collection stats, NFT viewer, Wallet NFTs

// ==================== CONFIGURATION ====================

const NFT_CONFIG = {
  collectionSymbol: 'stonned_rabitts',
  revenuePassSymbol: 'stoned_rabbits_revenue_sharing_pass',
  magicEdenAPI: 'https://api-mainnet.magiceden.dev/v2',
  proxyURL: 'https://corsproxy.io/?',
  nftImageBase: 'https://we-assets.pinit.io/HL779o1Da5adreFHUmgmiJfWy6JJTRtJ2C641DandQq3/1f22ced6-0904-4196-99ce-f55d44ba1a46/',
  maxNFTs: 3333,
  rarityRanges: [
    { min: 1, max: 33, label: 'Legendary' },
    { min: 34, max: 333, label: 'Epic' },
    { min: 334, max: 833, label: 'Rare' },
    { min: 834, max: Infinity, label: 'Common' }
  ]
};

// ==================== COLLECTION STATS ====================

async function fetchCollectionStats(collectionSymbol = NFT_CONFIG.collectionSymbol) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const url = `${NFT_CONFIG.magicEdenAPI}/collections/${collectionSymbol}/stats?listingAggMode=true`;
  const proxyUrl = `${NFT_CONFIG.proxyURL}${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    return {
      floorPrice: data.floorPrice || 0,
      volumeAll: data.volumeAll || 0,
      listedCount: data.listedCount || 0,
      avgPrice24hr: data.avgPrice24hr || 0,
      volume24hr: data.volume24hr || 0
    };

  } catch (error) {
    console.error('Failed to fetch collection stats:', error);
    throw error;
  }
}

function updateCollectionStatsUI(stats) {
  const formatValue = (value) => {
    if (typeof value !== 'number' || !isFinite(value)) {
      return 'N/A';
    }
    return (value / 1_000_000_000).toFixed(2) + ' SOL';
  };

  const floorPriceEl = document.getElementById('floor-price');
  const volumeEl = document.getElementById('volume-traded');
  const listedEl = document.getElementById('listed-count');
  const volume24hEl = document.getElementById('volume-24h');

  if (floorPriceEl) floorPriceEl.textContent = formatValue(stats.floorPrice);
  if (volumeEl) volumeEl.textContent = formatValue(stats.volumeAll);
  if (listedEl) listedEl.textContent = stats.listedCount || 'N/A';
  if (volume24hEl) volume24hEl.textContent = formatValue(stats.volume24hr);
}

async function loadCollectionStats() {
  try {
    showLoading('Loading collection stats...');
    const stats = await fetchCollectionStats();
    updateCollectionStatsUI(stats);
    hideLoading();
  } catch (error) {
    console.error('Error loading collection stats:', error);

    // Display error message
    const errorMsg = 'Unable to load stats';
    ['floor-price', 'volume-traded', 'listed-count', 'volume-24h'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = errorMsg;
    });

    hideLoading();
  }
}

// ==================== NFT GALLERY ====================

class NFTGallery {
  constructor() {
    this.nfts = [];
    this.currentFilter = 'all';
    this.gridContainer = null;
    this.statusElement = null;
    this.isLoaded = false;
  }

  async initialize() {
    console.log('🎨 Initializing NFT Gallery...');

    this.gridContainer = document.getElementById('nft-grid') || document.getElementById('real-nft-grid');
    this.statusElement = document.getElementById('gallery-status');

    if (!this.gridContainer) {
      console.error('❌ NFT grid container not found');
      return false;
    }

    // Setup filter buttons
    this.setupFilterButtons();

    // Load NFTs
    await this.loadNFTs();
    this.renderGallery();

    console.log('✅ NFT Gallery initialized successfully');
    return true;
  }

  setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.nft-filter .btn, [data-rarity]');

    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        e.target.classList.add('active');

        // Update filter
        this.currentFilter = e.target.getAttribute('data-rarity') || 'all';
        console.log(`🔍 Filter changed to: ${this.currentFilter}`);

        // Re-render gallery
        this.renderGallery();
      });
    });

    // Set 'all' as default active
    filterButtons.forEach(btn => {
      if ((btn.getAttribute('data-rarity') || 'all') === 'all') {
        btn.classList.add('active');
      }
    });
  }

  async loadNFTs() {
    this.updateStatus('Fetching NFT data...', 'loading');

    const options = { method: 'GET', headers: { accept: 'application/json' } };
    const url = `${NFT_CONFIG.magicEdenAPI}/collections/${NFT_CONFIG.collectionSymbol}/listings?offset=0&limit=100`;
    const proxyUrl = `${NFT_CONFIG.proxyURL}${encodeURIComponent(url)}`;

    try {
      const response = await fetch(proxyUrl, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.nfts = data.map(item => {
        const name = item.token?.name || '';
        const tokenNumberMatch = name.match(/#(\d+)/);
        const tokenNumber = tokenNumberMatch ? parseInt(tokenNumberMatch[1]) : null;

        // Get rarity rank
        const rarityAttr = item.token?.attributes?.find(attr => attr.trait_type === 'Rarity Rank');
        const rarityRank = rarityAttr ? parseInt(rarityAttr.value) : null;

        // Determine rarity label
        const rarityRange = NFT_CONFIG.rarityRanges.find(
          range => rarityRank >= range.min && rarityRank <= range.max
        ) || { label: 'Unknown' };

        return {
          id: item.tokenMint,
          tokenNumber: tokenNumber,
          name: name,
          image: item.token?.image || '',
          price: item.price * 1.17, // Include Magic Eden fee
          currency: 'SOL',
          seller: item.seller,
          magicedenUrl: `https://magiceden.io/item-details/${item.tokenMint}`,
          rarity: rarityRange.label,
          rarityRank: rarityRank,
          isListed: item.token?.listStatus === 'listed',
          attributes: item.token?.attributes || []
        };
      });

      console.log(`📋 Loaded ${this.nfts.length} NFTs`);
      console.log('Rarity Distribution:', {
        Legendary: this.nfts.filter(nft => nft.rarity === 'Legendary').length,
        Epic: this.nfts.filter(nft => nft.rarity === 'Epic').length,
        Rare: this.nfts.filter(nft => nft.rarity === 'Rare').length,
        Common: this.nfts.filter(nft => nft.rarity === 'Common').length
      });

    } catch (error) {
      console.error('❌ Error fetching NFT data:', error);
      this.updateStatus('Failed to load NFTs', 'error');
    }
  }

  renderGallery() {
    if (!this.gridContainer) return;

    this.gridContainer.innerHTML = '';

    // Filter NFTs based on currentFilter
    const filteredNFTs = this.currentFilter === 'all'
      ? this.nfts
      : this.nfts.filter(nft =>
          nft.rarity && nft.rarity.toLowerCase() === this.currentFilter.toLowerCase()
        );

    // Limit display (configurable)
    const displayLimit = parseInt(this.gridContainer.getAttribute('data-limit')) || 12;
    const displayedNFTs = filteredNFTs.slice(0, displayLimit);

    if (displayedNFTs.length === 0) {
      this.gridContainer.innerHTML = '<p class="text-center">No NFTs found for this filter.</p>';
      this.updateStatus(`No ${this.currentFilter} NFTs available`, 'loaded');
      return;
    }

    displayedNFTs.forEach((nft, index) => {
      const nftCard = this.createNFTCard(nft, index);
      this.gridContainer.appendChild(nftCard);
    });

    this.updateStatus(
      `Showing ${displayedNFTs.length} of ${filteredNFTs.length} ${
        this.currentFilter === 'all' ? '' : this.currentFilter
      } NFTs`,
      'loaded'
    );

    this.isLoaded = true;
    console.log(`🎨 Rendered ${displayedNFTs.length} NFT cards (Filter: ${this.currentFilter})`);
  }

  createNFTCard(nft, index) {
    const card = document.createElement('div');
    card.className = 'nft-card glass-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index * 100).toString());

    const rarityClass = `rarity-${nft.rarity.toLowerCase()}`;

    card.innerHTML = `
      <div class="nft-image-wrapper">
        <img src="${nft.image}" alt="${nft.name}" class="nft-image" loading="lazy">
        <span class="rarity-badge ${rarityClass}">${nft.rarity}</span>
      </div>
      <div class="nft-info">
        <h4 class="nft-name">${nft.name}</h4>
        ${nft.rarityRank ? `<p class="nft-rank">Rank: #${nft.rarityRank}</p>` : ''}
        <div class="nft-price">
          <span class="price-label">Price:</span>
          <span class="price-value">${nft.price.toFixed(2)} ${nft.currency}</span>
        </div>
        <a href="${nft.magicedenUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          View on Magic Eden
        </a>
      </div>
    `;

    return card;
  }

  updateStatus(message, status = 'loading') {
    if (!this.statusElement) return;

    this.statusElement.textContent = message;
    this.statusElement.className = `gallery-status status-${status}`;
  }
}

// ==================== NFT VIEWER/DOWNLOADER ====================

function initializeNFTViewer() {
  const container = document.getElementById('nft-viewer') || document.getElementById('download-nft-form');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'nft-viewer-wrapper';

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = String(NFT_CONFIG.maxNFTs);
  input.placeholder = `Enter NFT # (1-${NFT_CONFIG.maxNFTs})`;
  input.className = 'form-control';

  const btnShow = document.createElement('button');
  btnShow.textContent = 'Show NFT';
  btnShow.className = 'btn btn-primary';

  const errorMsg = document.createElement('div');
  errorMsg.className = 'error-message';

  const preview = document.createElement('div');
  preview.className = 'nft-preview';

  btnShow.addEventListener('click', () => {
    errorMsg.textContent = '';
    preview.innerHTML = '';

    const value = parseInt(input.value, 10);
    if (!value || value < 1 || value > NFT_CONFIG.maxNFTs) {
      errorMsg.textContent = `Please enter a valid number between 1 and ${NFT_CONFIG.maxNFTs}.`;
      return;
    }

    const img = document.createElement('img');
    img.src = NFT_CONFIG.nftImageBase + value;
    img.alt = `Stoned Rabbit #${value}`;
    img.className = 'nft-preview-image';
    img.loading = 'lazy';

    const title = document.createElement('h4');
    title.textContent = `Stoned Rabbit #${value}`;

    const downloadBtn = document.createElement('a');
    downloadBtn.href = img.src;
    downloadBtn.download = `stoned-rabbit-${value}.png`;
    downloadBtn.className = 'btn btn-secondary btn-sm';
    downloadBtn.textContent = 'Download Image';
    downloadBtn.target = '_blank';

    const viewOnME = document.createElement('a');
    viewOnME.href = `https://magiceden.io/marketplace/${NFT_CONFIG.collectionSymbol}`;
    viewOnME.className = 'btn btn-primary btn-sm';
    viewOnME.textContent = 'View on Magic Eden';
    viewOnME.target = '_blank';
    viewOnME.rel = 'noopener noreferrer';

    preview.appendChild(title);
    preview.appendChild(img);
    preview.appendChild(downloadBtn);
    preview.appendChild(viewOnME);
  });

  wrapper.appendChild(input);
  wrapper.appendChild(btnShow);
  wrapper.appendChild(errorMsg);
  wrapper.appendChild(preview);

  container.appendChild(wrapper);
}

// ==================== USER WALLET NFTs ====================

async function fetchUserNFTs(walletAddress) {
  if (!walletAddress) {
    console.error('No wallet address provided');
    return [];
  }

  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const url = `${NFT_CONFIG.magicEdenAPI}/wallets/${walletAddress}/tokens?offset=0&limit=100&listStatus=both&collection_symbol=${NFT_CONFIG.collectionSymbol}`;
  const proxyUrl = `${NFT_CONFIG.proxyURL}${encodeURIComponent(url)}`;

  try {
    showLoading('Fetching your NFTs...');

    const response = await fetch(proxyUrl, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const userNFTs = data.map(item => ({
      id: item.mintAddress,
      name: item.name || 'Unknown',
      image: item.image || '',
      collection: item.collection || NFT_CONFIG.collectionSymbol
    }));

    console.log(`✅ Found ${userNFTs.length} NFTs in wallet`);

    hideLoading();

    // Display user NFTs if container exists
    displayUserNFTs(userNFTs);

    return userNFTs;

  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    hideLoading();
    showError('Failed to fetch your NFTs');
    return [];
  }
}

function displayUserNFTs(nfts) {
  const container = document.getElementById('user-nfts');
  if (!container) return;

  container.innerHTML = '';

  if (nfts.length === 0) {
    container.innerHTML = '<p class="text-center">No Stoned Rabbits NFTs found in your wallet.</p>';
    return;
  }

  nfts.forEach((nft, index) => {
    const card = document.createElement('div');
    card.className = 'nft-card user-nft glass-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index * 50).toString());

    card.innerHTML = `
      <img src="${nft.image}" alt="${nft.name}" class="nft-image" loading="lazy">
      <div class="nft-info">
        <h5>${nft.name}</h5>
        <span class="badge badge-success">Owned</span>
      </div>
    `;

    container.appendChild(card);
  });
}

function clearNFTDisplay() {
  const container = document.getElementById('user-nfts');
  if (container) {
    container.innerHTML = '';
  }
}

// ==================== INITIALIZATION ====================

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Initialize NFT Gallery if container exists
    if (document.getElementById('nft-grid') || document.getElementById('real-nft-grid')) {
      const gallery = new NFTGallery();
      gallery.initialize();
      window.nftGallery = gallery;
    }

    // Initialize collection stats
    if (document.getElementById('floor-price') || document.getElementById('volume-traded')) {
      loadCollectionStats();

      // Refresh stats every 5 minutes
      setInterval(loadCollectionStats, 5 * 60 * 1000);
    }

    // Initialize NFT viewer
    initializeNFTViewer();
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchCollectionStats,
    loadCollectionStats,
    NFTGallery,
    fetchUserNFTs,
    clearNFTDisplay,
    initializeNFTViewer
  };
}
