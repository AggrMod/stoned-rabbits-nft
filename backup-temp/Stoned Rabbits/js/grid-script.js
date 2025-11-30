(() => {
  // State
  let nfts = [];
  const traitTypes = new Map();
  let generatedImageUrl = '';
  let currentPage = 1;
  const NFTsPerPage = 40;
  const maxSelections = 20;

  // Persist selected indices across reloads
  const selectedNFTs = new Set(JSON.parse(localStorage.getItem('selectedNFTs') || '[]'));

  // Cache for QR canvases (keyed by URL)
  const qrCache = new Map();

  // Expose fetchNFTs for any inline usage already in HTML
  window.fetchNFTs = fetchNFTs;

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetch-nfts-btn');
    const generateButton = document.getElementById('generate-btn');

    if (fetchButton) fetchButton.addEventListener('click', fetchNFTs);
    if (generateButton) generateButton.addEventListener('click', generateGrid);

    // If we already have selections from a previous session, reflect count
    updateSelectedCount();
    ensurePresetIds();
    ensureSelectedCountUI();	
  });

  // Helpers
  function byId(id) {
    return document.getElementById(id);
  }

  function showWarning(message) {
    const warning = byId('selection-warning');
    if (!warning) return;
    warning.textContent = message;
    warning.style.display = 'block';
    setTimeout(() => (warning.style.display = 'none'), 5000);
  }

  // SECURITY: Validate Solana wallet address
  function isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string') return false;
    // Solana addresses are base58 encoded, 32-44 characters
    if (address.length < 32 || address.length > 44) return false;
    // Check for valid base58 characters (no 0, O, I, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) return false;
    return true;
  }

  // SECURITY: Sanitize text input to prevent XSS
  function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

function updateSelectedCount() {
  const el = byId('selected-count');
  const warning = byId('selection-warning');

  // Update visible count if present
  if (el) el.textContent = selectedNFTs.size;

  // Persist selection
  localStorage.setItem('selectedNFTs', JSON.stringify([...selectedNFTs]));

  // Show/hide warning independently of the count element
  if (warning) {
    if (selectedNFTs.size > maxSelections) {
      warning.textContent = `You have selected ${selectedNFTs.size} NFTs. Please unselect ${selectedNFTs.size - maxSelections} NFTs to generate the grid.`;
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
	   
    }
  }
}

  function sanitizeUrl(url) {
    try {
      const u = new URL(url);
      return u.href;
    } catch {
      return '';
    }
  }

  function proxiedImage(url) {
    const safe = sanitizeUrl(url);
    if (!safe) return 'https://placehold.co/120x120?text=NFT';
    // Use a single proxy strategy first; fallback handled in loaders
    return `https://corsproxy.io/?${encodeURIComponent(safe)}`;
  }

  function getRank(nft) {
    const rankTrait = nft.attributes?.find(
      (attr) =>
        attr.trait_type &&
        (attr.trait_type.toLowerCase().includes('rank') ||
          attr.trait_type.toLowerCase().includes('rarity rank'))
    );
    if (rankTrait && rankTrait.value != null) {
      const parsed = parseInt(String(rankTrait.value), 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return nft.rarity?.moonrank?.rank ?? null;
  }

  function populateTraitDropdowns() {
    const typeSel = byId('trait_type');
    const valSel = byId('trait_value');
    if (!typeSel || !valSel) return;

    typeSel.innerHTML = '<option value="">Select Trait Type</option>';
    valSel.innerHTML = '<option value="">Select Trait Value</option>';

    [...traitTypes.keys()].sort().forEach((type) => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      typeSel.appendChild(opt);
    });

    typeSel.onchange = () => {
      const selectedType = typeSel.value.toLowerCase();
      valSel.innerHTML = '<option value="">Select Trait Value</option>';
      if (selectedType && traitTypes.has(selectedType)) {
        [...traitTypes.get(selectedType)].sort().forEach((value) => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value.charAt(0).toUpperCase() + value.slice(1);
          valSel.appendChild(opt);
        });
      }
    };
  }

  async function hashv(seeds) {
  let length = 0;
  for (const seed of seeds) length += seed.length;
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const seed of seeds) {
    buffer.set(seed, offset);
    offset += seed.length;
  }
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hash);
}

  // -----------------------------
  // Fetch NFTs
  // -----------------------------
