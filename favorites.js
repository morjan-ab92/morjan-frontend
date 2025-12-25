// Favorites Management Functions

// Helper function to check if we're on the favorites page
function isFavoritesPage() {
    // Check for favorites-specific elements that only exist on favorites.html
    return document.querySelector('#favorites-container') !== null ||
           document.querySelector('.page-title[data-translate="favorites-title"]') !== null ||
           window.location.pathname.includes('favorites.html');
}

// Helper function to get gender translation
function getGenderLabel(gender) {
  if (!gender) return "";
  
  // Try to use global translation system if available
  if (typeof window.JAJewelry?.getTranslation === 'function') {
    return gender === 'men' || gender === 'male'
      ? window.JAJewelry.getTranslation('product-gender-men')
      : gender === 'women' || gender === 'female'
      ? window.JAJewelry.getTranslation('product-gender-women')
      : gender;
  }
  
  // Fallback: Use preferred_lang from localStorage
  const lang = localStorage.getItem("preferred_lang") || "ar";
  const langCode = lang.split('-')[0];
  
  const map = {
    men: { ar: "👔 رجالي", en: "👔 Men", he: "👔 גברים" },
    male: { ar: "👔 رجالي", en: "👔 Men", he: "👔 גברים" },
    women: { ar: "💎 نسائي", en: "💎 Women", he: "💎 נשים" },
    female: { ar: "💎 نسائي", en: "💎 Women", he: "💎 נשים" },
    unisex: { ar: "للجنسين", en: "Unisex", he: "יוניסקס" }
  };
  
  return map[gender]?.[langCode] || map[gender]?.['en'] || gender;
}

// Helper function to normalize product data and ensure all required fields are present
function normalizeProductData(product) {
    if (!product) return null;
    
    // Create normalized product object with all required fields
    const normalized = {
        id: product.id || '',
        name: product.name || {},
        price: product.price || product.price_after || 0,
        original_price: product.original_price || product.price_before || null,
        currency: product.currency || '₪',
        // Preserve all image fields to match perfumes.html extraction logic
        imageUrl: product.imageUrl || null,
        image: product.image || null,
        image_url: product.image_url || product.imageUrl || product.image || 'assets/images/products/placeholder.jpg',
        gender: product.gender || 'unisex',
        brand: product.brand || '',
        category: product.category || '',
        // Include any additional fields that might be useful
        type: product.type || null,
        material: product.material || null,
        color: product.color || null
    };
    
    // Only include original_price if it exists and is greater than price
    if (!normalized.original_price || normalized.original_price <= normalized.price) {
        normalized.original_price = null;
    }
    
    return normalized;
}

// Load favorites from Firestore (async)
async function loadFavorites() {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, getFirestoreWishlist } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            console.log('ℹ️ Favorites: User not logged in - returning empty array');
            return []; // Guest users have no wishlist
        }
        
        console.log('🔄 Favorites: Fetching from Firestore...');
        const favorites = await getFirestoreWishlist();
        console.log(`✅ Favorites: Successfully fetched ${favorites.length} items`);
        return favorites;
    } catch (error) {
        console.error('❌ Favorites: Error loading from Firestore:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        // Return empty array to maintain existing behavior
        return [];
    }
}

// Helper function to get favorites from localStorage (for guests)
function getLocalStorageFavorites() {
    try {
        return JSON.parse(localStorage.getItem("favorites")) || [];
    } catch (error) {
        console.error('Error reading localStorage favorites:', error);
        return [];
    }
}

// Helper function to save favorites to localStorage (for guests)
function saveLocalStorageFavorites(favorites) {
    try {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving localStorage favorites:', error);
    }
}

