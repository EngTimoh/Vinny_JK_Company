/* ============================================
   VIN-KJ AUTO SERVICES - Frontend JavaScript
   API Integration & UI Logic
   ============================================ */

// ---- Configuration ----
const API_BASE_URL = '/api';

// ---- Mobile Nav Dropdown Toggle ----
function toggleMobileNav() {
  const nav = document.getElementById('navbarNav');
  if (!nav) return;
  nav.classList.toggle('show');
}

document.addEventListener('click', function (e) {
  if (window.innerWidth >= 992) return;
  const nav = document.getElementById('navbarNav');
  if (!nav || !nav.classList.contains('show')) return;
  const navbar = document.getElementById('mainNavbar');
  if (navbar && navbar.contains(e.target)) return;
  nav.classList.remove('show');
});

// ---- Utility Functions ----
function formatPrice(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return 'KSh 0';
  return 'KSh ' + num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function truncateText(text, maxLen) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sub = clean.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? sub.slice(0, lastSpace) : sub).trim() + '...';
}

function formatCardTitle(title) {
  if (!title) return '';
  let str = title.trim();
  // If the title is in ALL CAPS and longer than 3 characters, format with clean Title Case
  if (str === str.toUpperCase() && str.length > 3) {
    str = str.toLowerCase().replace(/\b\w+/g, word => {
      const upper = word.toUpperCase();
      if (['PPF', 'BMW', 'SUV', 'SUVS', 'GPS', 'AOS', 'LED', 'VW', 'COD', '4WD', '2WD'].includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
  }
  return str;
}

function getImageUrl(imagePath) {
  if (!imagePath) return 'https://via.placeholder.com/400x250?text=No+Image';
  if (imagePath.startsWith('http') || imagePath.startsWith('https') || imagePath.startsWith('data:')) return imagePath;
  if (imagePath.startsWith('/media/') || imagePath.startsWith('media/')) {
    return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  }
  return '/media/' + (imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
}

function showAlert(elementId, message, duration) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (message) {
    const msgSpan = el.querySelector('span:not(.material-icons)') || el;
    if (msgSpan) msgSpan.textContent = message;
  }
  el.classList.remove('d-none');
  if (duration) {
    setTimeout(() => el.classList.add('d-none'), duration);
  }
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('d-none');
}

// ---- Client-side API Cache for Instant Page Loads ----
const apiCache = {
  get(key) {
    try {
      const item = sessionStorage.getItem(`vinkj_cache_${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.time < 180000) { // 3 minutes TTL
        return parsed.data;
      }
    } catch (e) {}
    return null;
  },
  set(key, data) {
    try {
      sessionStorage.setItem(`vinkj_cache_${key}`, JSON.stringify({ data, time: Date.now() }));
    } catch (e) {}
  }
};

// ---- API Fetch Functions ----
async function fetchServices(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = apiCache.get('services');
    if (cached) return cached;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/services/`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Failed to fetch services');
    const data = await response.json();
    apiCache.set('services', data);
    return data;
  } catch (error) {
    console.warn('API error:', error.message);
    return apiCache.get('services') || null;
  }
}

async function fetchProducts(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = apiCache.get('products');
    if (cached) return cached;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/products/`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    apiCache.set('products', data);
    return data;
  } catch (error) {
    console.warn('API error:', error.message);
    return apiCache.get('products') || null;
  }
}

async function createBooking(bookingData) {
  const response = await fetch(`${API_BASE_URL}/bookings/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create booking');
  }
  return await response.json();
}

async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create order');
  }
  return await response.json();
}

// ---- Cart Manager ----
const CartManager = {
  items: JSON.parse(localStorage.getItem('vinkj_cart')) || [],

  save() {
    localStorage.setItem('vinkj_cart', JSON.stringify(this.items));
    this.updateUI();
  },

  add(product, btn) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
      } else {
        alert('Cannot add more. Max stock reached.');
        return;
      }
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: 1
      });
    }
    this.save();
    this.showFloatingBadgeAnimation();

    // Visual feedback for the button
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="material-icons" style="font-size: 1.2rem;">check_circle</span> Added!`;
      btn.classList.replace('btn-primary-custom', 'btn-success');
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.replace('btn-success', 'btn-primary-custom');
        btn.disabled = false;
      }, 1500);
    }
  },

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.save();
  },

  updateQuantity(id, delta) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty > 0 && newQty <= item.stock) {
        item.quantity = newQty;
        this.save();
      }
    }
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  clear() {
    this.items = [];
    this.save();
  },

  updateUI() {
    const badge = document.getElementById('cartBadge');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    const container = document.getElementById('cartItemsContainer');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const count = this.getCount();

    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('d-none', count === 0);
    }

    if (totalDisplay) totalDisplay.textContent = formatPrice(this.getTotal());
    if (checkoutBtn) checkoutBtn.disabled = count === 0;

    if (container) {
      if (this.items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 opacity-50">
            <span class="material-icons" style="font-size: 3rem;">shopping_basket</span>
            <p class="mt-2">Your cart is empty — add some items first!</p>
          </div>
        `;
      } else {
        container.innerHTML = this.items.map(item => `
          <div class="cart-item-row">
            <img src="${getImageUrl(item.image)}" class="cart-item-img" alt="${item.name}">
            <div class="cart-item-info">
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-price">${formatPrice(item.price)}</div>
              <div class="qty-control">
                <button class="btn-qty" onclick="CartManager.updateQuantity(${item.id}, -1)">-</button>
                <span class="small mx-1">${item.quantity}</span>
                <button class="btn-qty" onclick="CartManager.updateQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-link btn-sm text-danger ms-auto p-0" onclick="CartManager.remove(${item.id})">
                  <span class="material-icons" style="font-size: 1.2rem;">delete_outline</span>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  },

  showFloatingBadgeAnimation() {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.classList.add('animate__animated', 'animate__pulse');
      setTimeout(() => cartBtn.classList.remove('animate__animated', 'animate__pulse'), 500);
    }
  }
};

// ---- Render Functions ----
// Cache for fetched data
let allProducts = [];
let allServices = [];

// ---- Global Helper for Slides/BeforeAfter ----
function initializeAutoCarousels() {
  const carousels = document.querySelectorAll('.auto-start-carousel');
  carousels.forEach(carousel => {
    // If it's already initialized by Bootstrap, this does nothing destructive
    if (window.bootstrap && bootstrap.Carousel) {
      let bsCarousel = bootstrap.Carousel.getInstance(carousel);
      if (!bsCarousel) {
        bsCarousel = new bootstrap.Carousel(carousel, {
          interval: 5000,
          ride: 'carousel'
        });
      }
      bsCarousel.cycle();
    }
  });
}

function generateImageSliderHTML(item, type, isPreview = false, extraOverlayHtml = '') {
  const images = item.images || [];
  let allImages = [];
  if (images.length > 0) {
    allImages = images;
  } else if (item.image) {
    allImages = [{ image: item.image, image_type: 'general' }];
  } else {
    allImages = [{ image: 'https://via.placeholder.com/400x300?text=' + (type === 'service' ? 'Service' : 'Product'), image_type: 'general' }];
  }

  const renderBadge = (iType) => {
    if (!iType) return '';
    const norm = iType.toLowerCase();
    if (norm === 'before' || norm === 'after') {
      return `<div class="item-card-badges"><span class="item-badge car-badge-type ${norm === 'after' ? 'car-badge-after' : 'car-badge-before'}">${norm}</span></div>`;
    }
    return '';
  };

  if (allImages.length === 1) {
    const imgUrl = getImageUrl(allImages[0].image);
    const badgeHtml = renderBadge(allImages[0].image_type);
    return `
      <div class="card-img-wrapper item-card-media">
        ${badgeHtml}
        ${extraOverlayHtml}
        <img src="${imgUrl}" class="card-img-top" alt="${item.name || ''}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/400x300?text=${type}'">
      </div>
    `;
  }

  const carouselId = `carousel-${type}-${item.id}`;
  const itemsHtml = allImages.map((img, index) => {
    const badgeHtml = renderBadge(img.image_type);
    return `
      <div class="carousel-item ${index === 0 ? 'active' : ''} h-100">
        ${badgeHtml}
        <img src="${getImageUrl(img.image)}" class="d-block w-100 h-100 card-img-top" alt="${item.name || ''}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/400x300?text=${type}'">
      </div>
    `;
  }).join('');

  return `
    <div id="${carouselId}" class="carousel slide carousel-fade auto-start-carousel card-img-wrapper item-card-media" data-bs-ride="carousel" data-bs-interval="5000" onclick="event.stopPropagation();">
      ${extraOverlayHtml}
      <div class="carousel-inner h-100">
        ${itemsHtml}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" aria-label="Previous">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" aria-label="Next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    </div>
  `;
}

function renderServiceCard(service, isPreview) {
  const formattedTitle = formatCardTitle(service.name);
  const imageHTML = generateImageSliderHTML(service, 'service', isPreview);
  const subtitle = service.category || 'Auto Styling & Detailing';

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card-custom item-card ${isPreview ? 'card-custom-preview' : ''}">
        ${imageHTML}
        <div class="card-body item-card-info">
          <h5 class="card-title item-card-title" title="${service.name || ''}">${formattedTitle}</h5>
          <div class="item-card-subtitle">${subtitle}</div>
          <div class="card-price item-card-price">
            <span class="item-price-current">${formatPrice(service.price)}</span>
          </div>
        </div>
        <div class="card-footer-custom item-card-actions">
          <button class="btn btn-primary-custom btn-card-action w-100" onclick="openServiceDetail(${service.id})">
            View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

window.selectServiceForBooking = function (serviceId, servicePrice) {
  sessionStorage.setItem('selectedServiceId', serviceId);
  sessionStorage.setItem('selectedServicePrice', servicePrice);

  const bookingSelect = document.getElementById('bookingService');
  if (bookingSelect) {
    bookingSelect.value = serviceId;
    const priceDisplay = document.getElementById('bookingPrice');
    if (priceDisplay) {
      priceDisplay.textContent = formatPrice(servicePrice);
    }
  }
};

function renderProductCard(product, isPreview) {
  const formattedTitle = formatCardTitle(product.name);
  const inStock = product.is_available && product.stock_quantity > 0;
  const stockText = inStock ? 'In Stock' : 'Out of Stock';
  const stockClass = inStock ? 'in-stock' : 'out-of-stock';

  // Normalize category name for subtitle
  let catName = product.category;
  if (catName === '1') catName = 'Spare Parts';
  else if (catName === '2') catName = 'Electrical';
  else if (catName === '3') catName = 'Service Parts';
  else if (catName === '4') catName = 'Lubricants';
  else if (!catName || /^\d+$/.test(catName)) catName = 'Auto Parts';

  // Discount handling
  const hasDiscount = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const discountVal = Math.round(product.discount_percentage);

  // Micro badges overlaying the image
  let badges = [];
  if (hasDiscount) {
    badges.push(`<span class="item-badge item-badge-discount">-${discountVal}%</span>`);
  }
  if (product.is_featured || (hasDiscount && discountVal >= 20)) {
    badges.push(`<span class="item-badge item-badge-hot">HOT</span>`);
  }

  const badgesHtml = badges.length > 0 ? `<div class="item-card-badges">${badges.join('')}</div>` : '';
  const stockBadgeHtml = `<span class="item-badge-stock ${stockClass}">${stockText}</span>`;
  const extraOverlayHtml = `${badgesHtml}${stockBadgeHtml}`;

  const imageHTML = generateImageSliderHTML(product, 'product', isPreview, extraOverlayHtml);

  const priceHtml = hasDiscount
    ? `<span class="item-price-old price-original">${formatPrice(product.price)}</span>
       <span class="item-price-current item-price-discounted price-discounted">${formatPrice(product.discounted_price)}</span>`
    : `<span class="item-price-current card-price mb-0">${formatPrice(product.price)}</span>`;

  const safeName = (product.name || '').replace(/'/g, "\\'");
  const effectivePrice = hasDiscount ? product.discounted_price : product.price;

  const quickAddBtn = inStock
    ? `<button class="btn btn-card-cart"
               onclick="event.stopPropagation(); CartManager.add({id: ${product.id}, name: '${safeName}', price: ${effectivePrice}, image: '${product.image || ''}', stock: ${product.stock_quantity}}, this)"
               title="Quick Add to Cart">
         <span class="material-icons">add_shopping_cart</span>
       </button>`
    : '';

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card-custom item-card ${isPreview ? 'card-custom-preview' : ''}">
        ${imageHTML}
        <div class="card-body item-card-info">
          <h5 class="card-title item-card-title" title="${product.name || ''}">${formattedTitle}</h5>
          <div class="item-card-subtitle">${catName}</div>
          <div class="card-price item-card-price">${priceHtml}</div>
        </div>
        <div class="card-footer-custom item-card-actions">
          <div class="d-flex gap-1">
            <button class="btn btn-primary-custom btn-card-action flex-grow-1" onclick="openProductDetail(${product.id})">
              View Details
            </button>
            ${quickAddBtn}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function fetchGallery(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = apiCache.get('gallery');
    if (cached) return cached;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/gallery/`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Failed to fetch gallery');
    const data = await response.json();
    apiCache.set('gallery', data);
    return data;
  } catch (error) {
    console.warn('Error fetching gallery:', error);
    return apiCache.get('gallery') || null;
  }
}

