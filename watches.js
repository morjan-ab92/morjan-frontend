import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { db } from "./firebase-frontend-config.js";

// Use global getProductName function from app.js
const getProductName = window.getProductName || function(product, lang = null) {
  if (!product) return "Unknown Product";
  // Get current language - USE ONLY "preferred_lang" as single source of truth
  const currentLang = lang || localStorage.getItem("preferred_lang") || 'ar';
  const langCode = currentLang.split('-')[0];
  if (langCode === 'ar' && product.name_ar) return product.name_ar;
  if (langCode === 'en' && product.name_en) return product.name_en;
  if (langCode === 'he' && product.name_he) return product.name_he;
  if (product.name && typeof product.name === 'object' && product.name !== null) {
    if (product.name[langCode]) return product.name[langCode];
    if (product.name.ar) return product.name.ar;
    if (product.name.en) return product.name.en;
    const availableLang = Object.keys(product.name)[0];
    if (availableLang) return product.name[availableLang];
  }
  if (product.name_ar) return product.name_ar;
  if (product.name_en) return product.name_en;
  if (product.name_he) return product.name_he;
  if (product.name && typeof product.name === 'string') return product.name;
  return "Unknown Product";
};

// Helper function to get gender translation
function getGenderLabel(gender) {
  if (typeof window.JAJewelry?.getTranslation === 'function') {
    return gender === 'men' 
      ? window.JAJewelry.getTranslation('product-gender-men')
      : window.JAJewelry.getTranslation('product-gender-women');
  }
  // Fallback if translation system not loaded
  const lang = document.documentElement.lang || 'en';
  const translations = {
    'ar': { 'men': '👔 رجالي', 'women': '💎 نسائي' },
    'he': { 'men': '👔 גברים', 'women': '💎 נשים' },
    'en': { 'men': '👔 Men', 'women': '💎 Women' }
  };
  const langCode = lang.split('-')[0];
  return translations[langCode]?.[gender] || translations['en'][gender] || (gender === 'men' ? '👔 Men' : '💎 Women');
}

// Function to update gender labels when language changes
function updateGenderLabels() {
  const genderElements = document.querySelectorAll('.product-gender-label');
  genderElements.forEach(element => {
    const gender = element.dataset.gender;
    if (gender) {
      element.textContent = getGenderLabel(gender);
    }
  });
}

// Store all watches globally for filtering
let allWatches = [];

// Favorites management is now handled by favorites.js global click handler
// No duplicate handlers needed here