// Toggle favorite status for a product (supports both localStorage for guests and Firestore for logged-in users)
async function toggleFavorite(productId, productData = null) {
    try {
        // Validate productId - must be non-empty string
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            console.warn('⚠️ Cannot toggle favorite: productId is missing, empty, or invalid. productId:', productId);
            return false;
        }
        
        // Check if user is logged in
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, isInFirestoreWishlist, addToFirestoreWishlist, removeFirestoreWishlistItem } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            // Guest user - use localStorage
            let favorites = getLocalStorageFavorites();
            
            if (favorites.includes(productId)) {
                // Remove from favorites
                favorites = favorites.filter(id => id !== productId);
                saveLocalStorageFavorites(favorites);
                console.log('Removed from localStorage favorites:', productId);
            } else {
                // Add to favorites
                favorites.push(productId);
                saveLocalStorageFavorites(favorites);
                console.log('Added to localStorage favorites:', productId);
            }
            
            // Update icon immediately
            updateFavoriteIconSync(productId);
            window.dispatchEvent(new Event('favoritesUpdated'));
            return true;
        } else {
            // Logged-in user - use Firestore
            const isInWishlist = await isInFirestoreWishlist(productId);
            
            if (isInWishlist) {
                // Remove from wishlist
                await removeFirestoreWishlistItem(productId);
                console.log('Removed from Firestore wishlist:', productId);
                await updateFavoriteIcon(productId);
                window.dispatchEvent(new Event('favoritesUpdated'));
                return true;
            } else {
                // Add to wishlist - need product data
                let productObj = null;
                
                if (productData) {
                    if (typeof productData === 'string') {
                        try {
                            productObj = JSON.parse(productData);
                        } catch (e) {
                            console.error('Error parsing product data string:', e);
                            productObj = null;
                        }
                    } else {
                        productObj = productData;
                    }
                }
                
                // If productData is not available, try to get from data attribute
                if (!productObj) {
                    const icon = document.querySelector(`[data-product-id="${productId}"]`);
                    const card = icon?.closest('.product-card');
                    if (card) {
                        const dataAttr = card.getAttribute('data-product-data');
                        if (dataAttr) {
                            try {
                                productObj = JSON.parse(dataAttr);
                            } catch (e2) {
                                console.error('Error parsing product data from attribute:', e2);
                                return false;
                            }
                        }
                    }
                }
                
                if (!productObj) {
                    console.error('Product data required to add to wishlist');
                    return false;
                }
                
                // Normalize the product data
                const normalizedProduct = normalizeProductData(productObj);
                if (!normalizedProduct) {
                    console.error('Failed to normalize product data');
                    return false;
                }
                
                normalizedProduct.id = productId;
                
                // Add to Firestore wishlist
                await addToFirestoreWishlist(normalizedProduct);
                console.log('Added to Firestore wishlist:', productId, normalizedProduct);
                await updateFavoriteIcon(productId);
                window.dispatchEvent(new Event('favoritesUpdated'));
                return true;
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
}

// Check if a product is in favorites (checks both localStorage for guests and Firestore for logged-in users)
async function isFavorite(productId) {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, isInFirestoreWishlist } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            // Guest user - check localStorage
            const favorites = getLocalStorageFavorites();
            return favorites.includes(productId);
        }
        
        // Logged-in user - check Firestore
        return await isInFirestoreWishlist(productId);
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

// Synchronous version for localStorage (guests) - for immediate UI updates
function isFavoriteSync(productId) {
    try {
        const authModule = window.__authModule;
        const currentUser = authModule?.auth?.currentUser;
        
        if (!currentUser) {
            // Guest user - check localStorage
            const favorites = getLocalStorageFavorites();
            return favorites.includes(productId);
        }
        
        // For logged-in users, use async version
        return null;
    } catch (error) {
        console.error('Error checking favorite (sync):', error);
        return false;
    }
}

// Update favorite icon state synchronously (for localStorage/guests - immediate update)
function updateFavoriteIconSync(productId) {
    // Find the favorite icon - it should have data-product-id attribute
    let icon = document.querySelector(`.favorite-icon[data-product-id="${productId}"]`);
    
    // If not found directly, try finding it within the product card
    if (!icon) {
        const card = document.querySelector(`.product-card[data-product-data*="${productId}"]`);
        if (card) {
            icon = card.querySelector('.favorite-icon');
        }
    }
    
    if (icon) {
        const isFav = isFavoriteSync(productId);
        if (isFav === true) {
            icon.classList.add('active');
        } else if (isFav === false) {
            icon.classList.remove('active');
        }
    }
}