async function fetchNFTs() {
  const input = byId('wallet')?.value.trim();
  if (!input) return showWarning('Please enter a valid Solana wallet address or .sol domain.');

  // SECURITY: Sanitize input to prevent XSS
  const sanitizedInput = sanitizeText(input);
  let walletAddress = sanitizedInput;

  const isDomain = sanitizedInput.toLowerCase().endsWith('.sol') && !sanitizedInput.includes(' ');

  // SECURITY: Validate non-domain addresses
  if (!isDomain && !isValidSolanaAddress(sanitizedInput)) {
    return showWarning('Invalid Solana wallet address format. Please check and try again.');
  }

  if (isDomain) {
    try {
      const cacheKey = `sns_${input}`;
      let cachedAddress = localStorage.getItem(cacheKey);
      if (cachedAddress) {
        walletAddress = cachedAddress;
      } else {
        const { Connection, PublicKey } = solanaWeb3;
        // SECURITY: Use environment variable or public RPC endpoint
        // Replace 'YOUR_RPC_URL' with actual RPC endpoint in production
        const connection = new Connection('YOUR_RPC_URL_HERE'); // IMPORTANT: Add your RPC URL

        const NAME_PROGRAM_ID = new PublicKey('Crf8HzfthJ1n7hWWJFGjG9E2U2quhF24F3p1g1p1p1kk');
        const HASH_PREFIX = new TextEncoder().encode('SPL Name Service');
        const domain = input.replace(/\.sol$/, '');
        const domainBytes = new TextEncoder().encode(domain);

        const hashed = await hashv([HASH_PREFIX, domainBytes]);
        const [domainKey] = PublicKey.findProgramAddressSync([hashed], NAME_PROGRAM_ID);

        const registry = await connection.getAccountInfo(domainKey);
        if (!registry || registry.data.length === 0) throw new Error('Domain not found or no owner.');

        const owner = new PublicKey(registry.data.slice(32, 64)).toBase58();
        walletAddress = owner;

        localStorage.setItem(cacheKey, walletAddress);
      }
      showWarning(`Resolved ${input} to wallet address: ${walletAddress}`);
    } catch (err) {
      console.error('Error resolving .sol domain:', err);
      showWarning(`Failed to resolve ${input}: ${err.message}`);
      return;
    }
  } else {

  }

  try {
    const collectionSymbol = 'stonned_rabitts';
    const limit = 500;
    let offset = 0;
    let all = [];

    while (true) {
      let proxyUrl = `https://corsproxy.io/?${encodeURIComponent(
        `https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/tokens?offset=${offset}&limit=${limit}&listStatus=both&collection_symbol=${collectionSymbol}`
      )}`;

      let res = await fetch(proxyUrl);

      if (!res.ok || res.status === 429) {
        proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          `https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/tokens?offset=${offset}&limit=${limit}&listStatus=both&collection_symbol=${collectionSymbol}`
        )}`;
        res = await fetch(proxyUrl);
      }
      if (!res.ok) throw new Error(`Failed to fetch NFTs (offset ${offset}). Status: ${res.status}`);

      const body = await res.json();
      const data = proxyUrl.includes('api.allorigins.win') ? JSON.parse(body.contents) : body;
      if (!Array.isArray(data)) throw new Error('Unexpected response shape from Magic Eden');

      all = all.concat(data);
      if (data.length < limit) break;
      offset += limit;
    }

    nfts = all.map((nft) => {
      const image =
        typeof nft.image === 'string' && nft.image.startsWith('http')
          ? nft.image
          : 'https://placehold.co/120x120?text=NFT';
      const rank = getRank(nft);

      if (Array.isArray(nft.attributes)) {
        nft.attributes.forEach((attr) => {
          if (attr?.trait_type && attr?.value != null) {
            const t = String(attr.trait_type).toLowerCase();
            const v = String(attr.value).toLowerCase();
            if (!traitTypes.has(t)) traitTypes.set(t, new Set());
            traitTypes.get(t).add(v);
          }
        });
      }
      return { ...nft, image, rank };
    });

    selectedNFTs.clear();
    localStorage.removeItem('selectedNFTs');

    updateSelectedCount();
    populateTraitDropdowns();
    currentPage = 1;
    displayNFTs();

    if (nfts.length === 0) {
      showWarning(`No Stoned Rabbits NFTs found for ${input}.`);
    } else {
      selectTop10();
      byId('presets').style.display = 'block';
      byId('generate-btn').style.display = 'block';
      byId('pagination').style.display = 'flex';
    }
  } catch (err) {
    console.error('Error fetching NFTs:', err);
    showWarning(`Error fetching NFTs for ${input}: ${err.message}`);
  }
}
 // -----------------------------
  // Render grid (paginated)
  // -----------------------------
function displayNFTs() {
    const list = byId('nft-list');
    if (!list) return;

    list.classList.add('fade');

    setTimeout(() => {
        list.innerHTML = '';

        const totalPages = Math.max(1, Math.ceil(nfts.length / NFTsPerPage));
        const paginationWrap = byId('pagination');
        if (paginationWrap) {
            const hide = totalPages <= 1;
            paginationWrap.classList.toggle('is-hidden', hide);
            paginationWrap.setAttribute('aria-hidden', hide ? 'true' : 'false');
        }

        currentPage = Math.min(currentPage, totalPages);
        const start = (currentPage - 1) * NFTsPerPage;
        const end = Math.min(start + NFTsPerPage, nfts.length);
        const pageNFTs = nfts.slice(start, end);

        pageNFTs.forEach((nft, pageIdx) => {
            const globalIndex = start + pageIdx;
            const card = document.createElement('div');
            card.className = `user-nft-card ${selectedNFTs.has(globalIndex) ? 'selected' : ''}`;

            const title = document.createElement('h3');
            title.className = 'nft-title';
            title.textContent = `${nft.name || 'Unnamed NFT'} ${nft.rank ? `(Rank: ${nft.rank})` : ''}`;

            const imgWrap = document.createElement('div');
            imgWrap.className = 'nft-img';

            const img = new Image();
            img.alt = nft.name || 'NFT Image';
            img.src = 'https://placehold.co/120x120?text=Loading';
            imgWrap.appendChild(img);

            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            checkmark.textContent = '✓';
            // Will be visible if selected
            if (!selectedNFTs.has(globalIndex)) checkmark.style.display = 'none';

            card.appendChild(imgWrap);
            card.appendChild(title);
            card.appendChild(checkmark);
            list.appendChild(card);

            // Preload real image
            const url = proxiedImage(nft.image);
            const preload = new Image();
            preload.onload = () => (img.src = url);
            preload.onerror = () => (img.src = 'https://placehold.co/120x120?text=NFT');
            preload.src = url;

            // Card click toggles selection
            card.addEventListener('click', () => {
                const isSelected = selectedNFTs.has(globalIndex);
                if (!isSelected && selectedNFTs.size >= maxSelections) {
                    showWarning(`You can only select up to ${maxSelections} NFTs. Please unselect some NFTs first.`);
                    return;
                }
                if (isSelected) {
                    selectedNFTs.delete(globalIndex);
                    card.classList.remove('selected');
                    checkmark.style.display = 'none';
                } else {
                    selectedNFTs.add(globalIndex);
                    card.classList.add('selected');
                    checkmark.style.display = 'block';
                }
                updateSelectedCount();
            });
        });
		 

        // Pagination controls
        const prevButton = byId('prev-page');
        const nextButton = byId('next-page');
        const pageInfo = byId('page-info');
        if (prevButton && nextButton && pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;

            prevButton.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayNFTs();
                }
            };
            nextButton.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    displayNFTs();
                }
            };
        }

        list.classList.remove('fade');
    }, 180);
}

  // -----------------------------
  // Presets & filters
  // -----------------------------
  function selectTop(count) {
    const sorted = nfts.filter((n) => n.rank != null).sort((a, b) => a.rank - b.rank);
    const picks = sorted.slice(0, count);

    selectedNFTs.clear();
    picks.forEach((n) => {
      const idx = nfts.indexOf(n);
      if (idx !== -1) selectedNFTs.add(idx);
    });

    currentPage = 1;
    displayNFTs();
    updateSelectedCount();
  }

window.selectTop10 = () => {
  setPresetActive('top10');
  selectTop(10);
};

window.selectTop20 = () => {
  setPresetActive('top20');
  selectTop(20);
};


  window.selectByTrait = () => {
    const type = byId('trait_type')?.value.trim().toLowerCase();
    const value = byId('trait_value')?.value.trim().toLowerCase();
    if (!type || !value) return alert('Please select both trait type and value.');
    setPresetActive(null);
    const matches = nfts.filter((nft) =>
      nft.attributes?.some(
        (a) =>
          a?.trait_type &&
          a?.value != null &&
          a.trait_type.toLowerCase() === type &&
          String(a.value).toLowerCase() === value
      )
    );

    selectedNFTs.clear();
    matches.slice(0, maxSelections).forEach((n) => {
      const idx = nfts.indexOf(n);
      if (idx !== -1) selectedNFTs.add(idx);
    });

    if (matches.length > maxSelections) {
      showWarning(`Only ${maxSelections} NFTs were selected due to the selection limit.`);
    }

    currentPage = 1;
    displayNFTs();
    updateSelectedCount();
  };

    window.clearSelections = () => {
      setPresetActive('clear');
      selectedNFTs.clear();
      localStorage.removeItem('selectedNFTs');
      displayNFTs();
      updateSelectedCount();
    };

  // -----------------------------
  // QR code generation (FIXED)
  // -----------------------------
  async function getQRCodes() {
    if (typeof QRCode === 'undefined') throw new Error('QR code library not loaded');

    const qrDefs = [
      { url: 'https://stonedrabbitsNFT.com', caption: 'Stoned Rabbits NFT Website', align: 'left' },
      { url: 'https://discord.gg/px9kyxbBhc', caption: 'Stoned Rabbits NFT Discord', align: 'center' },
      { url: 'https://magiceden.io/marketplace/stonned_rabitts', caption: 'Buy now!', align: 'right' },
    ];

    const canvases = [];
    for (const def of qrDefs) {
      if (qrCache.has(def.url)) {
        canvases.push(qrCache.get(def.url));
        continue;
      }

      // Create a temp container div (qrcodejs appends <canvas> or <img> inside)
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render QR
      // NOTE: width/height here are *CSS px*; we draw to main canvas with HiDPI scaling handled there.
      const size = 180;
      new QRCode(container, {
        text: def.url,
        width: size,
        height: size,
        margin: 1,
        correctLevel: QRCode.CorrectLevel.M,
      });

      // Wait a tick to let DOM update
      await new Promise((r) => setTimeout(r, 0));

      // Prefer the generated canvas; if only an <img> exists, convert it to canvas
      let qrCanvas = container.querySelector('canvas');
      const qrImg = container.querySelector('img');

      if (!qrCanvas && qrImg) {
        // Ensure image is ready
        await (qrImg.decode?.() ?? new Promise((res) => (qrImg.onload = res)));
        const tmp = document.createElement('canvas');
        tmp.width = size;
        tmp.height = size;
        const c = tmp.getContext('2d');
        c.drawImage(qrImg, 0, 0, size, size);
        qrCanvas = tmp;
      }

      document.body.removeChild(container);

      if (!qrCanvas) throw new Error('QR generation failed for ' + def.url);
      qrCache.set(def.url, qrCanvas);
      canvases.push(qrCanvas);
    }
    return canvases;
  }

  // -----------------------------
  // Grid generation
  // -----------------------------
async function generateGrid() {
  if (selectedNFTs.size === 0) return alert('Please select at least one NFT.');
  if (selectedNFTs.size > maxSelections) {
    showWarning(
      `You have selected ${selectedNFTs.size} NFTs. Please unselect ${selectedNFTs.size - maxSelections} NFTs to generate the grid.`
    );
    return;
  }

  const modal = byId('modal');
  const modalImage = byId('modal-image');
  const canvas = byId('canvas');
  if (!modal || !modalImage || !canvas) {
    alert('Required elements not found. Please refresh the page.');
    return;
  }

  try {
    const selected = [...selectedNFTs].map((i) => nfts[i]);

    // Layout constants (CSS px)
    const imgSize = 120;
    const borderWidth = 4;
    const bannerImageHeight = 100; // Adjust based on gridbanner.jpg height
    const bannerTextHeight = 0; // Height for text below banner image
    const bannerHeight = bannerImageHeight + bannerTextHeight; // Total header height
    const footerHeight = 160; // From previous fix
    const captionFontSize = 12;

    const cols = Math.ceil(Math.sqrt(selected.length));
    const rows = Math.ceil(selected.length / cols);

    // HiDPI setup
    const scale = window.devicePixelRatio || 1;
    const cssW = cols * (imgSize + 2 * borderWidth);
    const cssH = rows * (imgSize + 2 * borderWidth) + bannerHeight + footerHeight;
    canvas.width = Math.max(2, Math.floor(cssW * scale));
    canvas.height = Math.max(2, Math.floor(cssH * scale));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Scale once; thereafter use CSS px for all drawing
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cssW, cssH);

    // Load and draw banner image
    const bannerImg = new Image();
    bannerImg.crossOrigin = 'anonymous';
    bannerImg.src = 'images/grid_banner.jpg';

    await new Promise((resolve, reject) => {
      bannerImg.onload = () => resolve();
      bannerImg.onerror = () => {
        console.warn('Failed to load banner image, using fallback background');
        ctx.fillStyle = '#2c3e50'; // Fallback to original header color
        ctx.fillRect(0, 0, cssW, bannerImageHeight);
        resolve();
      };
    });

    // Draw banner image (stretch to fit cssW, maintain height)
    if (bannerImg.complete && bannerImg.naturalWidth) {
      ctx.drawImage(bannerImg, 0, 0, cssW, bannerImageHeight);
    }

    // Header text below banner image
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, bannerImageHeight, cssW, bannerTextHeight);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px sans-serif';
    //ctx.fillText('Stoned Rabbits Collection', cssW / 2, bannerImageHeight + bannerTextHeight / 2);

    // Footer
    const footerY = cssH - footerHeight;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, footerY, cssW, footerHeight);

    // QR codes
    const qrSize = Math.min(90, Math.floor(cssW / 7));
    const qrY = footerY + 10;
    const captionY = qrY + qrSize + 20;

    const qrCanvases = await getQRCodes();
    const qrDefs = [
      { caption: 'Stoned Rabbits NFT Website', align: 'left' },
      { caption: 'Stoned Rabbits NFT Discord', align: 'center' },
      { caption: 'Buy now!', align: 'right' },
    ];

    qrCanvases.forEach((qrCanvas, i) => {
      const { caption, align } = qrDefs[i];
      let x = 10;
      if (align === 'center') x = (cssW - qrSize) / 2;
      if (align === 'right') x = cssW - qrSize - 10;

      // Draw QR
      ctx.drawImage(qrCanvas, x, qrY, qrSize, qrSize);

      // Caption
      ctx.fillStyle = 'white';
      ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
      ctx.textBaseline = 'top';
      ctx.font = `${captionFontSize}px sans-serif`;
      const maxWidth = qrSize;
      const words = caption.split(' ');
      let line = '';
      let y = captionY;
      const lineHeight = captionFontSize + 2;

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), align === 'left' ? x : align === 'right' ? x + qrSize : cssW / 2, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
		   
        }
      }
      ctx.fillText(line.trim(), align === 'left' ? x : align === 'right' ? x + qrSize : cssW / 2, y);
    });

    // NFTs
    modal.classList.add('loading');
    modalImage.style.display = 'none';

    for (let i = 0; i < selected.length; i++) {
      const nft = selected[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (imgSize + 2 * borderWidth);
      const y = row * (imgSize + 2 * borderWidth) + bannerHeight; // Adjusted for new bannerHeight

      // Rank-based border
      if (nft.rank != null) {
        let borderColor = 'grey';
        if (nft.rank >= 1 && nft.rank <= 33) borderColor = 'gold';
        else if (nft.rank <= 333) borderColor = 'purple';
        else if (nft.rank <= 833) borderColor = 'blue';

        ctx.fillStyle = borderColor;
        ctx.fillRect(x, y, imgSize + 2 * borderWidth, imgSize + 2 * borderWidth);
      }

      // Load NFT image with proxy + fallback
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const primary = proxiedImage(nft.image);
      const fallback = `https://api.allorigins.win/raw?url=${encodeURIComponent(nft.image)}`;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          img.onerror = () => {
								 
            img.src = `https://placehold.co/120x120?text=${encodeURIComponent(nft.name || 'NFT')}`;
            img.onload = resolve;
            img.onerror = resolve;
			  
							   
          };
          img.src = fallback;
        };
        img.src = primary;
      });

      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, x + borderWidth, y + borderWidth, imgSize, imgSize);
      } else {
        ctx.fillStyle = '#555';
        ctx.fillRect(x + borderWidth, y + borderWidth, imgSize, imgSize);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px sans-serif';
        ctx.fillText('Image Unavailable', x + borderWidth + imgSize / 2, y + borderWidth + imgSize / 2);
		 
      }

															 
										 
								   
							  
																			  
		 
										
										 
				  
				   
												   
													   
												 
    }

    // Show in modal
    generatedImageUrl = canvas.toDataURL('image/png', 1.0);
    modalImage.src = generatedImageUrl;
    await new Promise((r, j) => {
      modalImage.onload = r;
      modalImage.onerror = () => j(new Error('Failed to load modal image'));
    });
    modal.classList.remove('loading');
    modalImage.style.display = 'block';
    showModal();
  } catch (err) {
    console.error('Error generating grid:', err);
    alert('Failed to generate grid: ' + err.message);
    byId('modal')?.classList.remove('loading');
  }
}

