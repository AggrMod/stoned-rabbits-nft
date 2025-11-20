// Main JavaScript for Stoned Rabbits Crypto

// DOM Elements
const header = document.querySelector('header');
const mobileToggle = document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const cryptoTicker = document.querySelector('.ticker-container');
const countdownElement = document.getElementById('countdown');
const walletConnectBtn = document.querySelector('.wallet-btn');

// Scroll Event for Header
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile Menu Toggle
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
  });
}

// Close mobile menu when clicking a nav link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    mobileToggle.classList.remove('active');
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  });
});

// Animation on scroll
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
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

// SECURITY WARNING: Replace this with real API integration before production
// This is PLACEHOLDER data only - DO NOT use in production
// Recommended APIs: CoinGecko, CoinMarketCap, or Binance API
const cryptoData = [
  { name: 'Bitcoin', symbol: 'BTC', price: 0.00, change: 0.0 },
  { name: 'Ethereum', symbol: 'ETH', price: 0.00, change: 0.0 },
  { name: 'StonedRabbit', symbol: 'SRBBT', price: 0.00, change: 0.0 },
  { name: 'Solana', symbol: 'SOL', price: 0.00, change: 0.0 },
  { name: 'Cardano', symbol: 'ADA', price: 0.00, change: 0.0 },
  { name: 'XRP', symbol: 'XRP', price: 0.00, change: 0.0 },
  { name: 'Dogecoin', symbol: 'DOGE', price: 0.00, change: 0.0 },
  { name: 'Polkadot', symbol: 'DOT', price: 0.00, change: 0.0 }
];

// TODO: Replace with real crypto price API
// Example: Use CoinGecko API or similar service
// async function fetchRealCryptoPrices() {
//   try {
//     const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true');
//     const data = await response.json();
//     // Update cryptoData array with real prices
//   } catch (error) {
//     console.error('Failed to fetch crypto prices:', error);
//   }
// }

function updateCryptoTicker() {
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
      <span class="ticker-price">$${crypto.price.toLocaleString()}</span>
      <span class="ticker-change ${changeClass}">${changeSymbol}${crypto.change}%</span>
    `;
    
    cryptoTicker.appendChild(tickerItem);
  });
}

// Initialize ticker
updateCryptoTicker();

// NFT Countdown Timer
function updateCountdown() {
  if (!countdownElement) return;
  
  // Set the date we're counting down to (1 month from now)
  const countdownDate = new Date();
  countdownDate.setMonth(countdownDate.getMonth() + 1);
  
  // Update the countdown every 1 second
  const countdownInterval = setInterval(() => {
    // Get current date and time
    const now = new Date().getTime();
    
    // Find the distance between now and the countdown date
    const distance = countdownDate - now;
    
    // Time calculations for days, hours, minutes and seconds
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
    
    // If the countdown is finished, display message
    if (distance < 0) {
      clearInterval(countdownInterval);
      countdownElement.innerHTML = "<span>NFT Collection Now Live!</span>";
    }
  }, 1000);
}

// Initialize countdown
updateCountdown();

// Wallet Connect Modal
function setupWalletConnect() {
  if (!walletConnectBtn) return;
  
  walletConnectBtn.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.classList.add('wallet-modal');
    
    modal.innerHTML = `
      <div class="wallet-modal-content">
        <div class="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button class="wallet-modal-close">&times;</button>
        </div>
        <div class="wallet-modal-body">
          <div class="wallet-option" data-wallet="metamask">
            <img src="images/metamask.png" alt="MetaMask">
            <span>MetaMask</span>
          </div>
          <div class="wallet-option" data-wallet="coinbase">
            <img src="images/coinbase.png" alt="Coinbase Wallet">
            <span>Coinbase Wallet</span>
          </div>
          <div class="wallet-option" data-wallet="walletconnect">
            <img src="images/walletconnect.png" alt="WalletConnect">
            <span>WalletConnect</span>
          </div>
          <div class="wallet-option" data-wallet="phantom">
            <img src="images/phantom.png" alt="Phantom">
            <span>Phantom</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    const closeBtn = modal.querySelector('.wallet-modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Close when clicking outside modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Wallet options
    const walletOptions = modal.querySelectorAll('.wallet-option');
    walletOptions.forEach(option => {
      option.addEventListener('click', () => {
        const walletType = option.getAttribute('data-wallet');
        connectWallet(walletType);
        modal.remove();
      });
    });
  });
}

// Mock wallet connection function
function connectWallet(walletType) {
  console.log(`Connecting to ${walletType}...`);
  
  // Show connecting message
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.innerHTML = `
    <div class="notification-content">
      <p>Connecting to ${walletType}...</p>
      <div class="notification-loader"></div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Simulate connection process
  setTimeout(() => {
    notification.remove();
    
    const successNotification = document.createElement('div');
    successNotification.classList.add('notification', 'success');
    successNotification.innerHTML = `
      <div class="notification-content">
        <p>Successfully connected to ${walletType}!</p>
      </div>
    `;
    
    document.body.appendChild(successNotification);
    
    setTimeout(() => {
      successNotification.remove();
      
      // Update button to show connected state
      if (walletConnectBtn) {
        walletConnectBtn.innerHTML = `
          <i class="fas fa-wallet"></i>
          <span>Wallet Connected</span>
        `;
        walletConnectBtn.classList.add('connected');
      }
    }, 2000);
  }, 2000);
}

// Initialize wallet connect
setupWalletConnect();

// AOS Animation Library Initialization (if loaded)
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100
  });
}

// Initialize any modals
document.querySelectorAll('[data-modal]').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    
    const modalId = trigger.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    
    if (modal) {
      modal.classList.add('active');
      
      // Close modal when clicking close button
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
      });
      
      // Close modal when clicking outside content
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });
});

// Init any sliders or carousels (if needed)
// This is a placeholder for a carousel initialization
// Replace with an actual carousel library if needed
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    // This is just a basic implementation
    // In production, use a library like Swiper or Glide
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    let currentSlide = 0;
    
    // Create dots
    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('active');
        
        dot.addEventListener('click', () => {
          goToSlide(index);
        });
        
        dotsContainer.appendChild(dot);
      });
    }
    
    // Show first slide
    showSlide(0);
    
    // Previous/Next buttons
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
      });
    }
    
    function showSlide(index) {
      // Hide all slides
      slides.forEach(slide => {
        slide.style.display = 'none';
      });
      
      // Show current slide
      slides[index].style.display = 'block';
      
      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
      }
      
      currentSlide = index;
    }
    
    function goToSlide(index) {
      // Handle wrapping
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }
      
      showSlide(index);
    }
    
    // Auto-advance if enabled
    if (carousel.getAttribute('data-auto') === 'true') {
      const interval = parseInt(carousel.getAttribute('data-interval') || '5000');
      
      setInterval(() => {
        goToSlide(currentSlide + 1);
      }, interval);
    }
  });
}

// Initialize carousels
initCarousel();