// Update favorite icon state (async - checks both localStorage and Firestore)
async function updateFavoriteIcon(productId) {
    // Find the favorite icon - it should have data-product-id attribute
    let icon = document.querySelector(`.favorite-icon[data-product-id="${productId}"]`);
    
    // If not found directly, try finding it within the product card
    if (!icon) {
        const card = document.querySelector(`.product-card[data-product-data*="${productId}"]`);
        if (card) {
            icon = card.querySelector('.favorite-icon');
        }
    }
    
    if (icon) {
        const isFav = await isFavorite(productId);
        if (isFav) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    }
}

// Update all favorite icons on the page (async - checks Firestore)
// Safe to call on any page - only updates icon classes, doesn't manipulate product list
async function updateAllFavoriteIcons() {
    const icons = document.querySelectorAll('.favorite-icon');
    console.log(`🔍 updateAllFavoriteIcons: Found ${icons.length} favorite icons on page`);
    if (icons.length === 0) {
        // No icons to update - silently return (normal on pages without products)
        console.warn('⚠️ No favorite icons found on page. Make sure product cards include .favorite-icon elements.');
        return;
    }
    
    for (const icon of icons) {
        // First, try to get productId directly from the icon's data-product-id attribute
        let productId = icon.getAttribute('data-product-id');
        
        // If not found on icon, try to get from product card data
        if (!productId || productId.trim() === '') {
            const productCard = icon.closest('.product-card');
            if (productCard) {
                const productData = productCard.getAttribute('data-product-data');
                if (productData) {
                    try {
                        const product = JSON.parse(productData);
                        if (product.id && typeof product.id === 'string' && product.id.trim() !== '') {
                            productId = product.id;
                        }
                    } catch (error) {
                        console.error('Error parsing product data:', error);
                    }
                }
            }
        }
        
        // Only update if we have a valid productId
        if (productId && typeof productId === 'string' && productId.trim() !== '') {
            await updateFavoriteIcon(productId);
        } else {
            console.warn('⚠️ Skipping favorite icon update: missing or invalid productId. Icon:', icon);
        }
    }
}

