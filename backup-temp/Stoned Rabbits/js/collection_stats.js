const options = {method: 'GET', headers: {accept: 'application/json'}};
const url = 'https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts/stats?listingAggMode=true'
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

// SECURITY: Added comprehensive error handling and validation
fetch(proxyUrl, options)
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(res => {
    // SECURITY: Validate response data exists
    if (!res || typeof res !== 'object') {
      throw new Error('Invalid response format');
    }

    const formatValue = (value) => {
      // SECURITY: Validate numeric value
      if (typeof value !== 'number' || !isFinite(value)) {
        return 'N/A';
      }
      return (value / 1_000_000_000).toFixed(2) + ' SOL';
    };

    const floorPriceEl = document.getElementById('floor-price');
    const volumeEl = document.getElementById('volume-traded');
    const listedEl = document.getElementById('listed-count');

    if (floorPriceEl) floorPriceEl.innerText = formatValue(res.floorPrice);
    if (volumeEl) volumeEl.innerText = formatValue(res.volumeAll);
    if (listedEl) listedEl.innerText = res.listedCount || 'N/A';
  })
  .catch(err => {
    console.error('Failed to fetch collection stats:', err);
    // SECURITY: Display user-friendly error message
    const errorMsg = 'Unable to load stats';
    const floorPriceEl = document.getElementById('floor-price');
    const volumeEl = document.getElementById('volume-traded');
    const listedEl = document.getElementById('listed-count');

    if (floorPriceEl) floorPriceEl.innerText = errorMsg;
    if (volumeEl) volumeEl.innerText = errorMsg;
    if (listedEl) listedEl.innerText = errorMsg;
  });