async function loadAllWatches() {
  try {
    console.log("🔄 Starting to load watches from Firestore...");
    
    // Wait a bit to ensure Firebase is initialized
    if (!db) {
      console.error("❌ Firebase db not initialized yet, retrying...");
      setTimeout(loadAllWatches, 500);
      return;
    }

    const querySnapshot = await getDocs(collection(db, "watches"));
    const container =
      document.querySelector("#watches-container") ||
      document.querySelector(".products-grid") ||
      document.querySelector(".product-grid");

    if (!container) {
      console.error("⚠️ Could not find container element for watches");
      console.error("Available containers:", {
        watchesContainer: document.querySelector("#watches-container"),
        productsGrid: document.querySelector(".products-grid"),
        productGrid: document.querySelector(".product-grid")
      });
      return;
    }

    console.log(`📦 Found ${querySnapshot.size} watches in Firestore`);

    if (querySnapshot.empty) {
      container.innerHTML = "<p style='color:white;text-align:center;padding:2rem;'>لا توجد ساعات حالياً.</p>";
      return;
    }

    // Store all watches in global array
    allWatches = [];
    querySnapshot.forEach((doc) => {
      const watch = {
        id: doc.id,  // Use doc.id (Firestore document ID)
        ...doc.data()
      };
      allWatches.push(watch);
    });
    
    // Apply filters and render
    applyFiltersAndRender();
    
    console.log(`✅ Successfully loaded ${allWatches.length} watches from Firestore`);
  } catch (error) {
    console.error("❌ Error loading watches:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Function to apply filters and render watches
function applyFiltersAndRender() {
  const container =
    document.querySelector("#watches-container") ||
    document.querySelector(".products-grid") ||
    document.querySelector(".product-grid");

  if (!container || allWatches.length === 0) {
    return;
  }

  // Get filter values
  const genderFilter = document.getElementById('genderFilter');
  const availabilityFilter = document.getElementById('availabilityFilter');
  const brandFilter = document.getElementById('brandFilter');
  const priceFilter = document.getElementById('priceFilter');
  
  const selectedGender = genderFilter ? genderFilter.value : 'all';
  const selectedAvailability = availabilityFilter ? availabilityFilter.value : 'all';
  const selectedBrand = brandFilter ? brandFilter.value : 'all';
  const selectedPrice = priceFilter ? priceFilter.value : 'all';

  // Filter watches
  let filteredWatches = allWatches.filter(watch => {
    let matches = true;

    // Filter by gender
    if (selectedGender !== 'all' && watch.gender !== selectedGender) {
      matches = false;
    }

    // Filter by availability (check if quantity exists and > 0)
    if (selectedAvailability === 'available') {
      const quantity = watch.quantity || 0;
      if (quantity <= 0) {
        matches = false;
      }
    } else if (selectedAvailability === 'unavailable') {
      const quantity = watch.quantity || 0;
      if (quantity > 0) {
        matches = false;
      }
    }

    // Filter by brand or sale/clearance
    if (selectedBrand !== 'all') {
      // Special handling for clearance/sale filter
      if (selectedBrand === 'clearance') {
        // Filter by isSale property
        if (!watch.isSale || watch.isSale !== true) {
          matches = false;
        }
      } else {
        // Normal brand filtering
        const watchName = (watch.name || '').toUpperCase();
        const watchBrand = (watch.brand || '').toUpperCase();
        const selectedBrandUpper = selectedBrand.toUpperCase();
        
        // Match by brand field or by name containing the brand
        if (watchBrand !== selectedBrandUpper && !watchName.includes(selectedBrandUpper)) {
          matches = false;
        }
      }
    }

    // Filter by price
    if (selectedPrice !== 'all') {
      const price = watch.price || 0;
      if (selectedPrice === '0-500' && (price < 0 || price > 500)) {
        matches = false;
      } else if (selectedPrice === '500-2000' && (price < 500 || price > 2000)) {
        matches = false;
      } else if (selectedPrice === '2000+' && price < 2000) {
        matches = false;
      }
    }

    return matches;
  });

  // Render filtered watches
  container.innerHTML = "";
  if (filteredWatches.length === 0) {
    container.innerHTML = "<p style='color:white;text-align:center;padding:2rem;'>لا توجد ساعات متطابقة مع الفلاتر المحددة.</p>";
    return;
  }

  filteredWatches.forEach((watch) => {
    // Validate watch.id - must exist from Firestore
    if (!watch.id) {
      console.error("MISSING PRODUCT ID:", watch);
      return; // Skip this watch
    }
    
    const productName = getProductName(watch);
    
    // Normalize product data - use ONLY: id, name, brand, price, image
    const priceAfter = watch.price || 0;
    const priceBefore = watch.original_price || null;
    const currency = watch.currency || '₪';
    const imageUrl = watch.image || watch.image_url || 'assets/images/products/placeholder.jpg';
    
    // Ensure all required fields exist before encoding
    if (!productName || !imageUrl || priceAfter === undefined) {
      console.error("INVALID PRODUCT OBJECT:", watch);
      return; // Skip this watch
    }
    
    const normalizedProduct = {
      id: watch.id,
      name: watch.name || {},
      price: priceAfter,
      original_price: priceBefore,
      currency: currency,
      image: imageUrl,
      gender: watch.gender || 'unisex',
      brand: watch.brand || '',
      category: watch.category || 'watches',
      isSale: watch.isSale || false
    };
    
    // Check if product is on sale
    const isSale = watch.isSale === true;
    // If on sale and no original_price set, use price as original and calculate discount (optional)
    const showSalePrice = isSale && priceBefore;
    
    const watchDataEscaped = JSON.stringify(normalizedProduct).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
    
    // Get sale badge text using translation system
    let saleText = 'SALE'; // Default fallback
    if (typeof window.getTranslation === 'function') {
      saleText = window.getTranslation('sale') || saleText;
    } else {
      // Fallback if translation system not loaded
      const currentLang = localStorage.getItem("preferred_lang") || 'ar';
      const langCode = currentLang.split('-')[0];
      saleText = langCode === 'ar' ? 'تخفيض' : (langCode === 'he' ? 'מבצע' : 'SALE');
    }
    
    // Use unified product card design matching accessories.html
    const card = `
      <div class="product-card" data-product-data='${watchDataEscaped}'>
        ${isSale ? `<div class="sale-badge" data-translate="sale">${saleText}</div>` : ''}
        <div class="favorite-icon" data-product-id="${watch.id}">
          <i class="fa-solid fa-heart"></i>
        </div>
        <img src="${imageUrl}" alt="${productName}" class="product-image" onerror="this.src='assets/images/products/placeholder.jpg'">
        <div class="product-info">
          <h3 class="product-name" data-id="${watch.id}">${productName}</h3>
          <p class="product-brand product-gender-label" data-gender="${watch.gender || 'unisex'}">${getGenderLabel(watch.gender || 'unisex')}</p>
          <p class="product-price">
            ${showSalePrice ? `<span class="old-price">${priceBefore}${currency}</span>` : ''}
            <span class="new-price">${priceAfter}${currency}</span>
          </p>
          <button class="add-to-cart" data-translate="btn-add-to-cart" data-id="${watch.id}" data-product="${JSON.stringify({
            id: watch.id,
            name: productName,
            brand: watch.brand || '',
            price: priceAfter || 0,
            image: normalizedProduct.image || 'assets/images/products/placeholder.jpg',
            category: watch.category || 'watches'
          }).replace(/"/g, '&quot;')}" onclick="window.addToCart(JSON.parse(this.getAttribute('data-product')))">Add to Cart</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
    
    // Auto-translate missing languages in background
    if (watch.id && window.getProductNameAsync) {
      const nameElement = container.querySelector(`.product-name[data-id="${watch.id}"]`);
      if (nameElement) {
        // Update in background - don't wait
        window.getProductNameAsync(watch, watch.id, 'watches').then(translatedName => {
          if (translatedName && translatedName !== nameElement.textContent) {
            nameElement.textContent = translatedName;
            const img = nameElement.closest('.product-card')?.querySelector('.product-image');
            if (img) img.alt = translatedName;
          }
        }).catch(err => console.warn('Background translation failed:', err));
      }
    }
  });
  
  // Update gender labels after rendering
  if (window.updateGenderLabels) {
    updateGenderLabels();
  }
  
  // Update sale badges after rendering
  updateSaleBadges();
  
  // Update favorite icons after rendering
  if (window.updateAllFavoriteIcons) {
    window.updateAllFavoriteIcons();
  }
}

// Function to update product names when language changes
function updateWatchNames() {
  const container =
    document.querySelector("#watches-container") ||
    document.querySelector(".products-grid") ||
    document.querySelector(".product-grid");
  
  if (!container) return;
  
  // Use global getProductName - it automatically reads from localStorage
  const getProductNameFunc = window.getProductName || getProductName;
  
  container.querySelectorAll('.product-name[data-id], .product-name[data-product-id]').forEach(nameElement => {
    const productCard = nameElement.closest('.product-card');
    const productDataStr = productCard?.getAttribute('data-product-data');
    if (productDataStr) {
      try {
        const productData = JSON.parse(productDataStr);
        // getProductName automatically uses current language from localStorage
        const translatedName = getProductNameFunc(productData);
        nameElement.textContent = translatedName;
        
        // Update alt text
        const img = productCard.querySelector('.product-image');
        if (img) {
          img.alt = translatedName;
        }
      } catch (e) {
        console.warn('Failed to parse product data for name update:', e);
      }
    }
  });
}

// Make function available globally
window.updateWatchNames = updateWatchNames;

console.log('✅ Multilingual product name support enabled across all categories.');

// Function to translate filter dropdowns
function translateFilterDropdowns() {
  const lang = document.documentElement.lang || 'ar';
  const langCode = lang.split('-')[0];
  
  // Translate the "Filter" label
  const filterLabel = document.querySelector('.filter-label');
  if (filterLabel) {
    const text = filterLabel.getAttribute(`data-${langCode}`);
    if (text) {
      filterLabel.textContent = text;
    }
  }
  
  // Translate gender filter options
  const genderFilter = document.getElementById('genderFilter');
  if (genderFilter) {
    genderFilter.querySelectorAll('option').forEach(option => {
      const text = option.getAttribute(`data-${langCode}`);
      if (text) {
        option.textContent = text;
      }
    });
  }
  
  // Translate availability filter options
  const availabilityFilter = document.getElementById('availabilityFilter');
  if (availabilityFilter) {
    availabilityFilter.querySelectorAll('option').forEach(option => {
      const text = option.getAttribute(`data-${langCode}`);
      if (text) {
        option.textContent = text;
      }
    });
  }
  
  // Translate brand filter options (including sale/clearance)
  const brandFilter = document.getElementById('brandFilter');
  if (brandFilter) {
    brandFilter.querySelectorAll('option').forEach(option => {
      const text = option.getAttribute(`data-${langCode}`);
      if (text) {
        option.textContent = text;
      }
    });
  }
  
  // Update sale badges when language changes
  updateSaleBadges();
  
  // Translate price filter options
  const priceFilter = document.getElementById('priceFilter');
  if (priceFilter) {
    priceFilter.querySelectorAll('option').forEach(option => {
      const text = option.getAttribute(`data-${langCode}`);
      if (text) {
        option.textContent = text;
      }
    });
  }
}

// Wait for DOM to be ready and ensure Firebase is loaded
function initWatches() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Add a small delay to ensure Firebase config is loaded
      setTimeout(() => {
        loadAllWatches();
        setupFilterListeners();
        translateFilterDropdowns();
      }, 100);
    });
  } else {
    // DOM already loaded, but wait a bit for Firebase
    setTimeout(() => {
      loadAllWatches();
      setupFilterListeners();
      translateFilterDropdowns();
    }, 100);
  }
}

// Setup event listeners for filters
function setupFilterListeners() {
  const genderFilter = document.getElementById('genderFilter');
  const availabilityFilter = document.getElementById('availabilityFilter');
  const brandFilter = document.getElementById('brandFilter');
  const priceFilter = document.getElementById('priceFilter');
  
  if (genderFilter) {
    genderFilter.addEventListener('change', applyFiltersAndRender);
  }
  
  if (availabilityFilter) {
    availabilityFilter.addEventListener('change', applyFiltersAndRender);
  }
  
  if (brandFilter) {
    brandFilter.addEventListener('change', applyFiltersAndRender);
  }
  
  if (priceFilter) {
    priceFilter.addEventListener('change', applyFiltersAndRender);
  }
}

initWatches();

// Export updateGenderLabels for global access (will be called by switchLanguage in app.js)
window.updateGenderLabels = updateGenderLabels;

// Function to update sale badge text when language changes
function updateSaleBadges() {
  let saleText = 'SALE'; // Default fallback
  if (typeof window.getTranslation === 'function') {
    saleText = window.getTranslation('sale') || saleText;
  } else {
    // Fallback if translation system not loaded
    const lang = document.documentElement.lang || localStorage.getItem("preferred_lang") || 'ar';
    const langCode = lang.split('-')[0];
    saleText = langCode === 'ar' ? 'تخفيض' : (langCode === 'he' ? 'מבצע' : 'SALE');
  }
  
  document.querySelectorAll('.sale-badge').forEach(badge => {
    badge.textContent = saleText;
  });
}

// Export translateFilterDropdowns for language switching
window.translateFilterDropdowns = translateFilterDropdowns;

// Export updateSaleBadges for language switching
window.updateSaleBadges = updateSaleBadges;