// Render favorites page (async - loads from Firestore)
// IMPORTANT: This function should ONLY run on favorites.html
async function renderFavorites() {
    // PAGE GUARD: Only run on favorites.html
    if (!isFavoritesPage()) {
        // Silently return - this function should not run on other pages
        return;
    }
    
    // Get the favorites container specifically (not generic .products-grid)
    const container = document.querySelector('#favorites-container');
    
    if (!container) {
        console.error('Favorites container not found');
        return;
    }
    
    // Check if user is logged in
    const authModule = await import('./assets/js/auth_frontend.js');
    const { auth } = authModule;
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #d4af37;">
                <i class="fa-solid fa-user-lock" style="font-size: 3rem; color: #d4af37; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h2 style="color: #d4af37; margin-bottom: 1rem;">Please log in</h2>
                <p style="color: #d4af37;">You must be logged in to view your wishlist.</p>
            </div>
        `;
        return;
    }
    
    const favorites = await loadFavorites();
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #d4af37;">
                <i class="fa-solid fa-heart" style="font-size: 3rem; color: #d4af37; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h2 style="color: #d4af37; margin-bottom: 1rem;">No favorites yet</h2>
                <p style="color: #d4af37;">Start adding products to your favorites by clicking the heart icon on any product card.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    let renderedCount = 0;
    let skippedCount = 0;
    
    favorites.forEach((product, index) => {
        try {
            // Normalize product data to ensure all required fields are present
            const normalizedProduct = normalizeProductData(product);
            if (!normalizedProduct) {
                console.warn(`⚠️ Favorites: Skipping invalid product at index ${index}:`, product);
                skippedCount++;
                return;
            }
            
            // Validate required fields
            if (!normalizedProduct.id) {
                console.warn(`⚠️ Favorites: Product missing ID at index ${index}:`, normalizedProduct);
                skippedCount++;
                return;
            }
            
            // Use global getProductName function - NEVER use product.name directly
            const productName = window.getProductName ? window.getProductName(normalizedProduct) : (normalizedProduct.name_ar || normalizedProduct.name_en || normalizedProduct.name_he || normalizedProduct.name?.ar || normalizedProduct.name?.en || normalizedProduct.name || 'Unknown Product');
            const genderLabel = getGenderLabel(normalizedProduct.gender || 'unisex');
            
            // Ensure price is a number, not undefined
            const price = normalizedProduct.price || 0;
            const originalPrice = normalizedProduct.original_price || null;
            const currency = normalizedProduct.currency || '₪';
            // Match perfumes.html image extraction exactly: imageUrl || image || image_url
            const imageUrl = normalizedProduct.imageUrl || normalizedProduct.image || normalizedProduct.image_url || 'assets/images/products/placeholder.jpg';
            
            const productDataEscaped = JSON.stringify(normalizedProduct).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
            
            const card = `
                <div class="product-card" data-product-data='${productDataEscaped}'>
                    <div class="favorite-icon active" data-product-id="${normalizedProduct.id}">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <img src="${imageUrl}" alt="${productName}" class="product-image" onerror="this.src='assets/images/products/placeholder.jpg'">
                    <div class="product-info">
                        <h3 class="product-name" data-id="${normalizedProduct.id || ''}">${productName}</h3>
                        <p class="product-brand product-gender-label" data-gender="${normalizedProduct.gender || 'unisex'}">${genderLabel}</p>
                        <p class="product-price">
                            ${originalPrice && originalPrice > price ? `<span class="old-price">${originalPrice}${currency}</span>` : ''}
                            <span class="new-price">${price}${currency}</span>
                        </p>
                        <button class="add-to-cart" data-translate="btn-add-to-cart" data-id="${normalizedProduct.id || ''}" data-product="${JSON.stringify({
                            id: normalizedProduct.id,
                            name: productName,
                            brand: normalizedProduct.brand || '',
                            price: price || 0,
                            image: imageUrl || 'assets/images/products/placeholder.jpg',
                            category: normalizedProduct.category || ''
                        }).replace(/"/g, '&quot;')}" onclick="window.addToCart(JSON.parse(this.getAttribute('data-product')))">Add to Cart</button>
                    </div>
                </div>
            `;
            container.innerHTML += card;
            renderedCount++;
        } catch (error) {
            console.error(`❌ Favorites: Error rendering product at index ${index}:`, error);
            console.error('Product data:', product);
            skippedCount++;
        }
    });
    
    if (renderedCount > 0) {
        console.log(`✅ Favorites: Rendered ${renderedCount} products${skippedCount > 0 ? `, skipped ${skippedCount} invalid products` : ''}`);
    } else if (skippedCount > 0) {
        console.error(`❌ Favorites: All ${skippedCount} products failed to render`);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #d4af37;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: #d4af37; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h2 style="color: #d4af37; margin-bottom: 1rem;">Error loading favorites</h2>
                <p style="color: #d4af37;">There was an error displaying your favorites. Please refresh the page.</p>
            </div>
        `;
    }
}

// Global click handler for favorite icons (supports both localStorage and Firestore)
// This handler is registered once and handles all .favorite-icon clicks across all pages
if (!window.__favoritesClickHandlerRegistered) {
    window.__favoritesClickHandlerRegistered = true;
    
    document.addEventListener('click', async (e) => {
        // Check if click is on favorite icon or its child (the heart icon)
        const icon = e.target.closest('.favorite-icon');
        if (!icon) return;
        
        console.log('❤️ Favorite icon clicked!', icon);
        
        // Prevent default if it's a button
        e.preventDefault();
        e.stopPropagation();
        
        // Get product ID from data-product-id attribute
        const productId = icon.getAttribute('data-product-id');
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            console.warn('⚠️ Favorite icon clicked but data-product-id is missing, empty, or invalid. Element:', icon);
            return;
        }
        
        // Get product data from parent card
        const productCard = icon.closest('.product-card');
        let productData = null;
        
        if (productCard) {
            const dataAttr = productCard.getAttribute('data-product-data');
            if (dataAttr) {
                try {
                    productData = JSON.parse(dataAttr);
                } catch (error) {
                    console.error('Error parsing product data from card:', error);
                }
            }
        }
        
        // Call toggleFavorite with product ID and data
        await toggleFavorite(productId, productData);
    });
    
    console.log('✅ Global favorites click handler registered');
}

// Make functions globally available
window.loadFavorites = loadFavorites;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.updateFavoriteIcon = updateFavoriteIcon;
window.updateFavoriteIconSync = updateFavoriteIconSync;
window.updateAllFavoriteIcons = updateAllFavoriteIcons;
window.renderFavorites = renderFavorites;
window.normalizeProductData = normalizeProductData;

