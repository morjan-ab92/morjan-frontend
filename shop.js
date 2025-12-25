import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { db } from "./firebase-frontend-config.js";

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

// Helper function to get multilingual product name
function getProductName(product, lang = null) {
  if (!product || !product.name) {
    return "Unknown Product";
  }
  
  // If name is an object with language keys
  if (typeof product.name === 'object' && product.name !== null) {
    const currentLang = lang || document.documentElement.lang || localStorage.getItem('language') || 'ar';
    const langCode = currentLang.split('-')[0];
    
    // Try current language first
    if (product.name[langCode]) {
      return product.name[langCode];
    }
    
    // Fallback to Arabic
    if (product.name.ar) {
      return product.name.ar;
    }
    
    // Fallback to English
    if (product.name.en) {
      return product.name.en;
    }
    
    // Fallback to any available language
    const availableLang = Object.keys(product.name)[0];
    if (availableLang) {
      return product.name[availableLang];
    }
  }
  
  // Backward compatibility: if name is a string, return it
  if (typeof product.name === 'string') {
    return product.name;
  }
  
  return "Unknown Product";
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

// Favorites management is now handled by favorites.js global click handler
// No duplicate handlers needed here

async function loadFeaturedPerfumes() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const perfumes = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id; // Add document ID to product data
      perfumes.push(product);
    });

    const container = document.getElementById("featured-perfumes");
    
    if (!container) {
      console.error("❌ featured-perfumes container not found");
      return;
    }

    container.innerHTML = "";

    // Show only the first 4 perfumes on the homepage
    perfumes.slice(0, 4).forEach((product) => {
      const genderLabel = getGenderLabel(product.gender);
      const productName = getProductName(product);
      const card = `
        <div class="product-card" data-product-data='${JSON.stringify(product).replace(/'/g, "&#39;")}'>
          <div class="favorite-icon" data-product-id="${product.id || ''}">
            <i class="fa-solid fa-heart"></i>
          </div>
          <img src="${product.image_url || 'assets/images/products/placeholder.jpg'}" alt="${productName}" class="product-image">
          <div class="product-info">
            <h3 class="product-name" data-product-id="${product.id || ''}">${productName}</h3>
            <p class="product-brand product-gender-label" data-gender="${product.gender}">${genderLabel}</p>
            <p class="product-price">
              ${product.original_price ? `<span class="old-price">${product.original_price}${product.currency || '₪'}</span>` : ''}
              <span class="new-price">${product.price}${product.currency || '₪'}</span>
            </p>
            <button class="add-to-cart" data-translate="btn-add-to-cart" data-id="${product.id || ''}" data-product="${JSON.stringify({
              id: product.id,
              name: productName,
              brand: product.brand || '',
              price: product.price || 0,
              image: product.imageUrl || product.image || product.image_url || 'assets/images/products/placeholder.jpg',
              category: product.category || 'perfumes'
            }).replace(/"/g, '&quot;')}" onclick="window.addToCart(JSON.parse(this.getAttribute('data-product')))">Add to Cart</button>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
    if (window.updateAllFavoriteIcons) {
      window.updateAllFavoriteIcons();
    }
    console.log("✅ Featured perfumes loaded from Firestore");
  } catch (error) {
    console.error("❌ Error loading featured perfumes:", error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeaturedPerfumes);
} else {
  loadFeaturedPerfumes();
}

// Function to update product names on homepage when language changes
function updateHomepageProductNames() {
  const currentLang = document.documentElement.lang || localStorage.getItem('language') || 'ar';
  const langCode = currentLang.split('-')[0];
  
  // Update perfumes
  document.querySelectorAll('#featured-perfumes .product-name[data-product-id]').forEach(nameElement => {
    const productDataStr = nameElement.getAttribute('data-product-data') || nameElement.closest('.product-card')?.getAttribute('data-product-data');
    if (productDataStr) {
      try {
        const productData = JSON.parse(productDataStr);
        const translatedName = getProductName(productData, langCode);
        nameElement.textContent = translatedName;
        const img = nameElement.closest('.product-card')?.querySelector('.product-image');
        if (img) img.alt = translatedName;
      } catch (e) {
        console.warn('Failed to parse product data for name update:', e);
      }
    }
  });
  
  // Update bags
  document.querySelectorAll('#featured-bags .product-name[data-product-id]').forEach(nameElement => {
    const productDataStr = nameElement.getAttribute('data-product-data') || nameElement.closest('.product-card')?.getAttribute('data-product-data');
    if (productDataStr) {
      try {
        const productData = JSON.parse(productDataStr);
        const translatedName = getProductName(productData, langCode);
        nameElement.textContent = translatedName;
        const img = nameElement.closest('.product-card')?.querySelector('.product-image');
        if (img) img.alt = translatedName;
      } catch (e) {
        console.warn('Failed to parse product data for name update:', e);
      }
    }
  });
  
  // Update watches
  document.querySelectorAll('#featured-watches .product-name[data-product-id]').forEach(nameElement => {
    const productDataStr = nameElement.getAttribute('data-product-data') || nameElement.closest('.product-card')?.getAttribute('data-product-data');
    if (productDataStr) {
      try {
        const productData = JSON.parse(productDataStr);
        const translatedName = getProductName(productData, langCode);
        nameElement.textContent = translatedName;
        const img = nameElement.closest('.product-card')?.querySelector('.product-image');
        if (img) img.alt = translatedName;
      } catch (e) {
        console.warn('Failed to parse product data for name update:', e);
      }
    }
  });
}

// Export updateGenderLabels for global access (will be called by switchLanguage in app.js)
window.updateGenderLabels = updateGenderLabels;
window.updateHomepageProductNames = updateHomepageProductNames;

console.log('✅ Multilingual product name support enabled across all categories.');

// Helper function to get bag type translation
function getBagTypeLabel(type) {
  if (typeof window.JAJewelry?.getTranslation === 'function') {
    if (type === 'women') return window.JAJewelry.getTranslation('product-gender-women');
    if (type === 'men') return window.JAJewelry.getTranslation('product-gender-men');
    if (type === 'travel') return window.JAJewelry.getTranslation('filter-travel') || '✈️ Travel';
  }
  // Fallback if translation system not loaded
  const lang = document.documentElement.lang || 'en';
  const translations = {
    'ar': { 'women': '💎 نسائي', 'men': '👔 رجالي', 'travel': '✈️ سفر' },
    'he': { 'women': '💎 נשים', 'men': '👔 גברים', 'travel': '✈️ נסיעות' },
    'en': { 'women': '💎 Women', 'men': '👔 Men', 'travel': '✈️ Travel' }
  };
  const langCode = lang.split('-')[0];
  return translations[langCode]?.[type] || translations['en'][type] || type;
}

// Load featured bags for homepage (4 bags: diverse mix of women/men/travel)
async function loadFeaturedBags() {
  const container = document.getElementById("featured-bags");
  
  if (!container) {
    console.error("❌ featured-bags container not found");
    return;
  }

  container.innerHTML = '<div style="text-align: center; color: #d4af37; padding: 20px;">Loading bags...</div>';

  try {
    // Load directly from "bags" collection
    const querySnapshot = await getDocs(collection(db, "bags"));
    const allBags = [];
    
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id;
      allBags.push(product);
    });

    if (allBags.length === 0) {
      console.warn("⚠️ No bags found in database");
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No bags available at the moment.</p>';
      return;
    }

    console.log(`📦 Total bags fetched: ${allBags.length}`);

    // Separate bags by type for diverse selection
    const womenBags = allBags.filter(bag => {
      const type = String(bag.type || bag.gender || '').toLowerCase().trim();
      return type === 'women' || type === 'woman' || type === 'female' || type === 'نسائي' || type === 'נשים';
    });
    
    const menBags = allBags.filter(bag => {
      const type = String(bag.type || bag.gender || '').toLowerCase().trim();
      return type === 'men' || type === 'man' || type === 'male' || type === 'رجالي' || type === 'גברים';
    });
    
    const travelBags = allBags.filter(bag => {
      const type = String(bag.type || bag.gender || '').toLowerCase().trim();
      return type === 'travel' || type === 'سفر' || type === 'נסיעות';
    });

    console.log(`📊 Bags breakdown: ${womenBags.length} women's, ${menBags.length} men's, ${travelBags.length} travel`);

    // Select diverse mix: 2 women, 1 men, 1 travel (or adjust based on availability)
    const selectedBags = [];
    
    // Add 2 women's bags
    if (womenBags.length > 0) {
      selectedBags.push(...womenBags.slice(0, 2));
    }
    
    // Add 1 men's bag
    if (menBags.length > 0 && selectedBags.length < 4) {
      selectedBags.push(menBags[0]);
    }
    
    // Add 1 travel bag
    if (travelBags.length > 0 && selectedBags.length < 4) {
      selectedBags.push(travelBags[0]);
    }

    // If we don't have enough bags, fill with available ones
    if (selectedBags.length < 4 && allBags.length > selectedBags.length) {
      const remaining = allBags.filter(bag => !selectedBags.some(selected => selected.id === bag.id));
      selectedBags.push(...remaining.slice(0, 4 - selectedBags.length));
    }

    // Clear container before displaying
    container.innerHTML = "";

    // Display exactly 4 bags (or as many as available)
    const bagsToDisplay = selectedBags.slice(0, 4);
    
    if (bagsToDisplay.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No bags available at the moment.</p>';
      return;
    }
    
    bagsToDisplay.forEach((product) => {
      const typeLabel = getBagTypeLabel(product.type || product.gender || 'unisex');
      const priceAfter = product.price_after || product.price || 0;
      const priceBefore = product.price_before || product.original_price || null;
      const currency = product.currency || '₪';
      
      const productName = getProductName(product);
      const card = `
        <div class="product-card" data-product-data='${JSON.stringify(product).replace(/'/g, "&#39;")}'>
          <div class="favorite-icon" data-product-id="${product.id || ''}">
            <i class="fa-solid fa-heart"></i>
          </div>
          <img src="${product.image_url || 'assets/images/products/placeholder.jpg'}" alt="${productName}" class="product-image">
          <div class="product-info">
            <h3 class="product-name" data-product-id="${product.id || ''}">${productName}</h3>
            <p class="product-brand product-type-label" data-type="${product.type || product.gender || 'unisex'}">${typeLabel}</p>
            <p class="product-price">
              ${priceBefore ? `<span class="old-price">${priceBefore}${currency}</span>` : ''}
              <span class="new-price">${priceAfter}${currency}</span>
            </p>
            <button class="add-to-cart" data-translate="btn-add-to-cart" data-id="${product.id || ''}" data-product="${JSON.stringify({
              id: product.id,
              name: productName,
              brand: product.brand || '',
              price: product.price || 0,
              image: product.imageUrl || product.image || product.image_url || 'assets/images/products/placeholder.jpg',
              category: product.category || 'perfumes'
            }).replace(/"/g, '&quot;')}" onclick="window.addToCart(JSON.parse(this.getAttribute('data-product')))">Add to Cart</button>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
    
    // Update type labels after rendering (for language support)
    if (window.updateTypeLabels) {
      window.updateTypeLabels();
    }
    
    if (window.updateAllFavoriteIcons) {
      window.updateAllFavoriteIcons();
    }
    console.log(`✅ Featured bags loaded: ${bagsToDisplay.length} bags (diverse mix from "bags" collection)`);
  } catch (error) {
    console.error("❌ Error loading featured bags:", error);
    container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">Error loading bags. Please try again later.</p>';
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedBags();
  });
} else {
  loadFeaturedBags();
}

