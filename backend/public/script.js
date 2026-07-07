/* ===================================================================
   GADGETS GRAM — গ্যাজেটস গ্রাম
   3D Interactive Landing Page — JavaScript
   =================================================================== */

(function () {
  'use strict';

  /* ── API Configuration ─────────────────────────────────────── */
  // Use relative path on deployed site, localhost points to local dev server
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://gadgetsgram-backend.onrender.com';

  /* ── DOM Ready ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Load theme preference immediately
    const savedTheme = localStorage.getItem('gg_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    initNavbar();
    initMobileMenu();
    initScrollReveal();
    init3DTilt();
    initParallax();
    loadProducts();
    initFAQ();
    initCountdown();
    initAnimatedCounters();
    initSmoothScroll();
    initMobileStickyVisibility();
    initOrderForm();
    initAuthForm();
    initRouter();
  }

  function initRouter() {
    handleRoute();
  }

  window.routeTo = function(path) {
    history.pushState(null, '', path);
    handleRoute();
  };

  window.addEventListener('popstate', handleRoute);

  function handleRoute() {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    const allSections = document.querySelectorAll('section');
    const allMains = document.querySelectorAll('main');
    const successSection = document.getElementById('success-screen');
    const footer = document.getElementById('footer');
    
    // Hide all views first
    allMains.forEach(main => main.style.display = 'none');
    allSections.forEach(sec => {
      if (sec.id !== 'success-screen') sec.style.display = 'none';
    });
    if (successSection) successSection.style.display = 'none';

    if (path.startsWith('/order/success')) {
      const orderId = searchParams.get('id');
      document.getElementById('success-order-id').textContent = orderId || 'GG-XXXX';
      if (successSection) successSection.style.display = 'flex';
      if (footer) footer.style.display = 'none';
      window.scrollTo(0, 0);
    } else if (path.startsWith('/profile')) {
      const profileView = document.getElementById('profile-view');
      if (profileView) profileView.style.display = 'block';
      if (footer) footer.style.display = '';
      window.scrollTo(0, 0);
      openProfile();
    } else if (path.startsWith('/track')) {
      const trackingView = document.getElementById('tracking-view');
      if (trackingView) trackingView.style.display = 'block';
      if (footer) footer.style.display = '';
      
      const orderId = searchParams.get('id');
      if (orderId) {
        document.getElementById('tracking-id').value = orderId;
        // Trigger tracking automatically if ID exists
        setTimeout(() => document.getElementById('tracking-btn').click(), 100);
      }
      window.scrollTo(0, 0);
    } else {
      // Home route
      const homeView = document.getElementById('home-view');
      if (homeView) homeView.style.display = 'block';
      allSections.forEach(sec => {
        if (sec.id !== 'success-screen') sec.style.display = '';
      });
      if (footer) footer.style.display = '';
    }
  }

  /* ══════════════════════════════════════════════════════════════
     0. ORDER FORM — submit to API
     ══════════════════════════════════════════════════════════════ */
  function initOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;

    // Listener for product select dropdown fallback
    const select = document.getElementById('order-product');
    if (select) {
      select.addEventListener('change', () => {
        const productIdVal = select.value;
        if (productIdVal) {
          const productId = parseInt(productIdVal, 10);
          if (productId) {
            addToCart(productId);
            select.value = ''; // Reset select
          }
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('submit-order-btn');
      const originalText = btn.innerText;
      btn.innerText = 'Submitting...';
      btn.disabled = true;

      const customerName = document.getElementById('order-name').value;
      const phone = document.getElementById('order-phone').value;
      const address = document.getElementById('order-address').value;
      const district = document.getElementById('order-district').value;
      
      const errorMsg = document.getElementById('order-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

      // Check if we are using cart items
      const cart = getCart();
      
      let itemsToOrder = [];
      if (cart.length > 0) {
        itemsToOrder = cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }));
      } else {
        const oldSelect = document.getElementById('order-product');
        const oldIdInput = document.getElementById('order-product-id');
        const productIdVal = (oldIdInput && oldIdInput.value) ? oldIdInput.value : (oldSelect ? oldSelect.value : '');
        
        if (productIdVal) {
          itemsToOrder.push({
            productId: parseInt(productIdVal, 10),
            quantity: 1
          });
        }
      }

      if (itemsToOrder.length === 0) {
        if (errorMsg) {
          errorMsg.textContent = 'Please select a product or add items to your cart first.';
          errorMsg.style.display = 'block';
        }
        btn.innerText = originalText;
        btn.disabled = false;
        return;
      }

      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('gg_token');
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }

        // Submit all items in a single consolidated request
        const payload = {
          customerName,
          phone,
          address,
          district,
          productId: itemsToOrder[0].productId,
          quantity: itemsToOrder[0].quantity,
          items: itemsToOrder
        };

        const res = await fetch(API_BASE + '/api/v1/orders', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to submit order. Please try again.');
        }

        const data = await res.json();
        const orderId = data.data?.orderId || data.orderId;

        // Clear cart
        clearCart();
        form.reset();

        // Redirect to success screen
        window.routeTo('/order/success?id=' + orderId);

      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Failed to place order. Please try again.';
          errorMsg.style.display = 'block';
        }
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     0.5. AUTH MODAL LOGIC
     ══════════════════════════════════════════════════════════════ */
  let authMode = 'login';

  window.openAuthModal = function(e) {
    if (e) e.preventDefault();
    if (localStorage.getItem('gg_token')) {
      window.routeTo('/profile');
      return;
    }
    document.getElementById('auth-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    authMode = 'login';
    renderAuthModal();
  };

  window.closeAuthModal = function() {
    document.getElementById('auth-overlay').classList.remove('active');
    document.body.style.overflow = '';
  };

  window.toggleAuthMode = function(e) {
    if (e) e.preventDefault();
    authMode = authMode === 'login' ? 'register' : 'login';
    renderAuthModal();
  };

  function renderAuthModal() {
    const isLogin = authMode === 'login';
    document.getElementById('auth-title').innerText = isLogin ? 'Customer Login' : 'Create Account';
    document.getElementById('auth-name-group').style.display = isLogin ? 'none' : 'block';
    document.getElementById('auth-phone-group').style.display = isLogin ? 'none' : 'block';
    document.getElementById('auth-name').required = !isLogin;
    document.getElementById('auth-phone').required = !isLogin;
    document.getElementById('auth-submit-btn').innerText = isLogin ? 'Login' : 'Register';
    document.getElementById('auth-toggle-text').innerText = isLogin ? "Don't have an account?" : "Already have an account?";
    document.getElementById('auth-toggle-btn').innerText = isLogin ? 'Register' : 'Login';
    document.getElementById('auth-error-msg').style.display = 'none';
  }

  function updateAuthUI() {
    const link = document.getElementById('nav-auth-link');
    const token = localStorage.getItem('gg_token');
    const userStr = localStorage.getItem('gg_user');
    
    if (link) {
      if (token) {
        let name = 'User';
        try { name = JSON.parse(userStr).name.split(' ')[0]; } catch(e) {}
        link.innerText = '👤 Profile (' + name + ')';
      } else {
        link.innerText = 'Login';
      }
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const nameInput = document.getElementById('order-name');
        const phoneInput = document.getElementById('order-phone');
        
        if (nameInput && !nameInput.value && user.name) nameInput.value = user.name;
        if (phoneInput && !phoneInput.value && user.phone) phoneInput.value = user.phone;
      } catch(e) {}
    }
  }

  window.openProfile = function(e) {
    if (e) e.preventDefault();
    if (!localStorage.getItem('gg_token')) {
      openAuthModal();
      return;
    }
    window.routeTo('/profile');
    if (typeof loadOrderHistory === 'function') loadOrderHistory();
  };

  window.openCart = function(e) {
    if (e) e.preventDefault();
    if (typeof cartItem !== 'undefined' && cartItem) {
      openOrderForm(cartItem.id);
    } else {
      alert('Your cart is empty! Add an item first.');
      const shopTarget = document.getElementById('products');
      if (shopTarget) shopTarget.scrollIntoView({behavior: 'smooth'});
    }
  };

  window.openWishlist = function(e) {
    if (e) e.preventDefault();
    if (!localStorage.getItem('gg_token')) {
      openAuthModal();
      return;
    }
    
    // Toggle wishlist filter
    currentFilters.wishlistOnly = !currentFilters.wishlistOnly;
    
    if (currentFilters.wishlistOnly) {
      alert('Filtering products to show only your Favourites.');
    }
    
    applyFilters();
    const shopTarget = document.getElementById('products');
    if (shopTarget) {
      // Small delay to ensure route reset if they were on another page
      window.routeTo('/');
      setTimeout(() => shopTarget.scrollIntoView({behavior: 'smooth'}), 100);
    }
  };

  window.logout = function() {
    localStorage.removeItem('gg_token');
    localStorage.removeItem('gg_user');
    
    // Clear state
    if (typeof userWishlist !== 'undefined') userWishlist = [];
    localStorage.removeItem('gg_cart');
    if (typeof cartItem !== 'undefined') cartItem = null;
    
    updateAuthUI();
    if (typeof updateWishlistUI === 'function') updateWishlistUI();
    if (typeof updateCartUI === 'function') updateCartUI();

    document.getElementById('order-name').value = '';
    document.getElementById('order-phone').value = '';
    window.routeTo('/');
  };

  function initAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('auth-submit-btn');
      const originalText = btn.innerText;
      btn.innerText = 'Please wait...';
      btn.disabled = true;

      const payload = {
        email: document.getElementById('auth-email').value,
        password: document.getElementById('auth-password').value,
      };

      if (authMode === 'register') {
        payload.name = document.getElementById('auth-name').value;
        payload.phone = document.getElementById('auth-phone').value;
      }

      try {
        const endpoint = authMode === 'login' ? '/api/v1/customers/login' : '/api/v1/customers/register';
        const res = await fetch(API_BASE + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok) {
          const resData = data.data || data;
          if (authMode === 'login') {
            localStorage.setItem('gg_token', resData.accessToken);
            localStorage.setItem('gg_user', JSON.stringify(resData.user));
            updateAuthUI();
            if (typeof fetchWishlist === 'function') fetchWishlist();
            closeAuthModal();
            form.reset();
          } else {
            authMode = 'login';
            renderAuthModal();
            document.getElementById('auth-error-msg').textContent = 'Registration successful! Please log in.';
            document.getElementById('auth-error-msg').style.color = 'var(--success)';
            document.getElementById('auth-error-msg').style.display = 'block';
          }
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      } catch (err) {
        document.getElementById('auth-error-msg').textContent = err.message;
        document.getElementById('auth-error-msg').style.color = 'var(--danger)';
        document.getElementById('auth-error-msg').style.display = 'block';
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
    
    updateAuthUI();
  }

  /* ══════════════════════════════════════════════════════════════
     1. NAVBAR — scroll background
     ══════════════════════════════════════════════════════════════ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════════════════════════
     2. MOBILE MENU — hamburger toggle
     ══════════════════════════════════════════════════════════════ */
  function initMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('nav-mobile');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('[data-mobile-link]').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     3. SCROLL-REVEAL — IntersectionObserver fade-in
     ══════════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════
     4. 3D TILT EFFECT — mouse/touch/gyroscope card tilt
     ══════════════════════════════════════════════════════════════ */
  function init3DTilt() {
    const cards = document.querySelectorAll('.tilt-card');
    if (!cards.length) return;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const MAX_TILT = 12; // degrees

    cards.forEach(card => {
      const inner = card.querySelector('.tilt-card-inner');
      if (!inner) return;

      if (!isMobile) {
        // Desktop: mouse tracking
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          const rotateX = (0.5 - y) * MAX_TILT;
          const rotateY = (x - 0.5) * MAX_TILT;

          inner.style.transform =
            `perspective(${1200}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
            
          // Dynamic light tracking for glow effect
          card.style.setProperty('--mouse-x', `${x * 100}%`);
          card.style.setProperty('--mouse-y', `${y * 100}%`);
        });

        card.addEventListener('mouseleave', () => {
          inner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
      }
    });

    // Hero logo tilt
    const heroLogo = document.getElementById('hero-logo-tilt');
    if (heroLogo && !isMobile) {
      const heroVisual = document.getElementById('hero-visual');
      if (heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
          const rect = heroVisual.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          const rotateX = (0.5 - y) * 15;
          const rotateY = (x - 0.5) * 15;

          heroLogo.style.transform =
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        heroVisual.addEventListener('mouseleave', () => {
          heroLogo.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
      }
    }

    // Mobile: Gyroscope tilt (if permission granted)
    if (isMobile && window.DeviceOrientationEvent) {
      initGyroscopeTilt(cards);
    }
  }

  function initGyroscopeTilt(cards) {
    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // We'll attach to a user gesture
      document.addEventListener('touchstart', function requestGyro() {
        DeviceOrientationEvent.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              attachGyroscope(cards);
            }
          })
          .catch(() => {});
        document.removeEventListener('touchstart', requestGyro);
      }, { once: true });
    } else {
      attachGyroscope(cards);
    }
  }

  function attachGyroscope(cards) {
    window.addEventListener('deviceorientation', (e) => {
      const beta = Math.max(-30, Math.min(30, e.beta || 0));   // front-back
      const gamma = Math.max(-30, Math.min(30, e.gamma || 0)); // left-right

      const rotateX = (beta / 30) * 6;
      const rotateY = (gamma / 30) * 6;

      cards.forEach(card => {
        const inner = card.querySelector('.tilt-card-inner');
        if (inner && isInViewport(card)) {
          inner.style.transform =
            `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      });
    }, { passive: true });
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /* ══════════════════════════════════════════════════════════════
     5. PARALLAX — hero background layers
     ══════════════════════════════════════════════════════════════ */
  function initParallax() {
    const bg = document.getElementById('parallax-bg');
    if (!bg) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scroll = window.scrollY;
          if (scroll < window.innerHeight * 1.5) {
            bg.style.transform = `translateY(${scroll * 0.3}px) scale(1.1)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════
     6. PRODUCT LOAD & CAROUSEL & MODAL
     ══════════════════════════════════════════════════════════════ */
  let globalProducts = [];

  let currentFilters = {
    search: '',
    category: '',
    brand: [],
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  };

  window.toggleMobileFilter = function() {
    const sidebar = document.getElementById('filter-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  };

  window.applyFilters = function(skipSearchInputUpdate = false) {
    const categoryEl = document.querySelector('input[name="category"]:checked');
    currentFilters.category = categoryEl ? categoryEl.value : '';

    const brandEls = document.querySelectorAll('.brand-cb:checked');
    currentFilters.brand = Array.from(brandEls).map(cb => cb.value);

    const minPriceEl = document.getElementById('minPrice');
    currentFilters.minPrice = minPriceEl ? minPriceEl.value : '';

    const maxPriceEl = document.getElementById('maxPrice');
    currentFilters.maxPrice = maxPriceEl ? maxPriceEl.value : '';

    const sortEl = document.getElementById('sortSelect');
    currentFilters.sort = sortEl ? sortEl.value : 'newest';

    loadProducts();
  };

  window.resetFilters = function() {
    const searchInput = document.querySelector('#desktop-search input');
    if (searchInput) searchInput.value = '';
    currentFilters.search = '';
    
    const defaultCat = document.querySelector('input[name="category"][value=""]');
    if (defaultCat) defaultCat.checked = true;
    
    document.querySelectorAll('.brand-cb').forEach(cb => cb.checked = false);
    
    const minPriceEl = document.getElementById('minPrice');
    if (minPriceEl) minPriceEl.value = '';
    
    const maxPriceEl = document.getElementById('maxPrice');
    if (maxPriceEl) maxPriceEl.value = '';
    
    const sortEl = document.getElementById('sortSelect');
    if (sortEl) sortEl.value = 'newest';
    
    applyFilters();
  };

  async function loadProducts() {
    const carousel = document.getElementById('products-carousel');
    const resultsCount = document.getElementById('results-count');
    
    if (carousel) {
      carousel.innerHTML = `
        <div class="products-loading-state" id="products-loader" style="grid-column: 1 / -1;">
          <div class="spinner"></div>
          <p>Loading gadgets...</p>
        </div>
      `;
    }

    try {
      const params = new URLSearchParams();
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.brand.length > 0) params.append('brand', currentFilters.brand.join(','));
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
      if (currentFilters.sort) params.append('sort', currentFilters.sort);

      const res = await fetch(`${API_BASE}/api/v1/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        let products = json.data || json;
        
        if (currentFilters.wishlistOnly) {
          products = products.filter(p => userWishlist.includes(p.id));
        }
        
        globalProducts = products;
        
        if (resultsCount) resultsCount.textContent = `Showing ${globalProducts.length} results`;
        
        if (globalProducts.length === 0 && carousel) {
          carousel.innerHTML = `
            <div class="products-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
              <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
              <h3>No products found</h3>
              <p>${currentFilters.wishlistOnly ? 'Your Favourites list is empty.' : 'Try adjusting your filters or search criteria.'}</p>
              <button class="btn btn-secondary" onclick="resetFilters()" style="margin-top:10px;">Clear Filters</button>
            </div>
          `;
          return;
        }
        
        renderProducts(globalProducts);
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Failed to load products', err);
      if (carousel) {
        carousel.innerHTML = `
          <div class="products-error-state" style="grid-column: 1 / -1; text-align: center;">
            <p class="error-msg">⚠️ Failed to load products. The server might be warming up. Please try again.</p>
            <button class="btn btn-primary retry-btn" id="retry-load-products-btn">🔄 Retry</button>
          </div>
        `;
        const retryBtn = document.getElementById('retry-load-products-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', loadProducts);
        }
      }
    }
  }

  function renderProducts(products) {
    const carousel = document.getElementById('products-carousel');
    const orderSelect = document.getElementById('order-product');
    if (!carousel) return;

    carousel.innerHTML = '';
    if (orderSelect) {
      orderSelect.innerHTML = '<option value="" disabled selected>Select a product...</option>';
    }

    products.forEach((p, index) => {
      let images = [];
      try { images = JSON.parse(p.images); } catch(e){}
      let mainImg = images.length > 0 ? images[0] : 'assets/headphone.png';
      if (mainImg.startsWith('/')) mainImg = API_BASE + mainImg;
      
      const hasDiscount = p.sale_price < p.price;
      const discountPct = hasDiscount ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
      
      const priceDisplay = p.sale_price ? `৳${p.sale_price}` : `৳${p.price}`;
      const oldPriceDisplay = hasDiscount ? `<span class="product-price-old" style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem;">৳${p.price}</span>` : '';
      
      const rating = parseFloat(p.averageRating || 4.5).toFixed(1);
      const reviews = p.reviewCount || Math.floor(Math.random() * 500) + 50; 
      
      const isTopItem = p.isFeatured || index === 0;
      const topItemBadge = isTopItem ? `<div class="badge-top-item" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: var(--warning); color: #000; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; z-index: 2;">Top item</div>` : '';
      const stockBadge = (p.stock < 10) ? `<div class="badge-stock" style="position: absolute; top: 10px; left: 10px; background: var(--danger); color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; z-index: 2;">Selling Fast</div>` : '';

      // Carousel Card
      const card = document.createElement('div');
      card.className = `product-card tilt-card reveal reveal-delay-${(index % 6) + 1} visible`;
      card.innerHTML = `
        <div class="product-card-inner tilt-card-inner">
          <div class="product-image-wrapper">
            <button class="btn-wishlist" onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)">🤍</button>
            ${topItemBadge}
            ${stockBadge}
            <img src="${mainImg}" alt="${p.title}" loading="lazy" />
            <div class="product-hover-actions">
              <button class="btn-quick-view" onclick="event.stopPropagation(); openProductModalById(${p.id})">Quick View</button>
            </div>
          </div>
          <div class="product-info">
            <div class="product-rating">
              <span style="color: #fbbf24; font-size: 0.95rem; line-height: 1; vertical-align: middle;">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span>
              <span style="font-weight: 600; font-size: 0.8rem; margin-left: 4px; vertical-align: middle;">${rating}/5</span>
              <span style="color: var(--text-muted); font-size: 0.8rem; vertical-align: middle;">(${reviews})</span>
            </div>
            <div class="product-name">${p.title}</div>
            <div class="product-price-row">
              <div class="price-col" style="display: flex; flex-direction: column;">
                ${oldPriceDisplay}
                <span class="product-price" style="color: var(--blue-600); font-weight: 800; font-size: 1.25rem;">${priceDisplay}</span>
              </div>
              <button class="btn-add-cart" onclick="addToCart(${p.id}, event)">🛒 Add</button>
            </div>
          </div>
        </div>
      `;
      
      // Open detail modal on click
      card.addEventListener('click', () => openProductModal(p));
      carousel.appendChild(card);

      // Order Select Option (Fallback for older HTML versions)
      if (orderSelect) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.title} (${priceDisplay})`;
        orderSelect.appendChild(opt);
      }
    });

    initCarouselNavigation(carousel);
    initModalEvents();
    if (typeof updateWishlistUI === 'function') updateWishlistUI();
  }

  window.changeProductSelection = function() {
    const summaryCard = document.getElementById('order-product-summary');
    const productGroup = document.getElementById('order-product-group');
    const idInput = document.getElementById('order-product-id');
    const select = document.getElementById('order-product');
    
    if (summaryCard) summaryCard.style.display = 'none';
    if (productGroup) productGroup.style.display = 'block';
    if (idInput) idInput.value = '';
    if (select) select.required = true;
  };

  window.openOrderForm = function(productId) {
    if (productId) {
      const product = globalProducts.find(p => p.id === productId);
      if (product) {
        let cart = getCart();
        if (!cart.some(item => item.product.id === productId)) {
          cart.push({ product, quantity: 1 });
          saveCart(cart);
          updateCartUI();
        }
      }
    }

    const modal = document.getElementById('product-detail-overlay');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Smooth scroll to order form
    const formSection = document.getElementById('order');
    if (formSection) {
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70;
      const top = formSection.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  function initCarouselNavigation(carousel) {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    const getScrollAmount = () => {
      const card = carousel.querySelector('.product-card');
      return card ? card.offsetWidth + 24 : 300;
    };

    if (nextBtn) nextBtn.onclick = () => carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    if (prevBtn) prevBtn.onclick = () => carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });

    let isDown = false, startX, scrollLeft;
    carousel.onmousedown = (e) => { isDown = true; startX = e.pageX - carousel.offsetLeft; scrollLeft = carousel.scrollLeft; };
    carousel.onmouseleave = () => { isDown = false; };
    carousel.onmouseup = () => { isDown = false; };
    carousel.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); carousel.scrollLeft = scrollLeft - ((e.pageX - carousel.offsetLeft) - startX) * 1.5; };
  }

  function openProductModal(product) {
    const modal = document.getElementById('product-detail-overlay');
    if (!modal) return;

    let images = [];
    try { images = JSON.parse(product.images); } catch(e){}
    if (images.length === 0) images = ['assets/headphone.png'];
    images = images.map(img => img.startsWith('/') ? API_BASE + img : img);

    const mainImg = document.getElementById('modal-main-img');
    const thumbsContainer = document.getElementById('modal-thumbnails');
    
    mainImg.src = images[0];
    thumbsContainer.innerHTML = '';
    
    images.forEach((imgUrl, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumbnail-item' + (i === 0 ? ' active' : '');
      thumb.innerHTML = `<img src="${imgUrl}" />`;
      thumb.onclick = () => {
        mainImg.src = imgUrl;
        thumbsContainer.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      };
      thumbsContainer.appendChild(thumb);
    });

    document.getElementById('modal-product-title').textContent = product.title || product.nameEn;
    
    const titleBnEl = document.getElementById('modal-product-title-bn');
    if (titleBnEl) {
      titleBnEl.textContent = product.nameBn || '';
      titleBnEl.style.display = product.nameBn ? 'block' : 'none';
    }
    
    const hasDiscount = product.sale_price < product.price;
    document.getElementById('modal-sale-price').textContent = product.sale_price ? `৳${product.sale_price}` : `৳${product.price}`;
    document.getElementById('modal-regular-price').textContent = hasDiscount ? `৳${product.price}` : '';
    document.getElementById('modal-save-badge').style.display = hasDiscount ? 'inline-block' : 'none';
    document.getElementById('modal-save-badge').textContent = hasDiscount ? `Save ৳${product.price - product.sale_price}` : '';

    const statusBadge = document.getElementById('modal-status-badge');
    if (product.stock > 0) {
      statusBadge.textContent = 'In Stock';
      statusBadge.className = 'modal-status-badge';
    } else {
      statusBadge.textContent = 'Out of Stock';
      statusBadge.className = 'modal-status-badge out-of-stock';
    }

    // Render description using marked.js if available
    const descEl = document.getElementById('modal-description');
    if (typeof marked !== 'undefined') {
      descEl.innerHTML = marked.parse(product.description || '');
    } else {
      descEl.textContent = product.description || '';
    }

    const orderBtn = document.getElementById('modal-order-btn');
    orderBtn.onclick = () => window.openOrderForm(product.id);
    if (product.stock <= 0) {
      orderBtn.disabled = true;
      orderBtn.innerHTML = 'Out of Stock';
    } else {
      orderBtn.disabled = false;
      orderBtn.innerHTML = '<span class="btn-icon">🛒</span> Order Now';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.openProductModalById = function(id) {
    const p = globalProducts.find(x => x.id === id);
    if (p) openProductModal(p);
  };

  function initModalEvents() {
    const modal = document.getElementById('product-detail-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      };
    }
    
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      };
    }
  }

  /* ══════════════════════════════════════════════════════════════
     7. FAQ ACCORDION
     ══════════════════════════════════════════════════════════════ */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all others
        items.forEach(other => {
          other.classList.remove('active');
          const btn = other.querySelector('.faq-question');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked
        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     8. COUNTDOWN TIMER
     ══════════════════════════════════════════════════════════════ */
  function initCountdown() {
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');
    if (!daysEl) return;

    // Set target to 3 days from now (rolling offer)
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(23, 59, 59, 0);

    function update() {
      const now = new Date();
      let diff = target - now;
      if (diff < 0) diff = 0;

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = String(d).padStart(2, '0');
      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      secsEl.textContent = String(s).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  /* ══════════════════════════════════════════════════════════════
     9. ANIMATED COUNTERS — scroll-triggered number counting
     ══════════════════════════════════════════════════════════════ */
  function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 2000;
    const start = performance.now();
    const suffix = target >= 100 ? '+' : isDecimal ? '★' : '/7';

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = eased * target;

      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /* ══════════════════════════════════════════════════════════════
     10. SMOOTH SCROLL — anchor links
     ══════════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const hash = link.getAttribute('href');
        if (hash === '#') return;

        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

          window.scrollTo({ top, behavior: 'smooth' });

          // Update URL without jump
          history.pushState(null, '', hash);
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     11. MOBILE STICKY CTA VISIBILITY
     ══════════════════════════════════════════════════════════════ */
  function initMobileStickyVisibility() {
    const sticky = document.getElementById('mobile-sticky-cta');
    if (!sticky) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const show = window.scrollY > window.innerHeight * 0.5;
          sticky.style.transform = show ? 'translateY(0)' : 'translateY(100%)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initially hidden
    sticky.style.transform = 'translateY(100%)';
    sticky.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
  }

  /* ══════════════════════════════════════════════════════════════
     12. PROFILE & TRACKING
     ══════════════════════════════════════════════════════════════ */
  // ── PROFILE PREMIUM UI HELPERS ───────────────────────────────────
  const PROFILE_MENU_SECTIONS = [
    {
      title: 'Shopping',
      items: [
        { icon: '📦', title: 'My Orders', subtitle: 'View past & current orders', action: () => showProfileView('orders') },
        { icon: '❤️', title: 'Wishlist', subtitle: 'Saved favorite items', action: () => { const favs = document.querySelector('.nav-link[href="#favourites"]'); if (favs) favs.click(); } },
        { icon: '🎫', title: 'Active Coupons', subtitle: 'View your available coupon codes', action: () => alert('You have 2 coupons available: GG50, WELCOME10') }
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: '👤', title: 'Personal Information', subtitle: 'Update your name and phone number', action: () => showProfileView('edit') },
        { icon: '📍', title: 'Saved Addresses', subtitle: 'Manage default delivery address', action: () => showProfileView('edit') }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: '🌓', 
          title: 'Theme Settings', 
          subtitle: 'Switch between Dark and Light mode', 
          action: () => toggleThemePreference() 
        },
        { icon: '🔔', title: 'Notifications', subtitle: 'Email and SMS alerts settings', action: () => alert('Notifications are enabled for shipping updates.') }
      ]
    },
    {
      title: 'Help & Security',
      items: [
        { icon: '🛠️', title: 'Customer Support', subtitle: 'FAQs, Contact Us, Chat Support', action: () => { const faqLink = document.querySelector('a[href="/#faq"]'); if (faqLink) faqLink.click(); } },
        { icon: '🚪', title: 'Sign Out', subtitle: 'Log out of your account securely', action: () => logout() }
      ]
    }
  ];

  window.handleProfileBack = function() {
    const editView = document.getElementById('profile-edit-view');
    const ordersView = document.getElementById('profile-orders-view');
    if ((editView && editView.style.display !== 'none') || (ordersView && ordersView.style.display !== 'none')) {
      showProfileView('dashboard');
    } else {
      routeTo('/');
    }
  };

  window.toggleThemePreference = function() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('gg_theme', isLight ? 'light' : 'dark');
    renderProfileMenu();
  };

  window.handleAvatarUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      const avatarImg = document.getElementById('profile-avatar-img');
      if (avatarImg) avatarImg.src = base64;
      
      const token = localStorage.getItem('gg_token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64Clean = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64Clean));
          const userId = payload.sub || payload.id;
          if (userId) {
            localStorage.setItem('gg_avatar_' + userId, base64);
          }
        } catch(err) {
          console.error(err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  window.renderProfileMenu = function() {
    const container = document.getElementById('profile-menu-groups');
    if (!container) return;
    container.innerHTML = '';
    
    PROFILE_MENU_SECTIONS.forEach(sec => {
      const secEl = document.createElement('div');
      secEl.style.marginBottom = '24px';
      
      const titleEl = document.createElement('h3');
      titleEl.style.fontSize = '12px';
      titleEl.style.fontWeight = '700';
      titleEl.style.textTransform = 'uppercase';
      titleEl.style.letterSpacing = '1px';
      titleEl.style.color = 'var(--text-muted)';
      titleEl.style.marginBottom = '12px';
      titleEl.style.paddingLeft = '8px';
      titleEl.textContent = sec.title;
      secEl.appendChild(titleEl);
      
      const groupEl = document.createElement('div');
      groupEl.className = 'profile-menu-group';
      
      sec.items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'profile-menu-row';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.onclick = item.action;
        row.onkeydown = (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.action(); } };
        
        // Dynamic status subtitles (e.g. for theme toggle)
        let subtitle = item.subtitle;
        if (item.title === 'Theme Settings') {
          const isLight = document.body.classList.contains('light-theme');
          subtitle = `Current: ${isLight ? 'Light Mode' : 'Dark Mode'}`;
        }
        
        row.innerHTML = `
          <div class="profile-row-leading">
            <div class="profile-row-icon">${item.icon}</div>
            <div class="profile-row-meta">
              <div class="profile-row-title">${item.title}</div>
              ${subtitle ? `<div class="profile-row-subtitle">${subtitle}</div>` : ''}
            </div>
          </div>
          <div class="profile-row-chevron">›</div>
        `;
        groupEl.appendChild(row);
        
        if (idx < sec.items.length - 1) {
          const divider = document.createElement('div');
          divider.className = 'profile-row-divider';
          groupEl.appendChild(divider);
        }
      });
      
      secEl.appendChild(groupEl);
      container.appendChild(secEl);
    });
  };

  window.showProfileView = function(view) {
    document.getElementById('profile-dashboard').style.display = 'none';
    document.getElementById('profile-edit-view').style.display = 'none';
    document.getElementById('profile-orders-view').style.display = 'none';

    if (view === 'edit') {
      document.getElementById('profile-edit-view').style.display = 'block';
    } else if (view === 'orders') {
      document.getElementById('profile-orders-view').style.display = 'block';
      loadOrderHistory();
    } else {
      document.getElementById('profile-dashboard').style.display = 'block';
    }
  };

  window.openProfile = async function(e) {
    if (e) e.preventDefault();
    const token = localStorage.getItem('gg_token');
    if (!token) {
      window.routeTo('/');
      openAuthModal();
      return;
    }

    if (window.location.pathname !== '/profile') {
      window.routeTo('/profile');
      return;
    }

    // Reset to dashboard when opening profile
    if (typeof showProfileView === 'function') {
      showProfileView('dashboard');
    }

    // Check theme on page load / profile load
    const savedTheme = localStorage.getItem('gg_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/customers/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      
      const json = await res.json();
      const profile = json.data || json;
      
      const name = profile.name || 'User';
      document.getElementById('profile-name').value = name;
      document.getElementById('profile-phone').value = profile.phone || '';
      document.getElementById('profile-address').value = profile.address || '';
      
      // REDESIGNED STATS AND BADGES BINDER
      const orders = profile.orders || [];
      const deliveredOrders = orders.filter(o => o.status.toLowerCase() === 'delivered');
      const ltv = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const points = Math.floor(ltv / 10);
      
      document.getElementById('profile-hero-name').innerText = name;
      document.getElementById('profile-summary-orders').innerText = deliveredOrders.length;
      document.getElementById('profile-summary-spent').innerText = '৳' + Math.floor(ltv).toLocaleString();
      document.getElementById('profile-summary-points').innerText = points;

      // Membership Badge
      const badgeEl = document.getElementById('profile-membership-badge');
      if (badgeEl) {
        badgeEl.className = 'profile-membership-badge';
        if (ltv >= 10000) {
          badgeEl.classList.add('badge-gold');
          badgeEl.innerText = '🥇 Gold Member';
        } else if (ltv >= 4000) {
          badgeEl.classList.add('badge-silver');
          badgeEl.innerText = '🥈 Silver Member';
        } else {
          badgeEl.classList.add('badge-bronze');
          badgeEl.innerText = '🥉 Bronze Member';
        }
      }

      // Quick action badges
      const shippingCount = orders.filter(o => ['packed', 'courier_booked', 'in_transit'].includes(o.status.toLowerCase())).length;
      const deliveredCount = orders.filter(o => o.status.toLowerCase() === 'delivered').length;
      
      document.getElementById('badge-orders-all').innerText = orders.length;
      document.getElementById('badge-orders-shipping').innerText = shippingCount;
      document.getElementById('badge-orders-delivered').innerText = deliveredCount;
      document.getElementById('badge-wishlist-count').innerText = window.userWishlist ? window.userWishlist.length : 0;
      document.getElementById('badge-rewards-points').innerText = points;

      // Load avatar from localStorage
      let userId = null;
      try {
        const base64Url = token.split('.')[1];
        const base64Clean = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64Clean));
        userId = payload.sub || payload.id;
      } catch(e) {}
      
      const avatarImg = document.getElementById('profile-avatar-img');
      if (avatarImg) {
        const savedAvatar = userId ? localStorage.getItem('gg_avatar_' + userId) : null;
        avatarImg.src = savedAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
      }

      // Render Dynamic Menu
      renderProfileMenu();
      
      loadOrderHistory(orders);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('gg_token');
      window.routeTo('/');
      openAuthModal();
    }
  };

  window.saveProfile = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('gg_token');
    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;
    const msg = document.getElementById('profile-msg');
    const btn = document.getElementById('profile-save-btn');
    
    msg.innerText = '';
    btn.disabled = true;
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/customers/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, address })
      });
      
      if (res.ok) {
        msg.innerText = 'Profile updated successfully!';
        msg.style.color = 'var(--success)';
        // Update nav text if name changed
        const authLink = document.getElementById('nav-auth-link');
        if (authLink) {
          authLink.innerHTML = `👤 Profile (${name.split(' ')[0]}) - Logout`;
        }
        document.getElementById('profile-header-name').innerText = name;
        
        // Return to dashboard after saving
        setTimeout(() => {
          if (typeof showProfileView === 'function') showProfileView('dashboard');
        }, 1000);
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      msg.innerText = 'Update failed. Please try again.';
      msg.style.color = 'var(--danger)';
    } finally {
      btn.disabled = false;
      setTimeout(() => msg.innerText = '', 3000);
    }
  };

  window.loadOrderHistory = async function(ordersData) {
    let orders = ordersData;
    if (!orders) {
      const token = localStorage.getItem('gg_token');
      try {
        const res = await fetch(`${API_BASE}/api/v1/customers/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        orders = (json.data || json).orders || [];
      } catch (err) {
        return;
      }
    }
    
    const tbody = document.getElementById('profile-orders-tbody');
    if (!tbody) return;
    
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">No orders found. <a href="/#products" onclick="window.routeTo('/'); return false;" style="color: var(--primary);">Shop now</a></td></tr>`;
      return;
    }
    
    tbody.innerHTML = '';
    
    // Sort descending by created_at
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    orders.forEach(order => {
      const d = new Date(order.created_at);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      let productDisplay = order.product 
        ? `${order.product.title} <span style="color: var(--text-muted); font-size: 12px;">x${order.quantity}</span>`
        : 'Product Removed';

      if (order.items_json) {
        try {
          const items = JSON.parse(order.items_json);
          if (Array.isArray(items) && items.length > 0) {
            productDisplay = items.map(item => `${item.title} <span style="color: var(--text-muted); font-size: 12px;">x${item.quantity}</span>`).join('<br />');
          }
        } catch(e) {}
      }
      
      const statusColors = {
        pending: '#b45309', confirmed: '#1d4ed8', packed: '#4338ca', courier_booked: '#be185d',
        in_transit: '#92400e', delivered: '#15803d', returned: '#b91c1c', cancelled: '#475569'
      };
      const statusBg = {
        pending: '#fef3c7', confirmed: '#dbeafe', packed: '#e0e7ff', courier_booked: '#fce7f3',
        in_transit: '#fef3c7', delivered: '#dcfce3', returned: '#fee2e2', cancelled: '#f1f5f9'
      };
      
      const stColor = statusColors[order.status] || '#475569';
      const stBg = statusBg[order.status] || '#f1f5f9';
      const statusLabel = order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      tbody.innerHTML += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 16px 8px; font-weight: 500;">
            <a href="/track?id=${order.orderId || ''}" onclick="window.routeTo('/track?id=${order.orderId || ''}'); return false;" style="color: var(--primary); text-decoration: none;">
              ${order.orderId || ('#' + order.id)}
            </a>
          </td>
          <td style="padding: 16px 8px; color: var(--text-muted); font-size: 14px;">${dateStr}</td>
          <td style="padding: 16px 8px;">${productDisplay}</td>
          <td style="padding: 16px 8px; font-weight: 600;">৳${order.subtotal}</td>
          <td style="padding: 16px 8px;">
            <span style="background: ${stBg}; color: ${stColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              ${statusLabel}
            </span>
          </td>
        </tr>
      `;
    });
  };

  window.trackOrder = async function(e) {
    if(e) e.preventDefault();
    const id = document.getElementById('tracking-id').value.trim();
    const resultDiv = document.getElementById('tracking-result');
    const btn = document.getElementById('tracking-btn');
    
    if (!id) return;
    
    btn.disabled = true;
    btn.innerText = '...';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="text-align: center; padding: 20px;">Fetching status...</div>';
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/track/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Order not found. Please check your Order ID.');
        throw new Error('Failed to track order.');
      }
      const data = await res.json();
      const order = data.data || data;
      
      // Build timeline
      let timelineHtml = '<div style="margin-top: 24px;">';
      if (order.statusHistory && order.statusHistory.length > 0) {
        order.statusHistory.forEach((sh, idx) => {
          const isLast = idx === order.statusHistory.length - 1;
          const d = new Date(sh.changed_at);
          const time = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
          const label = sh.to_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          timelineHtml += `
            <div style="display: flex; gap: 16px; margin-bottom: ${isLast ? '0' : '20px'}; position: relative;">
              ${!isLast ? '<div style="position: absolute; left: 11px; top: 24px; bottom: -20px; width: 2px; background: var(--border);"></div>' : ''}
              <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isLast ? 'var(--primary)' : 'var(--bg)'}; border: 2px solid var(--primary); flex-shrink: 0; z-index: 1;"></div>
              <div>
                <div style="font-weight: 600; color: ${isLast ? 'var(--text)' : 'var(--text-muted)'};">${label}</div>
                <div style="font-size: 13px; color: var(--text-muted);">${time}</div>
              </div>
            </div>
          `;
        });
      } else {
        timelineHtml += '<p>Order is pending.</p>';
      }
      timelineHtml += '</div>';
      
      const productTitle = order.product ? order.product.title : 'Product';
      let itemsDisplay = `Item: <span style="color: var(--text);">${productTitle}</span> (Qty: ${order.quantity})`;
      if (order.items_json) {
        try {
          const items = JSON.parse(order.items_json);
          if (Array.isArray(items) && items.length > 0) {
            itemsDisplay = items.map(item => `Item: <span style="color: var(--text);">${item.title}</span> (Qty: ${item.quantity})`).join('<br />');
          }
        } catch (e) {}
      }
      
      resultDiv.innerHTML = `
        <div style="border-top: 1px solid var(--border); margin-top: 24px; padding-top: 24px;">
          <h3 style="font-size: 18px; margin-bottom: 12px;">Order <strong>${order.orderId}</strong></h3>
          <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5;">${itemsDisplay}</div>
          <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px;">Total: <span style="color: var(--text); font-weight: 600;">৳${order.subtotal}</span></div>
          ${timelineHtml}
        </div>
      `;
    } catch (err) {
      resultDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--danger);">${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerText = 'Track';
    }
  };

  let searchTimeout = null;
  const searchInput = document.querySelector('#desktop-search input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        applyFilters(true);
      }, 400);
    });
  }

  const mobileSearchInput = document.getElementById('mobile-search-input');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        applyFilters(true);
      }, 400);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     7. STATE MANAGEMENT (WISHLIST & CART)
     ══════════════════════════════════════════════════════════════ */
  let userWishlist = [];
  let userCart = [];

  window.fetchWishlist = async function() {
    const token = localStorage.getItem('gg_token');
    if (!token) {
      updateWishlistUI();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/customers/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const profile = json.data || json;
        if (profile.wishlist) {
          userWishlist = profile.wishlist.map(w => w.id);
          updateWishlistUI();
        }
      }
    } catch (e) {
      console.error('Error fetching wishlist', e);
    }
  };

  window.toggleWishlist = async function(productId, btn) {
    const token = localStorage.getItem('gg_token');
    if (!token) {
      openAuthModal();
      return;
    }

    try {
      const isWishlisted = userWishlist.includes(productId);
      const method = isWishlisted ? 'DELETE' : 'POST';
      const endpoint = isWishlisted 
        ? `${API_BASE}/api/v1/customers/profile/wishlist/${productId}`
        : `${API_BASE}/api/v1/customers/profile/wishlist`;

      // Optimistic UI update
      if (isWishlisted) {
        userWishlist = userWishlist.filter(id => id !== productId);
      } else {
        userWishlist.push(productId);
      }
      updateWishlistUI();

      const res = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: isWishlisted ? null : JSON.stringify({ productId })
      });

      if (!res.ok) {
        throw new Error('Failed to update wishlist');
      }
    } catch (e) {
      console.error(e);
      fetchWishlist();
    }
  };

  function updateWishlistUI() {
    // Update all heart buttons
    const wishlistBtns = document.querySelectorAll('.btn-wishlist');
    wishlistBtns.forEach(btn => {
      const match = btn.getAttribute('onclick').match(/toggleWishlist\((\d+)/);
      if (match && match[1]) {
        const pId = parseInt(match[1]);
        if (userWishlist.includes(pId)) {
          btn.innerHTML = '❤️';
          btn.style.color = 'red';
          btn.classList.add('active');
        } else {
          btn.innerHTML = '🤍';
          btn.style.color = 'inherit';
          btn.classList.remove('active');
        }
      }
    });

    // Update Desktop Nav Badge
    const navLinks = document.querySelectorAll('.nav-link .nav-label');
    navLinks.forEach(el => {
      if(el.innerText.includes('Favourites')) {
        el.innerText = `Favourites (${userWishlist.length})`;
      }
    });
  }

  // Get cart from localStorage
  window.getCart = function() {
    const saved = localStorage.getItem('gg_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Upgrade from old single item format
        return [{ product: parsed, quantity: 1 }];
      }
    } catch(e) {
      console.error(e);
    }
    return [];
  };

  // Save cart to localStorage
  window.saveCart = function(cart) {
    localStorage.setItem('gg_cart', JSON.stringify(cart));
  };

  window.addToCart = function(productId, e) {
    if(e) e.stopPropagation();
    const product = globalProducts.find(p => p.id === productId);
    if (!product) return;
    
    let cart = getCart();
    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
    saveCart(cart);
    updateCartUI();
    
    // Auto-open order form after adding
    openOrderForm();
  };

  window.openCart = function(e) {
    if(e) e.preventDefault();
    const cart = getCart();
    if (cart.length > 0) {
      openOrderForm();
    } else {
      alert("Your cart is empty. Please add a product to order.");
      const shopSection = document.getElementById('products');
      if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.updateItemQuantity = function(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.product.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      saveCart(cart);
      updateCartUI();
    }
  };

  window.removeFromCart = function(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.product.id !== productId);
    saveCart(cart);
    updateCartUI();
  };

  window.clearCart = function() {
    saveCart([]);
    updateCartUI();
  };

  window.updateCartUI = function() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Desktop Nav Badge
    const navCartBadge = document.querySelector('.nav-link[href="#cart"] span:last-child');
    if(navCartBadge) navCartBadge.innerText = count;

    // Mobile Bottom Bar Badge
    const mobileCartBadge = document.querySelector('.bottom-bar-item[href="#cart"] .badge');
    if(mobileCartBadge) mobileCartBadge.innerText = count;

    // Render cart items inside order checkout summary card
    const summaryCard = document.getElementById('order-product-summary');
    const productGroup = document.getElementById('order-product-group');
    const select = document.getElementById('order-product');
    const cartItemsList = document.getElementById('cart-items-list');

    if (!summaryCard) return;

    if (cart.length === 0) {
      summaryCard.style.display = 'none';
      if (productGroup) productGroup.style.display = 'block';
      if (select) select.required = true;
    } else {
      summaryCard.style.display = 'flex';
      if (productGroup) productGroup.style.display = 'none';
      if (select) select.required = false;

      if (cartItemsList) {
        cartItemsList.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
          const p = item.product;
          let images = [];
          try { images = JSON.parse(p.images); } catch(e){}
          let mainImg = images.length > 0 ? images[0] : 'assets/headphone.png';
          if (mainImg.startsWith('/')) mainImg = API_BASE + mainImg;
          
          const price = Number(p.sale_price || p.price);
          const itemTotal = price * item.quantity;
          subtotal += itemTotal;

          const itemEl = document.createElement('div');
          itemEl.style.display = 'flex';
          itemEl.style.alignItems = 'center';
          itemEl.style.gap = '15px';
          itemEl.style.background = 'rgba(255, 255, 255, 0.05)';
          itemEl.style.padding = '10px';
          itemEl.style.borderRadius = '8px';
          itemEl.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          itemEl.style.width = '100%';
          
          itemEl.innerHTML = `
            <img src="${mainImg}" alt="${p.title}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; background: white;" />
            <div style="flex: 1;">
              <div style="color: white; font-weight: 600; font-size: 0.9rem; line-height: 1.2; margin-bottom: 4px;">${p.title}</div>
              <div style="color: var(--orange-400); font-weight: 700; font-size: 0.9rem;">৳${price}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" style="background: rgba(255,255,255,0.1); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;" onclick="updateItemQuantity(${p.id}, ${item.quantity - 1})">-</button>
              <span style="color: white; font-weight: 600; min-width: 16px; text-align: center;">${item.quantity}</span>
              <button type="button" style="background: rgba(255,255,255,0.1); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;" onclick="updateItemQuantity(${p.id}, ${item.quantity + 1})">+</button>
            </div>
            <button type="button" style="color: var(--danger); font-size: 1.1rem; margin-left: 5px; padding: 5px; cursor: pointer;" onclick="removeFromCart(${p.id})">✕</button>
          `;
          cartItemsList.appendChild(itemEl);
        });

        const deliveryCharge = 60 * cart.length;
        const total = subtotal + deliveryCharge;

        document.getElementById('cart-subtotal-val').textContent = `৳${subtotal}`;
        document.getElementById('cart-delivery-val').textContent = `৳${deliveryCharge} (৳60 x ${cart.length})`;
        document.getElementById('cart-total-val').textContent = `৳${total}`;
      }
    }
  };

  // Initialize State
  fetchWishlist();
  updateCartUI();

  // Override standard Add to cart button clicks in products
  window.addEventListener('load', () => {
    // We already generate the product cards in JS, but let's make sure the Cart icon works
    const cartLinks = document.querySelectorAll('a[href="#cart"]');
    cartLinks.forEach(link => {
      link.addEventListener('click', openCart);
    });
  });

})();