// Gallery state for "See More" pagination on about page
let allGalleryItems = [];
let galleryShowCount = 0;
const GALLERY_PAGE_SIZE = 8;

function renderGalleryItem(item) {
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="gallery-preview-item">
        <img src="${getImageUrl(item.image)}" alt="${item.title || 'Gallery Item'}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Work'">
        <div class="gallery-overlay"><span>${item.category || item.title || 'Our Work'}</span></div>
      </div>
    </div>
  `;
}

function showMoreGallery() {
  const container = document.getElementById('galleryContainer');
  const btn = document.getElementById('galleryShowMoreBtn');
  if (!container || !allGalleryItems.length) return;

  const nextItems = allGalleryItems.slice(galleryShowCount, galleryShowCount + GALLERY_PAGE_SIZE);
  container.insertAdjacentHTML('beforeend', nextItems.map(renderGalleryItem).join(''));
  galleryShowCount += nextItems.length;

  // Hide button when all items are shown
  if (btn && galleryShowCount >= allGalleryItems.length) {
    btn.style.display = 'none';
  }
}

async function loadGallery() {
  const container = document.getElementById('galleryContainer');
  if (!container) return;

  const galleryItems = await fetchGallery();

  if (galleryItems && galleryItems.length > 0) {
    const shuffled = [...galleryItems].sort(() => Math.random() - 0.5);

    // Set hero background from a random gallery photo
    const heroImg = getImageUrl(shuffled[0].image);
    document.documentElement.style.setProperty('--hero-bg', `url('${heroImg}')`);

    // Set about-preview carousel from gallery photos
    const aboutCarouselInner = document.getElementById('aboutPreviewCarouselInner');
    if (aboutCarouselInner && shuffled.length > 0) {
      // Use up to 5 images for the carousel
      const carouselImages = shuffled.slice(0, 5);
      aboutCarouselInner.innerHTML = carouselImages.map((item, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}" style="height: 100%;">
          <img src="${getImageUrl(item.image)}" class="d-block w-100" alt="About VIN-KJ AUTO SERVICES" style="background: var(--bg-card); height: 100%; object-fit: cover;">
        </div>
      `).join('');
    } else {
      const aboutImg = document.getElementById('aboutPreviewImg');
      if (aboutImg) {
        const aboutSrc = shuffled.length > 1 ? shuffled[1].image : shuffled[0].image;
        aboutImg.src = getImageUrl(aboutSrc);
      }
    }

    // Detect page: about page has #gallery section, index has #gallery-preview
    const isAboutPage = !!document.getElementById('gallery');

    if (isAboutPage) {
      // About page: show first 8, "See More" reveals next batch
      allGalleryItems = shuffled;
      galleryShowCount = 0;
      container.innerHTML = '';
      const initialItems = allGalleryItems.slice(0, GALLERY_PAGE_SIZE);
      container.innerHTML = initialItems.map(renderGalleryItem).join('');
      galleryShowCount = initialItems.length;

      // Show or hide the "See More" button
      const btn = document.getElementById('galleryShowMoreBtn');
      if (btn) {
        btn.style.display = galleryShowCount < allGalleryItems.length ? '' : 'none';
      }
    } else {
      // Index page: show only 4 shuffled images
      container.innerHTML = shuffled.slice(0, 4).map(renderGalleryItem).join('');
    }
  } else {
    container.innerHTML = '<p class="text-center opacity-50 w-100">Gallery coming soon — check back later!</p>';
  }
}

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', async () => {
  CartManager.updateUI();

  // Load dynamic gallery if available
  loadGallery().catch(err => console.error('Gallery loading failed:', err));

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('checkout') === '1') {
    // Only open if the modal exists on this page
    if (document.getElementById('orderModal')) {
      setTimeout(() => openCheckoutModal(), 300);
    }
  }

  // The checkoutBtn click listener has been moved to the document level to handle dynamic button generation.

  // Containers for Products and Services
  const productsContainer = document.getElementById('productsContainer');
  const productsPreview = document.getElementById('productsPreviewContainer');
  const noProducts = document.getElementById('noProductsFound');

  const servicesContainer = document.getElementById('servicesContainer');
  const servicesPreview = document.getElementById('servicesPreviewContainer');
  const noServices = document.getElementById('noServicesFound');
  const bookingServiceSelect = document.getElementById('bookingService');
  const unifiedSearchInput = document.getElementById('unifiedSearchInput');

  // Parallel fetch: Load products and services concurrently for fastest page speed
  const needsProducts = !!(productsContainer || productsPreview || unifiedSearchInput);
  const needsServices = !!(servicesContainer || servicesPreview || bookingServiceSelect || unifiedSearchInput);

  const [products, services] = await Promise.all([
    needsProducts ? fetchProducts() : Promise.resolve(null),
    needsServices ? fetchServices() : Promise.resolve(null)
  ]);

  // Handle Products
  if (needsProducts) {
    if (productsContainer) productsContainer.innerHTML = '';
    if (productsPreview) productsPreview.innerHTML = '';

    if (products && products.length > 0) {
      allProducts = products;
      if (productsContainer) {
        filterAndRenderProducts();
      }
      if (productsPreview) {
        productsPreview.innerHTML = products.filter(p => p.is_available).slice(0, 4).map(p => renderProductCard(p, true)).join('');
      }
      if (noProducts) noProducts.classList.add('d-none');
    } else {
      if (noProducts) noProducts.classList.remove('d-none');
      if (productsPreview) productsPreview.innerHTML = '<p class="text-center opacity-50">New products coming soon!</p>';
    }

    const searchInput = document.getElementById('productSearch');
    const filterSelect = document.getElementById('productFilter');
    const searchClear = document.getElementById('productSearchClear');
    const searchBtn = document.getElementById('productSearchBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (searchClear) searchClear.classList.toggle('d-none', !searchInput.value.trim());
        filterAndRenderProducts();
      });
      if (searchClear) {
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          searchClear.classList.add('d-none');
          filterAndRenderProducts();
          searchInput.focus();
        });
      }
      if (searchBtn) {
        searchBtn.addEventListener('click', filterAndRenderProducts);
      }
    }
    if (filterSelect) filterSelect.addEventListener('change', filterAndRenderProducts);

    // Popular tags on products page
    const productTags = document.querySelectorAll('#productsContainer ~ * .popular-tag-btn, .search-filter-wrapper .popular-tag-btn');
    if (searchInput) {
      document.querySelectorAll('.popular-tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (document.getElementById('productsContainer')) {
            searchInput.value = btn.dataset.query || btn.textContent.trim();
            if (searchClear) searchClear.classList.remove('d-none');
            filterAndRenderProducts();
          }
        });
      });
    }

    const productSearchParam = urlParams.get('search');
    if (productSearchParam && searchInput) {
      searchInput.value = productSearchParam;
      if (searchClear) searchClear.classList.remove('d-none');
      filterAndRenderProducts();
    }

    if (urlParams.get('product') && document.getElementById('productDetailModal')) {
      const pId = parseInt(urlParams.get('product'), 10);
      setTimeout(() => openProductDetail(pId), 100);
    }
  }

  // Handle Services
  if (needsServices) {
    if (servicesContainer) servicesContainer.innerHTML = '';
    if (servicesPreview) servicesPreview.innerHTML = '';

    if (services && services.length > 0) {
      allServices = services;
      if (servicesContainer) {
        filterAndRenderServices();
      }
      if (servicesPreview) {
        servicesPreview.innerHTML = services.slice(0, 4).map(s => renderServiceCard(s, true)).join('');
      }
      if (noServices) noServices.classList.add('d-none');
    } else {
      if (noServices) noServices.classList.remove('d-none');
      if (servicesPreview) servicesPreview.innerHTML = '<p class="text-center opacity-50">Our services are being updated. Check back soon!</p>';
    }

    // Wire up Services search and sorting
    const serviceSearchInput = document.getElementById('serviceSearch');
    const serviceSortSelect = document.getElementById('serviceSort');
    const serviceSearchClear = document.getElementById('serviceSearchClear');
    const serviceSearchBtn = document.getElementById('serviceSearchBtn');

    if (serviceSearchInput) {
      serviceSearchInput.addEventListener('input', () => {
        if (serviceSearchClear) serviceSearchClear.classList.toggle('d-none', !serviceSearchInput.value.trim());
        filterAndRenderServices();
      });
      if (serviceSearchClear) {
        serviceSearchClear.addEventListener('click', () => {
          serviceSearchInput.value = '';
          serviceSearchClear.classList.add('d-none');
          filterAndRenderServices();
          serviceSearchInput.focus();
        });
      }
      if (serviceSearchBtn) {
        serviceSearchBtn.addEventListener('click', filterAndRenderServices);
      }
      // Popular tags on services page
      document.querySelectorAll('.popular-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (document.getElementById('servicesContainer')) {
            serviceSearchInput.value = btn.dataset.query || btn.textContent.trim();
            if (serviceSearchClear) serviceSearchClear.classList.remove('d-none');
            filterAndRenderServices();
          }
        });
      });
    }
    if (serviceSortSelect) serviceSortSelect.addEventListener('change', filterAndRenderServices);

    const serviceSearchParam = urlParams.get('search');
    if (serviceSearchParam && serviceSearchInput) {
      serviceSearchInput.value = serviceSearchParam;
      if (serviceSearchClear) serviceSearchClear.classList.remove('d-none');
      filterAndRenderServices();
    }

    if (urlParams.get('service') && document.getElementById('serviceDetailModal')) {
      const sId = parseInt(urlParams.get('service'), 10);
      setTimeout(() => openServiceDetail(sId), 100);
    }

    // Top Unified Search Bar initialization (Index page)
    if (unifiedSearchInput) {
      initUnifiedSearchBar();
    }

    // Booking form setup (using the already fetched services, NO extra network request)
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
      const today = new Date().toISOString().split('T')[0];
      bookingDateInput.setAttribute('min', today);
    }

    if (bookingServiceSelect) {
      const availableServices = (services && services.length > 0) ? services : allServices;
      if (availableServices && availableServices.length > 0) {
        bookingServiceSelect.innerHTML = '<option value="" disabled selected>-- Select a Service --</option>' +
          availableServices.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} - ${formatPrice(s.price)}</option>`).join('');
      } else {
        bookingServiceSelect.innerHTML = '<option value="" disabled selected>No services available currently</option>';
      }

      const savedId = sessionStorage.getItem('selectedServiceId');
      if (savedId) {
        bookingServiceSelect.value = savedId;
        const savedPrice = sessionStorage.getItem('selectedServicePrice');
        if (savedPrice) document.getElementById('bookingPrice').textContent = formatPrice(savedPrice);
        sessionStorage.removeItem('selectedServiceId');
        sessionStorage.removeItem('selectedServicePrice');
      }

      bookingServiceSelect.addEventListener('change', function () {
        const selected = this.options[this.selectedIndex];
        if (selected && selected.dataset.price) {
          document.getElementById('bookingPrice').textContent = formatPrice(selected.dataset.price);
        }
      });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = document.getElementById('bookingSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        try {
          const price = bookingServiceSelect.options[bookingServiceSelect.selectedIndex].dataset.price;
          const bookingData = {
            services: bookingServiceSelect.value,
            total_price: parseFloat(price),
            full_name: document.getElementById('bookingName').value,
            email: document.getElementById('bookingEmail').value,
            phone_number: document.getElementById('bookingPhone').value,
            vehicle_model: document.getElementById('bookingVehicle').value,
            number_plate: document.getElementById('bookingPlate').value,
            booking_date: document.getElementById('bookingDate').value,
            booking_time: document.getElementById('bookingTime').value,
            additional_notes: document.getElementById('bookingNotes').value
          };
          const response = await createBooking(bookingData);
          generateReceipt('booking', bookingData, response);
          showAlert('bookingSuccess', 'Booking submitted!', 8000);
          bookingForm.reset();
        } catch (err) {
          showAlert('bookingError', err.message, 6000);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Booking';
        }
      });
    }
  }

  initializeAutoCarousels();
});

// ---- Intelligent Matcher with Automotive Synonyms ----
function itemMatchesQuery(item, term) {
  if (!item || !term) return false;
  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const fullText = `${name} ${desc} ${cat}`;

  if (fullText.includes(term)) return true;

  // Multi-word search (e.g., "Brake Pads", "Spark Plugs", "LED Headlights")
  const words = term.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    if (words.every(w => fullText.includes(w))) return true;

    // Automotive domain synonyms
    if (term.includes('brake') || term.includes('pad')) {
      if (fullText.includes('pad') || fullText.includes('brake') || fullText.includes('lining')) return true;
    }
    if (term.includes('spark') || term.includes('plug')) {
      if (fullText.includes('plug') || fullText.includes('spark')) return true;
    }
    if (term.includes('headlight') || term.includes('light')) {
      if (fullText.includes('headlight') || fullText.includes('led')) return true;
    }
  }

  // Singular / plural / stemming checks
  if ((term === 'filter' || term === 'filters') && fullText.includes('filter')) return true;
  if ((term === 'bush' || term === 'bushes') && (fullText.includes('bush') || fullText.includes('bushes'))) return true;
  if (term === 'tint' && fullText.includes('tint')) return true;
  if (term === 'ppf' && (fullText.includes('ppf') || fullText.includes('protection film'))) return true;
  if ((term === 'wrap' || term === 'wrapping') && (fullText.includes('wrap') || fullText.includes('wrapping'))) return true;
  if (term === 'wd-40' && fullText.includes('wd-40')) return true;

  return false;
}

// ---- Services Search & Filter ----
function filterAndRenderServices() {
  const container = document.getElementById('servicesContainer');
  const noServices = document.getElementById('noServicesFound');
  if (!container) return;

  const searchTerm = (document.getElementById('serviceSearch')?.value || '').toLowerCase().trim();
  const sortValue = document.getElementById('serviceSort')?.value || 'all';

  let filtered = [...allServices];

  // Text search (name + description + synonyms)
  if (searchTerm) {
    filtered = filtered.filter(s => itemMatchesQuery(s, searchTerm));
  }

  // Sorting
  if (sortValue === 'price-asc') {
    filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
  } else if (sortValue === 'price-desc') {
    filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
  } else if (sortValue === 'name-asc') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  if (filtered.length > 0) {
    container.innerHTML = filtered.map(s => renderServiceCard(s, false)).join('');
    if (noServices) noServices.classList.add('d-none');
    initializeAutoCarousels();
  } else {
    container.innerHTML = '';
    if (noServices) {
      noServices.classList.remove('d-none');
      const h5 = noServices.querySelector('h5');
      if (h5) h5.textContent = searchTerm ? 'No matching services found' : 'No services listed yet';
      const p = noServices.querySelector('p');
      if (p) p.textContent = searchTerm ? 'Try adjusting your search terms' : 'Check back soon';
    }
  }
}

// ---- Product Search & Filter ----
function filterAndRenderProducts() {
  const container = document.getElementById('productsContainer');
  const noProducts = document.getElementById('noProductsFound');
  if (!container) return;

  const searchTerm = (document.getElementById('productSearch')?.value || '').toLowerCase().trim();
  const filterValue = document.getElementById('productFilter')?.value || 'all';

  let filtered = allProducts;

  // Category filter
  if (filterValue === 'in-stock') {
    filtered = filtered.filter(p => p.is_available && p.stock_quantity > 0);
  } else if (filterValue !== 'all') {
    // Normalizing DB values logic since backend might be returning numbers as strings.
    let catFilter = filterValue;
    if (filterValue === 'Spare parts') catFilter = '1';
    else if (filterValue === 'Electrical') catFilter = '2';
    else if (filterValue === 'Service parts') catFilter = '3';
    else if (filterValue === 'Lubricants') catFilter = '4';
    filtered = filtered.filter(p => p.category === filterValue || p.category === catFilter);
  }

  // Text search (name + description + synonyms)
  if (searchTerm) {
    filtered = filtered.filter(p => itemMatchesQuery(p, searchTerm));
  }

  if (filtered.length > 0) {
    // Group products by their normalized category string
    const grouped = {};
    filtered.forEach(p => {
      let cName = p.category;
      if (cName === '1') cName = 'Spare parts';
      else if (cName === '2') cName = 'Electrical';
      else if (cName === '3') cName = 'Service parts';
      else if (cName === '4') cName = 'Lubricants';
      else if (!cName || /^\d+$/.test(cName)) cName = 'Other';
      
      if (!grouped[cName]) grouped[cName] = [];
      grouped[cName].push(p);
    });

    let html = '';
    // Sort categories, maybe 'Other' at the end
    const categories = Object.keys(grouped).sort();
    categories.forEach(cat => {
      html += `<div class="col-12 mt-4 mb-2"><h3 class="border-bottom pb-2" style="color: #e8a825;">${cat}</h3></div>`;
      html += grouped[cat].map(p => renderProductCard(p, false)).join('');
    });

    container.innerHTML = html;
    if (noProducts) noProducts.classList.add('d-none');
    
    // Initialize carousels after injecting new DOM nodes
    initializeAutoCarousels();
  } else {
    container.innerHTML = '';
    if (noProducts) noProducts.classList.remove('d-none');
  }
}

// ---- Top Unified Search Bar (Services & Products) ----
function initUnifiedSearchBar() {
  const searchInput = document.getElementById('unifiedSearchInput');
  const clearBtn = document.getElementById('unifiedSearchClear');
  const searchBtn = document.getElementById('unifiedSearchBtn');
  const resultsDropdown = document.getElementById('unifiedSearchResults');
  const scopeTabs = document.querySelectorAll('.scope-tab');
  const popularTags = document.querySelectorAll('.popular-tag-btn');
  const servicesPreview = document.getElementById('servicesPreviewContainer');
  const productsPreview = document.getElementById('productsPreviewContainer');
  const feedbackSection = document.getElementById('searchFeedbackSection');
  const feedbackGrid = document.getElementById('searchFeedbackGrid');
  const feedbackTitle = document.getElementById('searchFeedbackTitle');
  const feedbackSubtitle = document.getElementById('searchFeedbackSubtitle');
  const clearFeedbackBtn = document.getElementById('clearSearchFeedbackBtn');

  if (!searchInput) return;

  let currentScope = 'all';
  let activeHighlightedIndex = -1;
  const initialServicesHTML = servicesPreview ? servicesPreview.innerHTML : '';
  const initialProductsHTML = productsPreview ? productsPreview.innerHTML : '';

  // Clean HTML escaping
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Update placeholder based on active scope
  function updatePlaceholder() {
    if (currentScope === 'services') {
      searchInput.placeholder = 'Search services (e.g. Window Tinting, PPF, Wrapping)...';
    } else if (currentScope === 'products') {
      searchInput.placeholder = 'Search products (e.g. Films, Spare Parts, Lubricants)...';
    } else {
      searchInput.placeholder = 'Search services or products by name or description...';
    }
  }

  // Render on-page instant feedback section directly below search bar
  function renderSearchFeedback(rawTerm, matchServices, matchProducts, shouldScroll = true) {
    if (!feedbackSection || !feedbackGrid) return;

    if (!rawTerm) {
      feedbackSection.classList.add('d-none');
      feedbackGrid.innerHTML = '';
      return;
    }

    const totalMatches = matchServices.length + matchProducts.length;

    if (totalMatches === 0) {
      if (feedbackTitle) feedbackTitle.innerHTML = `No matches found for "<strong>${escapeHtml(rawTerm)}</strong>"`;
      if (feedbackSubtitle) feedbackSubtitle.textContent = 'Try checking your spelling or search using another keyword (e.g. Tint, Wrapping, PPF, Brake Pads).';
      feedbackGrid.innerHTML = `
        <div class="col-12 text-center py-4">
          <div class="p-4 rounded-3 border bg-light-custom text-center mx-auto" style="max-width: 500px;">
            <span class="material-icons mb-2 text-secondary-custom" style="font-size: 2.5rem;">search_off</span>
            <h5 class="fw-bold mb-2">No items matched "${escapeHtml(rawTerm)}"</h5>
            <p class="text-muted small mb-3">Explore our automotive services or spare parts catalogue directly:</p>
            <div class="d-flex justify-content-center gap-2">
              <a href="services.html" class="btn btn-sm btn-outline-custom">Browse Services</a>
              <a href="products.html" class="btn btn-sm btn-primary-custom">Browse Products</a>
            </div>
          </div>
        </div>
      `;
    } else {
      if (feedbackTitle) feedbackTitle.innerHTML = `Search Results for "<strong>${escapeHtml(rawTerm)}</strong>"`;
      const parts = [];
      if (matchProducts.length > 0) parts.push(`${matchProducts.length} ${matchProducts.length === 1 ? 'product' : 'products'}`);
      if (matchServices.length > 0) parts.push(`${matchServices.length} ${matchServices.length === 1 ? 'service' : 'services'}`);
      if (feedbackSubtitle) feedbackSubtitle.textContent = `Found ${totalMatches} matching ${totalMatches === 1 ? 'item' : 'items'} (${parts.join(', ')})`;

      let cardsHtml = '';
      if (matchProducts.length > 0) {
        cardsHtml += matchProducts.map(p => renderProductCard(p, true)).join('');
      }
      if (matchServices.length > 0) {
        cardsHtml += matchServices.map(s => renderServiceCard(s, true)).join('');
      }
      feedbackGrid.innerHTML = cardsHtml;
      initializeAutoCarousels();
    }

    feedbackSection.classList.remove('d-none');
    if (shouldScroll) {
      feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Clear all search state
  function clearAllSearch() {
    searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('d-none');
    if (resultsDropdown) {
      resultsDropdown.classList.add('d-none');
      resultsDropdown.innerHTML = '';
    }
    if (feedbackSection) {
      feedbackSection.classList.add('d-none');
      feedbackGrid.innerHTML = '';
    }
    if (servicesPreview && initialServicesHTML) {
      servicesPreview.innerHTML = initialServicesHTML;
    }
    if (productsPreview && initialProductsHTML) {
      productsPreview.innerHTML = initialProductsHTML;
    }
    initializeAutoCarousels();
    searchInput.focus();
  }

  // Perform search and update UI
  function performSearch(filterPreviews = false) {
    const rawTerm = searchInput.value.trim();
    const term = rawTerm.toLowerCase();

    // Toggle clear button
    if (clearBtn) {
      clearBtn.classList.toggle('d-none', rawTerm.length === 0);
    }

    if (!term) {
      if (resultsDropdown) {
        resultsDropdown.classList.add('d-none');
        resultsDropdown.innerHTML = '';
      }
      if (feedbackSection) {
        feedbackSection.classList.add('d-none');
        feedbackGrid.innerHTML = '';
      }
      activeHighlightedIndex = -1;
      // Reset previews if they were filtered
      if (filterPreviews) {
        if (servicesPreview && initialServicesHTML) {
          servicesPreview.innerHTML = initialServicesHTML;
        }
        if (productsPreview && initialProductsHTML) {
          productsPreview.innerHTML = initialProductsHTML;
        }
        initializeAutoCarousels();
      }
      return;
    }

    // Filter matching Services
    const matchServices = (currentScope === 'all' || currentScope === 'services')
      ? allServices.filter(s => itemMatchesQuery(s, term))
      : [];

    // Filter matching Products
    const matchProducts = (currentScope === 'all' || currentScope === 'products')
      ? allProducts.filter(p => itemMatchesQuery(p, term))
      : [];

    activeHighlightedIndex = -1;

    // If feedbackSection is currently visible, update it live as user edits query
    if (feedbackSection && !feedbackSection.classList.contains('d-none')) {
      renderSearchFeedback(rawTerm, matchServices, matchProducts, false);
    }

    // Render results dropdown
    if (resultsDropdown) {
      if (matchServices.length === 0 && matchProducts.length === 0) {
        resultsDropdown.innerHTML = `
          <div class="search-empty-state">
            No matches found for "<strong>${escapeHtml(rawTerm)}</strong>".
          </div>
          <div class="search-dropdown-footer">
            <a href="services.html">Browse All Services &rarr;</a>
            <a href="products.html">Browse All Products &rarr;</a>
          </div>
        `;
      } else {
        let html = '';

        // Services section
        if (matchServices.length > 0) {
          html += `
            <div class="search-results-group">
              <div class="search-group-header">
                <span>Services</span>
                <span class="group-count">${matchServices.length} found</span>
              </div>
          `;
          matchServices.slice(0, 4).forEach(s => {
            html += `
              <a href="services.html?service=${s.id}" class="search-result-item" data-type="service" data-id="${s.id}">
                <div class="result-info">
                  <div class="result-title">${formatCardTitle(s.name)}</div>
                  <div class="result-sub">${truncateText(s.description || 'Professional auto service in Nairobi', 70)}</div>
                </div>
                <div class="result-meta">
                  <div class="result-price">${formatPrice(s.price)}</div>
                  <span class="result-badge badge-service">Service</span>
                </div>
              </a>
            `;
          });
          if (matchServices.length > 4) {
            html += `
              <div class="search-more-link">
                <a href="services.html?search=${encodeURIComponent(rawTerm)}">See all ${matchServices.length} matching services &rarr;</a>
              </div>
            `;
          }
          html += `</div>`;
        }

        // Products section
        if (matchProducts.length > 0) {
          html += `
            <div class="search-results-group">
              <div class="search-group-header">
                <span>Products</span>
                <span class="group-count">${matchProducts.length} found</span>
              </div>
          `;
          matchProducts.slice(0, 4).forEach(p => {
            const inStock = p.is_available && p.stock_quantity > 0;
            const effectivePrice = p.discount_percentage ? p.discounted_price : p.price;
            let catName = p.category;
            if (catName === '1') catName = 'Spare Parts';
            else if (catName === '2') catName = 'Electrical';
            else if (catName === '3') catName = 'Service Parts';
            else if (catName === '4') catName = 'Lubricants';
            else if (!catName || /^\d+$/.test(catName)) catName = 'Auto Product';

            html += `
              <a href="products.html?product=${p.id}" class="search-result-item" data-type="product" data-id="${p.id}">
                <div class="result-info">
                  <div class="result-title">${formatCardTitle(p.name)}</div>
                  <div class="result-sub">${catName}</div>
                </div>
                <div class="result-meta">
                  <div class="result-price">${formatPrice(effectivePrice)}</div>
                  <span class="result-badge ${inStock ? 'badge-stock' : 'badge-out'}">${inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
              </a>
            `;
          });
          if (matchProducts.length > 4) {
            html += `
              <div class="search-more-link">
                <a href="products.html?search=${encodeURIComponent(rawTerm)}">See all ${matchProducts.length} matching products &rarr;</a>
              </div>
            `;
          }
          html += `</div>`;
        }

        // Footer links
        html += `
          <div class="search-dropdown-footer">
            <a href="services.html?search=${encodeURIComponent(rawTerm)}">All Services (${matchServices.length})</a>
            <a href="products.html?search=${encodeURIComponent(rawTerm)}">All Products (${matchProducts.length})</a>
          </div>
        `;

        resultsDropdown.innerHTML = html;
      }
      resultsDropdown.classList.remove('d-none');
    }
  }

  // Event Listeners
  searchInput.addEventListener('input', () => performSearch(false));

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0) {
      performSearch(false);
    }
  });

  // Scope Tabs
  scopeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      scopeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentScope = tab.dataset.scope || 'all';
      updatePlaceholder();
      if (searchInput.value.trim().length > 0) {
        performSearch(false);
      }
    });
  });

  // Clear Buttons
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllSearch);
  }
  if (clearFeedbackBtn) {
    clearFeedbackBtn.addEventListener('click', clearAllSearch);
  }

  // Submit / Search Action
  function executeSearchAction() {
    const rawTerm = searchInput.value.trim();
    if (!rawTerm) return;

    const term = rawTerm.toLowerCase();
    const matchServices = (currentScope === 'all' || currentScope === 'services')
      ? allServices.filter(s => itemMatchesQuery(s, term))
      : [];
    const matchProducts = (currentScope === 'all' || currentScope === 'products')
      ? allProducts.filter(p => itemMatchesQuery(p, term))
      : [];

    if (resultsDropdown) {
      resultsDropdown.classList.add('d-none');
    }

    renderSearchFeedback(rawTerm, matchServices, matchProducts, true);
  }

  // Popular Quick Search Tags
  popularTags.forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.query || btn.textContent.trim();
      searchInput.value = q;
      if (clearBtn) clearBtn.classList.remove('d-none');
      executeSearchAction();
    });
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', executeSearchAction);
  }

  // Keyboard navigation inside dropdown
  searchInput.addEventListener('keydown', (e) => {
    if (!resultsDropdown || resultsDropdown.classList.contains('d-none')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearchAction();
      }
      return;
    }

    const items = resultsDropdown.querySelectorAll('.search-result-item');
    if (!items.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearchAction();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeHighlightedIndex = (activeHighlightedIndex + 1) % items.length;
      items.forEach((it, idx) => it.classList.toggle('highlighted', idx === activeHighlightedIndex));
      items[activeHighlightedIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeHighlightedIndex = (activeHighlightedIndex - 1 + items.length) % items.length;
      items.forEach((it, idx) => it.classList.toggle('highlighted', idx === activeHighlightedIndex));
      items[activeHighlightedIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeHighlightedIndex >= 0 && items[activeHighlightedIndex]) {
        items[activeHighlightedIndex].click();
      } else {
        executeSearchAction();
      }
    } else if (e.key === 'Escape') {
      resultsDropdown.classList.add('d-none');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const searchBox = document.querySelector('.search-input-box');
    if (searchBox && !searchBox.contains(e.target)) {
      if (resultsDropdown) resultsDropdown.classList.add('d-none');
    }
  });
}

// ---- Product Detail Modal ----
window.openProductDetail = function(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  let modalEl = document.getElementById('productDetailModal');
  if (!modalEl) { window.location.href = `products.html?product=${productId}`; return; }

  // Populate carousel
  const carouselInner = document.getElementById('productCarouselInner');
  const indicators = document.getElementById('productCarouselIndicators');
  const allImages = [];
  if (product.image) allImages.push({ url: product.image });
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => allImages.push({ url: img.image, car_models: img.car_models }));
  }
  if (allImages.length === 0) allImages.push({ url: null });

  carouselInner.innerHTML = allImages.map((img, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}">
      <img src="${getImageUrl(img.url)}" class="d-block w-100" alt="${product.name}" onerror="this.src='https://via.placeholder.com/800x400?text=Product'">
    </div>
  `).join('');
  indicators.innerHTML = allImages.length > 1 ? allImages.map((_, i) => `
    <button type="button" data-bs-target="#productDetailCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active"' : ''} aria-label="Slide ${i+1}"></button>
  `).join('') : '';

  let pCat = product.category;
  if (pCat === '1') pCat = 'Spare parts';
  if (pCat === '2') pCat = 'Electrical';
  if (pCat === '3') pCat = 'Service parts';
  if (pCat === '4') pCat = 'Lubricants';

  document.getElementById('productDetailName').textContent = formatCardTitle(product.name) || 'Product';
  document.getElementById('productDetailCategory').innerHTML = (pCat && !/^\d+$/.test(pCat)) ? `<span class="category-tag">${pCat.toUpperCase()}</span>` : '';
  document.getElementById('productDetailDescription').textContent = product.description || '';

  // Price with discount
  const hasDiscount = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const priceEl = document.getElementById('productDetailPrice');
  priceEl.innerHTML = hasDiscount
    ? `<span class="price-original">${formatPrice(product.price)}</span><span class="price-discounted">${formatPrice(product.discounted_price)}</span><span class="discount-badge" style="position:static;">${Math.round(product.discount_percentage)}% OFF</span>`
    : `<span class="card-price mb-0">${formatPrice(product.price)}</span>`;

  // Car models from sub-images
  const metaEl = document.getElementById('productDetailMeta');
  const carModels = new Set();
  if (product.images) product.images.forEach(img => { if (img.car_models) img.car_models.split(',').map(m => m.trim()).filter(Boolean).forEach(m => carModels.add(m)); });
  metaEl.innerHTML = carModels.size > 0 ? Array.from(carModels).map(m => `<span class="car-model-chip"><span class="material-icons">directions_car</span>${m}</span>`).join('') : '';

  // Stock
  const inStock = product.is_available && product.stock_quantity > 0;
  document.getElementById('productDetailStock').innerHTML = inStock ? `<span class="card-stock in-stock">In Stock (${product.stock_quantity})</span>` : `<span class="card-stock out-of-stock">Out of Stock</span>`;

  // Add to cart
  const addCartBtn = document.getElementById('productDetailAddCart');
  const effectivePrice = hasDiscount ? product.discounted_price : product.price;
  const firstImage = (product.images && product.images.length > 0) ? product.images[0].image : product.image;
  addCartBtn.disabled = !inStock;
  addCartBtn.onclick = inStock ? function() { CartManager.add({ id: product.id, name: product.name, price: parseFloat(effectivePrice), image: firstImage, stock: product.stock_quantity }, addCartBtn); } : null;

  new bootstrap.Modal(modalEl).show();
};

