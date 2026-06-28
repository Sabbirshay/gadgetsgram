/* ===================================================================
   GADGETS GRAM — গ্যাজেটস গ্রাম
   3D Interactive Landing Page — JavaScript
   =================================================================== */

(function () {
  'use strict';

  /* ── DOM Ready ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
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
  }

  /* ══════════════════════════════════════════════════════════════
     0. ORDER FORM — submit to API
     ══════════════════════════════════════════════════════════════ */
  function initOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('submit-order-btn');
      const originalText = btn.innerText;
      btn.innerText = 'Submitting...';
      btn.disabled = true;
      
      const payload = {
        customer_name: document.getElementById('order-name').value,
        phone: document.getElementById('order-phone').value,
        address: document.getElementById('order-address').value,
        district: document.getElementById('order-district').value,
        product_id: parseInt(document.getElementById('order-product').value, 10),
        quantity: 1
      };

      try {
        const res = await fetch('http://localhost:3000/api/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          document.getElementById('order-success-msg').style.display = 'block';
          document.getElementById('order-error-msg').style.display = 'none';
          form.reset();
          setTimeout(() => {
            document.getElementById('order-success-msg').style.display = 'none';
          }, 5000);
        } else {
          throw new Error('Failed to submit');
        }
      } catch (err) {
        document.getElementById('order-error-msg').style.display = 'block';
        document.getElementById('order-success-msg').style.display = 'none';
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
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

  async function loadProducts() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/products');
      if (res.ok) {
        const json = await res.json();
        globalProducts = json.data || json;
        renderProducts(globalProducts);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    }
  }

  function renderProducts(products) {
    const carousel = document.getElementById('products-carousel');
    const orderSelect = document.getElementById('order-product');
    if (!carousel || !orderSelect) return;

    carousel.innerHTML = '';
    orderSelect.innerHTML = '<option value="" disabled selected>Select a product...</option>';

    products.forEach((p, index) => {
      let images = [];
      try { images = JSON.parse(p.images); } catch(e){}
      let mainImg = images.length > 0 ? images[0] : 'assets/headphone.png';
      if (mainImg.startsWith('/')) mainImg = 'http://localhost:3000' + mainImg;
      
      const hasDiscount = p.sale_price < p.price;
      const discountPct = hasDiscount ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
      
      const priceDisplay = p.sale_price ? `৳${p.sale_price}` : `৳${p.price}`;
      const oldPriceDisplay = hasDiscount ? `<span class="product-price-old">৳${p.price}</span>` : '';
      const saveDisplay = hasDiscount ? `<span class="product-price-save">Save ৳${p.price - p.sale_price}</span>` : '';
      const badgeDisplay = hasDiscount ? `<span class="product-badge">-${discountPct}%</span>` : '';

      // Carousel Card
      const card = document.createElement('div');
      card.className = `product-card tilt-card reveal reveal-delay-${(index % 6) + 1} visible`;
      card.innerHTML = `
        <div class="product-card-inner tilt-card-inner">
          <div class="product-image-wrapper">
            ${badgeDisplay}
            <img src="${mainImg}" alt="${p.title}" loading="lazy" width="200" height="200" />
          </div>
          <div class="product-info">
            <div class="product-category">Gadget</div>
            <div class="product-name">${p.title}</div>
            <div class="product-price-row">
              <span class="product-price">${priceDisplay}</span>
              ${oldPriceDisplay}
              ${saveDisplay}
            </div>
            <button class="btn btn-primary product-cta" onclick="event.stopPropagation(); openOrderForm(${p.id})">🛒 Order Now</button>
          </div>
        </div>
      `;
      
      // Open detail modal on click
      card.addEventListener('click', () => openProductModal(p));
      carousel.appendChild(card);

      // Order Select Option
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.title} (${priceDisplay})`;
      orderSelect.appendChild(opt);
    });

    initCarouselNavigation(carousel);
    initModalEvents();
  }

  window.openOrderForm = function(productId) {
    const orderSelect = document.getElementById('order-product');
    if (orderSelect) orderSelect.value = productId;
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
    images = images.map(img => img.startsWith('/') ? 'http://localhost:3000' + img : img);

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

    document.getElementById('modal-product-title').textContent = product.title;
    
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

})();