function showModal() {
    const modal = byId('modal');
    if (modal) modal.style.display = 'flex';
  }

  window.closeModal = function closeModal() {
    const modal = byId('modal');
    if (modal) modal.style.display = 'none';
  };

  // -----------------------------
  // Share actions (unchanged, small polish)
  // -----------------------------
  window.shareToX = async function shareToX() {
    const text = 'Check out my Stoned Rabbits NFT collection! #StonedRabbits @Stoned_Rabbits #NFTs #PassiveIncome';
    const url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  };

  window.shareToTelegram = async function shareToTelegram() {
    const text = 'Check out my Stoned Rabbits NFT collection!';
    const url =
      'https://t.me/share/url?url=' + encodeURIComponent(window.location.href) + '&text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  };

  window.shareToWhatsApp = async function shareToWhatsApp() {
    const text = 'Check out my Stoned Rabbits NFT collection!';
    if (navigator.share && generatedImageUrl) {
      try {
        const resp = await fetch(generatedImageUrl);
        const blob = await resp.blob();
        const file = new File([blob], 'stoned_rabbits_nft_grid.png', { type: 'image/png' });
        await navigator.share({ title: 'Stoned Rabbits NFT Grid', text, files: [file] });
        return;
      } catch (e) {
        console.warn('Native share failed, falling back:', e);
      }
    }
    const url = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + window.location.href);
    window.open(url, '_blank');
  };

  window.copyToClipboard = async function copyToClipboard() {
    try {
      const resp = await fetch(generatedImageUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Image copied to clipboard! Paste it into X or other apps.');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy image. Please download the image and upload it manually.');
    }
  };

  window.downloadImage = async function downloadImage() {
    try {
      const resp = await fetch(generatedImageUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stoned_rabbits_nft_grid.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image. Please try again.');
    }
  };

									
  function ensurePresetIds() {
  const group = document.querySelector('#presets .preset-buttons');
  if (!group) return;
  const btns = group.querySelectorAll('button');
  if (btns.length >= 3) {
    if (!btns[0].id) btns[0].id = 'preset-top10';
    if (!btns[1].id) btns[1].id = 'preset-top20';
    if (!btns[2].id) btns[2].id = 'preset-clear';
    btns.forEach(b => b.setAttribute('aria-pressed', 'false'));
	 
  }
}

function setPresetActive(which /* 'top10' | 'top20' | 'clear' | null */) {
  const b10 = document.getElementById('preset-top10');
  const b20 = document.getElementById('preset-top20');
  const bC  = document.getElementById('preset-clear');
  [b10, b20, bC].forEach(b => {
    if (!b) return;
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  if (which === 'top10' && b10) { b10.classList.add('active'); b10.setAttribute('aria-pressed', 'true'); }
  if (which === 'top20' && b20) { b20.classList.add('active'); b20.setAttribute('aria-pressed', 'true'); }
  if (which === 'clear' && bC)  { bC.classList.add('active');  bC.setAttribute('aria-pressed', 'true'); }
}

/* Create a "Selected: X/20" pill if #selected-count is missing in HTML */
function ensureSelectedCountUI() {
  const wrap = byId('selection-info');
  if (!wrap) return;
  if (!byId('selected-count')) {
    const pill = document.createElement('span');
    pill.className = 'count-pill';
    pill.innerHTML = `Selected: <strong id="selected-count">0</strong> / ${maxSelections}`;
    wrap.prepend(pill);
	 
  }
}
})();
