// Main Application Logic for Stoned Rabbits NFT
// Handles: Navigation, Animations, UI components, Notifications

// ==================== GLOBAL STATE ====================

const AppState = {
  wallet: {
    connected: false,
    provider: null,
    address: null,
    balance: 0
  },

  setWallet(updates) {
    this.wallet = { ...this.wallet, ...updates };
    this.saveState();
  },

  saveState() {
    try {
      localStorage.setItem('app_state', JSON.stringify(this.wallet));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  },

  loadState() {
    try {
      const saved = localStorage.getItem('app_state');
      if (saved) {
        this.wallet = { ...this.wallet, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
};

// ==================== SOLANA CONNECTION ====================

let connection = null;

function getConnection() {
  if (!connection) {
    // Helius RPC endpoint
    const HELIUS_API_KEY = '2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5';
    const RPC_ENDPOINT = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

    if (typeof solanaWeb3 !== 'undefined') {
      connection = new solanaWeb3.Connection(RPC_ENDPOINT, 'confirmed');
    }
  }
  return connection;
}

// ==================== NAVIGATION ====================

function initializeNavigation() {
  const header = document.querySelector('header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll effect on header
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking a nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ==================== ANIMATIONS ====================

function initializeAnimations() {
  // Initialize AOS if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-out'
    });
  }

  // Fallback intersection observer for elements without AOS
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate').forEach(element => {
    observer.observe(element);
  });
}

// ==================== CRYPTO TICKER ====================

const CRYPTO_CONFIG = {
  updateInterval: 60000, // 1 minute
  apiEndpoint: 'https://api.coingecko.com/api/v3/simple/price',
  coins: ['bitcoin', 'ethereum', 'solana', 'cardano']
};

async function fetchCryptoPrices() {
  try {
    const url = `${CRYPTO_CONFIG.apiEndpoint}?ids=${CRYPTO_CONFIG.coins.join(',')}&vs_currencies=usd&include_24hr_change=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return [
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        price: data.bitcoin?.usd || 0,
        change: data.bitcoin?.usd_24h_change || 0
      },
      {
        name: 'Ethereum',
        symbol: 'ETH',
        price: data.ethereum?.usd || 0,
        change: data.ethereum?.usd_24h_change || 0
      },
      {
        name: 'Solana',
        symbol: 'SOL',
        price: data.solana?.usd || 0,
        change: data.solana?.usd_24h_change || 0
      },
      {
        name: 'Cardano',
        symbol: 'ADA',
        price: data.cardano?.usd || 0,
        change: data.cardano?.usd_24h_change || 0
      }
    ];
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return [];
  }
}

function updateCryptoTicker(cryptoData) {
  const cryptoTicker = document.querySelector('.ticker-container');
  if (!cryptoTicker) return;

  cryptoTicker.innerHTML = '';

  // Create duplicate set for continuous scrolling
  const allCryptoData = [...cryptoData, ...cryptoData];

  allCryptoData.forEach(crypto => {
    const tickerItem = document.createElement('div');
    tickerItem.classList.add('ticker-item');

    const changeClass = crypto.change >= 0 ? 'up' : 'down';
    const changeSymbol = crypto.change >= 0 ? '+' : '';

    tickerItem.innerHTML = `
      <span class="ticker-name">${crypto.symbol}</span>
      <span class="ticker-price">$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span class="ticker-change ${changeClass}">${changeSymbol}${crypto.change.toFixed(2)}%</span>
    `;

    cryptoTicker.appendChild(tickerItem);
  });
}

async function initializeCryptoTicker() {
  const cryptoData = await fetchCryptoPrices();
  if (cryptoData.length > 0) {
    updateCryptoTicker(cryptoData);

    // Update periodically
    setInterval(async () => {
      const updatedData = await fetchCryptoPrices();
      if (updatedData.length > 0) {
        updateCryptoTicker(updatedData);
      }
    }, CRYPTO_CONFIG.updateInterval);
  }
}

// ==================== COUNTDOWN TIMER ====================

function initializeCountdown(targetDate = null) {
  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;

  // If no target date provided, default to 1 month from now
  const countdownDate = targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result
    countdownElement.innerHTML = `
      <div class="countdown-item">
        <span class="countdown-number">${days}</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-number">${hours}</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-number">${minutes}</span>
        <span class="countdown-label">Minutes</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-number">${seconds}</span>
        <span class="countdown-label">Seconds</span>
      </div>
    `;

    // If countdown is finished
    if (distance < 0) {
      clearInterval(countdownInterval);
      countdownElement.innerHTML = '<span class="countdown-finished">NFT Collection Now Live!</span>';
    }
  }, 1000);
}

// ==================== MODAL MANAGEMENT ====================

function initializeModals() {
  // Initialize modal triggers
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();

      const modalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(modalId);

      if (modal) {
        openModal(modal);
      }
    });
  });

  // Setup close handlers for existing modals
  document.querySelectorAll('.modal, .modal-overlay').forEach(modal => {
    // Close button
    const closeBtn = modal.querySelector('.modal-close, .close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active, .modal-overlay:not([id*="wallet"])');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });
}

function openModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }

  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ==================== NOTIFICATIONS ====================

function createNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${iconMap[type] || iconMap.info}"></i>
      <p>${message}</p>
      <button class="notification-close">&times;</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);

  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => removeNotification(notification));

  // Auto-remove
  if (duration > 0) {
    setTimeout(() => removeNotification(notification), duration);
  }

  return notification;
}

function removeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => notification.remove(), 300);
}

function showSuccess(message, duration = 3000) {
  return createNotification(message, 'success', duration);
}

function showError(message, duration = 5000) {
  return createNotification(message, 'error', duration);
}

function showWarning(message, duration = 4000) {
  return createNotification(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
  return createNotification(message, 'info', duration);
}

// ==================== LOADING INDICATOR ====================

let loadingOverlay = null;

function showLoading(message = 'Loading...') {
  hideLoading(); // Remove any existing loader

  loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;

  document.body.appendChild(loadingOverlay);
  document.body.style.overflow = 'hidden';

  setTimeout(() => loadingOverlay.classList.add('show'), 10);
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
    setTimeout(() => {
      if (loadingOverlay) {
        loadingOverlay.remove();
        loadingOverlay = null;
      }
      document.body.style.overflow = '';
    }, 300);
  }
}

function updateLoadingMessage(message) {
  if (loadingOverlay) {
    const messageEl = loadingOverlay.querySelector('.loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }
}

// ==================== CAROUSEL/SLIDER ====================

function initializeCarousels() {
  const carousels = document.querySelectorAll('.carousel');

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');

    if (slides.length === 0) return;

    let currentSlide = 0;

    // Create dots
    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('active');

        dot.addEventListener('click', () => goToSlide(index));

        dotsContainer.appendChild(dot);
      });
    }

    // Show first slide
    showSlide(0);

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    }

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
      }

      currentSlide = index;
    }

    function goToSlide(index) {
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }

      showSlide(index);
    }

    // Auto-advance
    if (carousel.getAttribute('data-auto') === 'true') {
      const interval = parseInt(carousel.getAttribute('data-interval') || '5000');

      setInterval(() => {
        goToSlide(currentSlide + 1);
      }, interval);
    }
  });
}

// ==================== UTILITY FUNCTIONS ====================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==================== INITIALIZATION ====================

function initializeApp() {
  console.log('🚀 Initializing Stoned Rabbits NFT App...');

  // Load saved state
  AppState.loadState();

  // Initialize components
  initializeNavigation();
  initializeAnimations();
  initializeModals();
  initializeCarousels();

  // Initialize crypto ticker if container exists
  if (document.querySelector('.ticker-container')) {
    initializeCryptoTicker();
  }

  // Initialize countdown if element exists
  if (document.getElementById('countdown')) {
    initializeCountdown();
  }

  console.log('✅ App initialized successfully');
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AppState,
    getConnection,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hideLoading,
    updateLoadingMessage,
    openModal,
    closeModal
  };
}