// ---- Service Detail Modal ----
window.openServiceDetail = function(serviceId) {
  const service = allServices.find(s => s.id === serviceId);
  if (!service) return;

  let modalEl = document.getElementById('serviceDetailModal');
  if (!modalEl) { window.location.href = `services.html?service=${serviceId}`; return; }

  const carouselInner = document.getElementById('serviceCarouselInner');
  const indicators = document.getElementById('serviceCarouselIndicators');
  const allImages = (service.images && service.images.length > 0) ? service.images : [{ image: service.image || null, image_type: 'general' }];

  carouselInner.innerHTML = allImages.map((img, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}" style="position:relative;">
      <img src="${getImageUrl(img.image)}" class="d-block w-100" alt="${service.name}" onerror="this.src='https://via.placeholder.com/800x400?text=Service'">
      ${img.image_type && img.image_type !== 'general' ? `<span class="image-type-tag ${img.image_type}">${img.image_type}</span>` : ''}
    </div>
  `).join('');
  indicators.innerHTML = allImages.length > 1 ? allImages.map((_, i) => `
    <button type="button" data-bs-target="#serviceDetailCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active"' : ''} aria-label="Slide ${i+1}"></button>
  `).join('') : '';

  document.getElementById('serviceDetailName').textContent = formatCardTitle(service.name) || 'Service';
  document.getElementById('serviceDetailPrice').innerHTML = `<span class="card-price mb-0">${formatPrice(service.price)}</span>`;

  // Full description with markdown support
  const descEl = document.getElementById('serviceDetailDescription');
  if (typeof marked !== 'undefined' && service.description) { descEl.innerHTML = marked.parse(service.description); }
  else { descEl.textContent = service.description || ''; }

  // Images grid with before/after tags
  const imagesGrid = document.getElementById('serviceImagesGrid');
  if (service.images && service.images.length > 1) {
    imagesGrid.innerHTML = `<h6 class="mt-3 mb-2" style="font-size:0.9rem; opacity:0.8;">Transformation Gallery</h6>
      <div class="service-images-grid">${service.images.map((img, i) => `
        <div class="service-image-thumb" onclick="document.querySelector('[data-bs-target=&quot;#serviceDetailCarousel&quot;][data-bs-slide-to=&quot;${i}&quot;]')?.click()">
          <img src="${getImageUrl(img.image)}" alt="${img.service_type || 'Image'}" onerror="this.src='https://via.placeholder.com/200x120?text=Image'">
          ${img.image_type ? `<span class="image-type-tag ${img.image_type}">${img.image_type}</span>` : ''}
        </div>`).join('')}
      </div>`;
  } else { imagesGrid.innerHTML = ''; }

  // Book button
  document.getElementById('serviceDetailBook').onclick = function() {
    bootstrap.Modal.getInstance(modalEl)?.hide();
    window.selectServiceForBooking(service.id, service.price);
    const bookingSection = document.getElementById('booking');
    if (bookingSection) { setTimeout(() => bookingSection.scrollIntoView({ behavior: 'smooth' }), 300); }
    else { window.location.href = 'services.html#booking'; }
  };

  new bootstrap.Modal(modalEl).show();
};

// ---- Checkout Modal logic ----
let selectedPaymentMethod = null;

function openCheckoutModal() {
  const modalEl = document.getElementById('orderModal');
  if (!modalEl) {
    window.location.href = 'products.html?checkout=1';
    return;
  }
  const itemsList = document.getElementById('checkoutItemsList');
  if (itemsList) {
    itemsList.innerHTML = CartManager.items.map(item => `
      <div class="d-flex justify-content-between align-items-center mb-2 small">
        <span>${item.name} x ${item.quantity}</span>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }
  document.getElementById('checkoutTotalDisplay').textContent = formatPrice(CartManager.getTotal());
  if (document.getElementById('stkPrompt')) document.getElementById('stkPrompt').classList.add('d-none');
  
  // Default to delivery since M-Pesa is disabled
  selectPayment('delivery');
  
  new bootstrap.Modal(modalEl).show();
}