// Load featured watches for homepage (4 watches: 2 women's + 2 men's)
async function loadFeaturedWatches() {
  const container = document.getElementById("featured-watches");
  
  if (!container) {
    console.error("❌ featured-watches container not found");
    return;
  }

  container.innerHTML = '<div style="text-align: center; color: #d4af37; padding: 20px;">Loading watches...</div>';

  try {
    let allWatches = [];
    let collectionUsed = '';
    
    // First, try "watches" collection (where watches are actually stored)
    try {
      console.log("🔍 Fetching watches from 'watches' collection...");
      const watchesSnapshot = await getDocs(collection(db, "watches"));
      
      watchesSnapshot.forEach((doc) => {
        const watch = doc.data();
        watch.id = doc.id;
        allWatches.push(watch);
      });
      
      collectionUsed = 'watches';
      console.log(`✅ Found ${allWatches.length} watches in 'watches' collection`);
    } catch (watchesError) {
      console.warn("⚠️ Could not fetch from 'watches' collection, trying 'products' collection...", watchesError);
      
      // Fallback: Try "products" collection where category = "watches"
      try {
        console.log("🔍 Fetching watches from 'products' collection where category == 'watches'...");
        const watchesQuery = query(
          collection(db, "products"),
          where("category", "==", "watches")
        );
        
        const querySnapshot = await getDocs(watchesQuery);
        
        querySnapshot.forEach((doc) => {
          const watch = doc.data();
          watch.id = doc.id;
          allWatches.push(watch);
        });
        
        collectionUsed = 'products';
        console.log(`✅ Found ${allWatches.length} watches in 'products' collection`);
      } catch (productsError) {
        console.error("❌ Could not fetch from 'products' collection either:", productsError);
        throw new Error(`Failed to fetch watches from both collections: ${productsError.message}`);
      }
    }

    if (allWatches.length === 0) {
      console.warn("⚠️ No watches found in database");
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No watches available at the moment.</p>';
      return;
    }

    console.log(`📦 Total watches fetched: ${allWatches.length} from '${collectionUsed}' collection`);

    // Separate watches by gender (handle different gender formats)
    const womenWatches = allWatches.filter(w => {
      const gender = String(w.gender || '').toLowerCase().trim();
      return gender === 'women' || gender === 'woman' || gender === 'female' || gender === 'نسائي' || gender === 'נשים';
    });
    
    const menWatches = allWatches.filter(w => {
      const gender = String(w.gender || '').toLowerCase().trim();
      return gender === 'men' || gender === 'man' || gender === 'male' || gender === 'رجالي' || gender === 'גברים';
    });
    
    console.log(`📊 Watches breakdown: ${womenWatches.length} women's, ${menWatches.length} men's`);
    
    // Get 2 women's watches and 2 men's watches
    const selectedWatches = [
      ...womenWatches.slice(0, 2),
      ...menWatches.slice(0, 2)
    ];

    // If we don't have enough watches, fill with available ones
    if (selectedWatches.length < 4 && allWatches.length > selectedWatches.length) {
      const remaining = allWatches.filter(w => !selectedWatches.some(sw => sw.id === w.id));
      selectedWatches.push(...remaining.slice(0, 4 - selectedWatches.length));
    }

    // Clear container before displaying
    container.innerHTML = "";

    // Display exactly 4 watches (or as many as available)
    const watchesToDisplay = selectedWatches.slice(0, 4);
    
    if (watchesToDisplay.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No watches available at the moment.</p>';
      return;
    }

    watchesToDisplay.forEach((watch) => {
      const genderLabel = getGenderLabel(watch.gender || 'men');
      const imageUrl = watch.imageUrl || watch.image || watch.image_url || 'assets/images/products/placeholder.jpg';
      const watchName = getProductName(watch);
      // Use price_after/price_before for consistency with bags, fallback to price/original_price
      const priceAfter = watch.price_after || watch.price || 0;
      const priceBefore = watch.price_before || watch.original_price || null;
      const currency = watch.currency || '₪';
      const watchId = watch.id || '';
      
      const card = `
        <div class="product-card" data-product-data='${JSON.stringify(watch).replace(/'/g, "&#39;")}'>
          <div class="favorite-icon" data-product-id="${watchId}">
            <i class="fa-solid fa-heart"></i>
          </div>
          <img src="${imageUrl}" alt="${watchName}" class="product-image" onerror="this.src='assets/images/products/placeholder.jpg'">
          <div class="product-info">
            <h3 class="product-name" data-product-id="${watchId}">${watchName}</h3>
            <p class="product-brand product-gender-label" data-gender="${watch.gender || 'men'}">${genderLabel}</p>
            <p class="product-price">
              ${priceBefore ? `<span class="old-price">${priceBefore}${currency}</span>` : ''}
              <span class="new-price">${priceAfter}${currency}</span>
            </p>
            <button class="add-to-cart" data-translate="btn-add-to-cart" onclick="window.addToCart('${watchId}')">Add to Cart</button>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
    
    // Update gender labels after rendering (for language support)
    if (window.updateGenderLabels) {
      window.updateGenderLabels();
    }
    
    if (window.updateAllFavoriteIcons) {
      window.updateAllFavoriteIcons();
    }
    console.log(`✅ Featured watches loaded: ${watchesToDisplay.length} watches (${womenWatches.slice(0, 2).length} women's + ${menWatches.slice(0, 2).length} men's) from '${collectionUsed}' collection`);
  } catch (error) {
    console.error("❌ Error loading featured watches:", error);
    container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">Error loading watches. Please try again later.</p>';
  }
}

// Wait for DOM to be ready for watches and ensure Firebase is initialized
function initFeaturedWatches() {
  // Wait a bit to ensure Firebase is fully initialized
  setTimeout(() => {
    try {
      if (db) {
        console.log("✅ Firebase db is ready, loading watches...");
        loadFeaturedWatches();
      } else {
        console.warn("⚠️ Firebase db not ready, retrying...");
        setTimeout(initFeaturedWatches, 500);
      }
    } catch (error) {
      console.warn("⚠️ Firebase db not ready, retrying...", error);
      setTimeout(initFeaturedWatches, 500);
    }
  }, 500);
}

// Initialize watches when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM loaded, initializing watches...");
    initFeaturedWatches();
  });
} else {
  console.log("📄 DOM already ready, initializing watches...");
  initFeaturedWatches();
}

// Also export the function for manual calling if needed
window.loadFeaturedWatches = loadFeaturedWatches;

// Load featured accessories for homepage (4 accessories from "accessories" collection or products with category == "Accessories")
async function loadFeaturedAccessories() {
  const container = document.getElementById("featured-accessories");
  
  if (!container) {
    console.error("❌ featured-accessories container not found");
    return;
  }

  container.innerHTML = '<div style="text-align: center; color: #d4af37; padding: 20px;">Loading accessories...</div>';

  try {
    let allAccessories = [];
    
    // First, try "accessories" collection
    try {
      console.log("🔍 Fetching accessories from 'accessories' collection...");
      const accessoriesSnapshot = await getDocs(collection(db, "accessories"));
      
      accessoriesSnapshot.forEach((doc) => {
        const product = {
          id: doc.id,  // Use doc.id (Firestore document ID)
          ...doc.data()
        };
        allAccessories.push(product);
      });
      
      console.log(`✅ Found ${allAccessories.length} accessories in 'accessories' collection`);
    } catch (accessoriesError) {
      console.warn("⚠️ Could not fetch from 'accessories' collection, trying 'products' collection...", accessoriesError);
      
      // Fallback: Try "products" collection where category == "Accessories"
      try {
        console.log("🔍 Fetching accessories from 'products' collection where category == 'Accessories'...");
        const accessoriesQuery = query(
          collection(db, "products"),
          where("category", "==", "Accessories")
        );
        
        const querySnapshot = await getDocs(accessoriesQuery);
        
        querySnapshot.forEach((doc) => {
          const product = {
            id: doc.id,  // Use doc.id (Firestore document ID)
            ...doc.data()
          };
          allAccessories.push(product);
        });
        
        console.log(`✅ Found ${allAccessories.length} accessories in 'products' collection`);
      } catch (productsError) {
        console.error("❌ Could not fetch from 'products' collection either:", productsError);
        throw new Error(`Failed to fetch accessories from both collections: ${productsError.message}`);
      }
    }

    if (allAccessories.length === 0) {
      console.warn("⚠️ No accessories found in database");
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No accessories available at the moment.</p>';
      return;
    }

    // Clear container before displaying
    container.innerHTML = "";

    // Display exactly 4 accessories (or as many as available)
    const accessoriesToDisplay = allAccessories.slice(0, 4);
    
    if (accessoriesToDisplay.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">No accessories available at the moment.</p>';
      return;
    }
    
    accessoriesToDisplay.forEach((product) => {
      const genderLabel = product.gender ? getGenderLabel(product.gender) : '';
      const productName = getProductName(product);
      
      // Handle different price field names
      const priceAfter = product.price_after || product.price || 0;
      const priceBefore = product.price_before || product.original_price || null;
      const currency = product.currency || '₪';
      const imageUrl = product.image || product.image_url || 'assets/images/products/placeholder.jpg';
      const productId = product.id || '';
      
      const card = `
        <div class="product-card" data-product-data='${JSON.stringify(product).replace(/'/g, "&#39;")}'>
          <div class="favorite-icon" data-product-id="${productId}">
            <i class="fa-solid fa-heart"></i>
          </div>
          <img src="${imageUrl}" alt="${productName}" class="product-image" onerror="this.src='assets/images/products/placeholder.jpg'">
          <div class="product-info">
            <h3 class="product-name" data-product-id="${productId}">${productName}</h3>
            ${genderLabel ? `<p class="product-brand product-gender-label" data-gender="${product.gender || ''}">${genderLabel}</p>` : ''}
            <p class="product-price">
              ${priceBefore ? `<span class="old-price">${priceBefore}${currency}</span>` : ''}
              <span class="new-price">${priceAfter}${currency}</span>
            </p>
            <button class="add-to-cart" data-translate="btn-add-to-cart" data-id="${productId}" data-product="${JSON.stringify({
              id: product.id,
              name: productName,
              brand: product.brand || '',
              price: priceAfter || 0,
              image: imageUrl || 'assets/images/products/placeholder.jpg',
              category: product.category || 'accessories'
            }).replace(/"/g, '&quot;')}" onclick="window.addToCart(JSON.parse(this.getAttribute('data-product')))">Add to Cart</button>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
    
    // Update gender labels after rendering (for language support)
    if (window.updateGenderLabels) {
      window.updateGenderLabels();
    }
    
    if (window.updateAllFavoriteIcons) {
      window.updateAllFavoriteIcons();
    }
    console.log(`✅ Featured accessories loaded: ${accessoriesToDisplay.length} accessories`);
  } catch (error) {
    console.error("❌ Error loading featured accessories:", error);
    container.innerHTML = '<p style="text-align: center; color: #d4af37; padding: 20px;">Error loading accessories. Please try again later.</p>';
  }
}

// Wait for DOM to be ready and initialize featured accessories
function initFeaturedAccessories() {
  // Wait a bit to ensure Firebase is fully initialized
  setTimeout(() => {
    try {
      if (db) {
        console.log("✅ Firebase db is ready, loading accessories...");
        loadFeaturedAccessories();
      } else {
        console.warn("⚠️ Firebase db not ready, retrying...");
        setTimeout(initFeaturedAccessories, 500);
      }
    } catch (error) {
      console.warn("⚠️ Firebase db not ready, retrying...", error);
      setTimeout(initFeaturedAccessories, 500);
    }
  }, 500);
}

// Initialize accessories when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM loaded, initializing accessories...");
    initFeaturedAccessories();
  });
} else {
  console.log("📄 DOM already ready, initializing accessories...");
  initFeaturedAccessories();
}

// Export the function for manual calling if needed
window.loadFeaturedAccessories = loadFeaturedAccessories;