/**
 * Global function for payment selection (called by onclick in HTML)
 */
window.selectPayment = function (method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-option').forEach(el => {
    el.classList.toggle('selected', el.id === (method === 'online' ? 'payOnlineOption' : 'payDeliveryOption'));
  });
  const onlineRadio = document.getElementById('payOnline');
  const deliveryRadio = document.getElementById('payDelivery');
  if (onlineRadio) onlineRadio.checked = (method === 'online');
  if (deliveryRadio) deliveryRadio.checked = (method === 'delivery');
};

document.addEventListener('click', async function (e) {
  if (e.target.id === 'checkoutBtn') {
    const offcanvasEl = document.getElementById('cartOffcanvas');
    if (offcanvasEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
      offcanvas.hide();
    }
    openCheckoutModal();
    return;
  }

  if (e.target.id === 'orderSubmitBtn') {
    const form = document.getElementById('orderForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!selectedPaymentMethod) { alert('Please select a payment method.'); return; }

    const submitBtn = e.target;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const orderData = {
      items: CartManager.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      total_price: CartManager.getTotal(),
      full_name: document.getElementById('orderName').value,
      email: document.getElementById('orderEmail').value,
      phone_number: document.getElementById('orderPhone').value,
      estate: document.getElementById('orderEstate').value,
      street_address: document.getElementById('orderStreet').value,
      vehicle_make: document.getElementById('orderVehicleMake') ? document.getElementById('orderVehicleMake').value : '',
      vehicle_model: document.getElementById('orderVehicleModel') ? document.getElementById('orderVehicleModel').value : '',
      vehicle_year: document.getElementById('orderVehicleYear') ? document.getElementById('orderVehicleYear').value : '',
      auto_part: `Cart Order (Multi-item)`,
      payment_method: selectedPaymentMethod === 'online' ? 'M-Pesa' : 'Delivery'
    };

    try {
      const order = await createOrder(orderData);
      if (selectedPaymentMethod === 'online') {
        const stkPrompt = document.getElementById('stkPrompt');
        if (stkPrompt) stkPrompt.classList.remove('d-none');

        // Initiate STK Push
        await fetch(`${API_BASE_URL}/payment/mpesa/initiate/${order.order_id}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: orderData.phone_number })
        });

        showAlert('orderSuccess', 'STK Push sent! Please enter your PIN on your phone (waiting up to 90s)...', 10000);

        // Polling logic: check order status every 5 seconds for a max of 90 seconds (18 attempts)
        let isPaid = false;
        let attempts = 0;
        const maxAttempts = 18;

        while (attempts < maxAttempts && !isPaid) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
          attempts++;

          try {
            const checkRes = await fetch(`${API_BASE_URL}/orders/${order.order_id}/`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.is_paid) {
                isPaid = true;
              }
            }
          } catch (e) {
            console.warn('Order poll error:', e);
          }
        }

        if (stkPrompt) stkPrompt.classList.add('d-none');

        if (isPaid) {
          showAlert('orderSuccess', 'Payment Successful!', 8000);
          order.is_paid = true; // inject for receipt generation
        } else {
          showAlert('orderError', 'Payment confirmation timed out. If you paid, it will reflect shortly.', 8000);
        }

        generateReceipt('order', orderData, order);
        CartManager.clear();
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
          if (modal) modal.hide();
        }, 5000);

      } else {
        showAlert('orderSuccess', 'Order placed!', 8000);
        generateReceipt('order', orderData, order);
        CartManager.clear();
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
          if (modal) modal.hide();
        }, 3000);
      }
    } catch (err) {
      showAlert('orderError', err.message, 6000);
      const stkPrompt = document.getElementById('stkPrompt');
      if (stkPrompt) stkPrompt.classList.add('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Order';
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Inject Receipt Modal HTML
  const receiptModalHtml = `
  <div class="modal fade" id="receiptModal" tabindex="-1" aria-labelledby="receiptModalLabel" aria-hidden="true" style="z-index: 1060;">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-bottom-0 pb-0">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-0">
          <div id="receiptContent" style="padding: 2rem; background: #fff; color: #000; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h2 style="margin: 0; color: #d32f2f; font-weight: 800;">VIN-KJ</h2>
              <p style="margin: 0; font-size: 0.9rem; color: #555;">AUTO SERVICES</p>
              <p style="margin: 0; font-size: 0.8rem; color: #777;">Lanet Road, off Baricho Road, Nairobi</p>
              <p style="margin: 0; font-size: 0.8rem; color: #777;">0718885303 | vinkjautoservices@gmail.com</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem;">
              <div>
                <h5 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #333;">Receipt <span id="receiptId">#--</span></h5>
                <p style="margin: 0; font-size: 0.9rem; color: #555;">Date: <span id="receiptDate"></span></p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: 600; color: #333;">Status: <span id="receiptStatus" style="color: #d32f2f;">Pending</span></p>
                <p style="margin: 0; font-size: 0.9rem; color: #555;">Payment: <span id="receiptPaymentMethod">M-Pesa</span></p>
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <h6 style="color: #333; margin-bottom: 0.5rem;">Customer Details</h6>
              <p style="margin: 0; font-size: 0.9rem; color: #555;">Name: <span id="receiptName"></span></p>
              <p style="margin: 0; font-size: 0.9rem; color: #555;">Email: <span id="receiptEmail"></span></p>
              <p style="margin: 0; font-size: 0.9rem; color: #555;">Phone: <span id="receiptPhone"></span></p>
            </div>

            <div style="margin-bottom: 2rem;">
              <h6 style="color: #333; margin-bottom: 0.5rem;" id="receiptItemLabel">Order Items</h6>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead style="background: #f8f9fa;">
                  <tr>
                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                    <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
                  </tr>
                </thead>
                <tbody id="receiptItemsTable" style="border-bottom: 2px solid #dee2e6;">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
              <div style="width: 250px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; color: #333; padding-top: 0.5rem; border-top: 2px solid #000;">
                  <span>Total:</span>
                  <span id="receiptTotalAmount">KSh 0</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 3rem; font-size: 0.85rem; color: #777;">
              <p>Thank you for choosing VIN-KJ Auto Services!</p>
            </div>
          </div>
        </div>
        <div class="modal-footer border-top-0 justify-content-center pb-4">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary-custom" onclick="downloadReceipt()">
            <span class="material-icons align-middle me-1">download</span> Download PDF
          </button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', receiptModalHtml);
});

window.generateReceipt = function (type, payload, response) {
  const date = new Date().toLocaleString();
  document.getElementById('receiptDate').textContent = date;

  document.getElementById('receiptName').textContent = payload.full_name || 'N/A';
  document.getElementById('receiptEmail').textContent = payload.email || 'N/A';
  document.getElementById('receiptPhone').textContent = payload.phone_number || 'N/A';

  const tbody = document.getElementById('receiptItemsTable');
  tbody.innerHTML = '';

  if (type === 'order') {
    document.getElementById('receiptId').textContent = '#' + (response.order_id || '...');
    document.getElementById('receiptItemLabel').textContent = 'Order Items';
    document.getElementById('receiptPaymentMethod').textContent = payload.payment_method;

    if (payload.payment_method === 'Delivery') {
      document.getElementById('receiptStatus').textContent = 'Confirmed (Pay on Delivery)';
      document.getElementById('receiptStatus').style.color = '#28a745';
    } else {
      if (response.is_paid) {
        document.getElementById('receiptStatus').textContent = 'Paid via M-Pesa';
        document.getElementById('receiptStatus').style.color = '#28a745';
      } else {
        document.getElementById('receiptStatus').textContent = 'Pending M-Pesa Payment';
        document.getElementById('receiptStatus').style.color = '#dc3545';
      }
    }

    payload.items.forEach(item => {
      const cartItem = CartManager.items.find(i => i.id === item.product_id);
      const name = cartItem ? cartItem.name : `Product #${item.product_id}`;
      const price = cartItem ? cartItem.price * item.quantity : 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${name}</td>
        <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6;">${formatPrice(price)}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('receiptTotalAmount').textContent = formatPrice(payload.total_price);

  } else if (type === 'booking') {
    document.getElementById('receiptId').textContent = 'BK-' + (response.booking_id || '...');
    document.getElementById('receiptItemLabel').textContent = 'Service Booking';
    document.getElementById('receiptPaymentMethod').textContent = 'Service Payment';
    document.getElementById('receiptStatus').textContent = 'Confirmed';
    document.getElementById('receiptStatus').style.color = '#28a745';

    const serviceSelect = document.getElementById('bookingService');
    const serviceName = serviceSelect.options[serviceSelect.selectedIndex]?.text || 'Service';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${serviceName} <br><small style="color:#6c757d;">${payload.booking_date} at ${payload.booking_time}</small></td>
      <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #dee2e6;">1</td>
      <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6;">${formatPrice(payload.total_price)}</td>
    `;
    tbody.appendChild(tr);

    document.getElementById('receiptTotalAmount').textContent = formatPrice(payload.total_price);
  }

  const receiptModal = new bootstrap.Modal(document.getElementById('receiptModal'));
  receiptModal.show();
};

window.downloadReceipt = function () {
  const receiptElement = document.getElementById('receiptContent');
  if (!receiptElement) return;

  // Extract the HTML content we want to print
  const content = receiptElement.innerHTML;

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  // Write the receipt content into the iframe with basic styling
  doc.open();
  doc.write('<html><head><title>VIN-KJ Receipt</title>');
  doc.write('<style>');
  doc.write('body { font-family: sans-serif; padding: 20px; color: #000; }');
  doc.write('table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }');
  doc.write('th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }');
  doc.write('h2, h5, h6, p { margin-top: 0; }');
  doc.write('</style>');
  doc.write('</head><body>');
  doc.write(content);
  doc.write('</body></html>');
  doc.close();

  // Trigger print (which allows "Save to PDF") after fonts/styles load
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

// Navbar scroll effect
window.addEventListener('scroll', function () {
  const navbar = document.getElementById('mainNavbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.classList.toggle('show', window.scrollY > 400);
  }
});

// ---- Contact Form Handler ----
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const formData = {
        name: document.getElementById('contactName').value,
        phone_number: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
      };

      try {
        const response = await fetch(`${API_BASE_URL}/contact/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        alert('Thank you! Your message has been sent successfully.');
        contactForm.reset();
      } catch (err) {
        console.error('Contact form error:', err);
        alert('Error: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
});

// ============================================
// THEME SWITCHER LOGIC (Default: Light Mode)
// ============================================
function getSavedTheme() {
  try {
    return localStorage.getItem('vinkj_theme') || 'light';
  } catch (e) {
    return 'light';
  }
}

function applyTheme(theme) {
  const targetTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);
  try {
    localStorage.setItem('vinkj_theme', targetTheme);
  } catch (e) {}

  const isDark = targetTheme === 'dark';
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    const label = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });
}

function initThemeToggle() {
  const currentTheme = getSavedTheme();
  applyTheme(currentTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = 'true';

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = active === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });
}

// Initialize theme toggle immediately if document is ready, or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}
