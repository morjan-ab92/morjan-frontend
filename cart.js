/* ===== CART MANAGEMENT - cart.js ===== */
/* NOTE: Cart is now stored ONLY in Firestore for logged-in users */
/* Guest users cannot have a cart - login is required */

// Global cart items array (loaded from Firestore)
let cartItems = [];

// Helper function to format prices with ₪ symbol
function formatPrice(price) {
    return `₪${parseFloat(price).toFixed(2)}`;
}

// Load cart from Firestore (async)
async function loadCart() {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, getFirestoreCart } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            cartItems = [];
            window.cartItems = cartItems; // Keep window.cartItems in sync
            console.log('📝 User not logged in - empty cart (login required)');
            return [];
        }
        
        cartItems = await getFirestoreCart();
        window.cartItems = cartItems; // Keep window.cartItems in sync (same reference for checkout.js)
        console.log('✅ Cart loaded from Firestore:', cartItems.length, 'items');
        return cartItems;
    } catch (error) {
        console.error('❌ Error loading cart from Firestore:', error);
        cartItems = [];
        window.cartItems = cartItems; // Keep window.cartItems in sync
        return [];
    }
}

// Calculate cart totals
function calculateCartTotals() {
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
    }, 0);
    
    const shipping = 20.00; // Fixed shipping cost (used in checkout)
    // Total calculation will be adjusted in updateCartTotals() based on whether shipping element exists
    const total = subtotal + shipping;
    
    return { subtotal, shipping, total };
}

// Update cart totals display
// NOTE: Does NOT call renderCart() - only updates totals
// NOTE: Shipping row removed from cart.html, so shipping element may not exist
// If shipping element doesn't exist (cart page), total = subtotal (no shipping)
// If shipping element exists (checkout page), total = subtotal + shipping
function updateCartTotals() {
    const { subtotal, shipping } = calculateCartTotals();
    
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping'); // May not exist on cart page
    const totalEl = document.querySelector('.cart-total');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) {
        // Shipping element exists (checkout page) - show shipping and include in total
        shippingEl.textContent = formatPrice(shipping);
        if (totalEl) {
            const totalSpan = totalEl.querySelector('span') || totalEl;
            totalSpan.textContent = formatPrice(subtotal + shipping);
        }
    } else {
        // Shipping element doesn't exist (cart page) - total equals subtotal only
        if (totalEl) {
            const totalSpan = totalEl.querySelector('span') || totalEl;
            totalSpan.textContent = formatPrice(subtotal);
        }
    }
}

// Increase quantity by 1 (Firestore)
async function increaseQuantity(itemId) {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, updateFirestoreCartItem } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            alert('You must log in first to modify your cart.');
            return;
        }
        
        // Reload cart to get current quantity
        await loadCart();
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
            const currentQuantity = parseInt(item.quantity) || 1;
            const newQuantity = Math.min(currentQuantity + 1, 10); // Max 10
            await updateFirestoreCartItem(itemId, newQuantity);
            await loadCart(); // Reload after update
            renderCart();
            updateCartTotals();
            if (typeof window.updateCartBadge === 'function') {
                await window.updateCartBadge();
            }
            console.log('✅ Quantity increased for item:', itemId, 'New quantity:', newQuantity);
        }
    } catch (error) {
        console.error('❌ Error increasing quantity:', error);
        alert('Error updating quantity. Please try again.');
    }
}

// Decrease quantity by 1 (never below 1) - Firestore
async function decreaseQuantity(itemId) {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, updateFirestoreCartItem } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            alert('You must log in first to modify your cart.');
            return;
        }
        
        // Reload cart to get current quantity
        await loadCart();
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
            const currentQuantity = parseInt(item.quantity) || 1;
            if (currentQuantity > 1) {
                const newQuantity = currentQuantity - 1;
                await updateFirestoreCartItem(itemId, newQuantity);
                await loadCart(); // Reload after update
                renderCart();
                updateCartTotals();
                if (typeof window.updateCartBadge === 'function') {
                    await window.updateCartBadge();
                }
                console.log('✅ Quantity decreased for item:', itemId, 'New quantity:', newQuantity);
            } else {
                console.log('⚠️ Quantity is already at minimum (1)');
            }
        }
    } catch (error) {
        console.error('❌ Error decreasing quantity:', error);
        alert('Error updating quantity. Please try again.');
    }
}

// Remove item from cart (Firestore)
async function removeFromCart(itemId) {
    try {
        const authModule = await import('./assets/js/auth_frontend.js');
        const { auth, removeFirestoreCartItem } = authModule;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            alert('You must log in first to modify your cart.');
            return;
        }
        
        await removeFirestoreCartItem(itemId);
        await loadCart(); // Reload after removal
        renderCart();
        updateCartTotals();
        if (typeof window.updateCartBadge === 'function') {
            await window.updateCartBadge();
        }
        console.log('✅ Item removed from cart:', itemId);
    } catch (error) {
        console.error('❌ Error removing item:', error);
        alert('Error removing item. Please try again.');
    }
}

// Render cart items in the main cart page
// NOTE: This function should ONLY be called after auth state is known (from onAuthStateChanged)
// It does NOT check auth state itself - assumes it's already been verified
// It does NOT call loadCart() - assumes cartItems is already loaded
function renderCart() {
    const cartContainer = document.querySelector('.cart-items-list') || document.getElementById('cart-items');
    if (!cartContainer) return;
    
    // Use existing cartItems array (must be loaded separately via loadCart())
    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fa-regular fa-bag-shopping"></i>
                <h3 data-translate="cart.empty_title">Your cart is empty</h3>
                <p data-translate="cart.empty_message" style="color: var(--text-secondary); margin-bottom: 1rem;">
                    Looks like you haven't added any items to your cart yet.
                </p>
                <a href="index.html" class="continue-btn" data-translate="cart.start_shopping">Continue Shopping</a>
            </div>
        `;
        updateCartTotals();
        return;
    }
    
    // Render cart items
    const cartHTML = cartItems.map(item => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = price * quantity;
        const imageUrl = item.image || item.image_url || 'assets/images/products/placeholder.jpg';
        // Use global getProductName function - NEVER use item.name directly
        const itemName = (window.getProductName ? window.getProductName(item) : (item.name || 'Product')).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${imageUrl}" alt="${itemName}" onerror="this.src='assets/images/products/placeholder.jpg'">
                <div class="cart-details">
                    <h3>${itemName}</h3>
                    <div class="cart-controls">
                        <button class="qty-btn" onclick="decreaseQuantity('${item.id}')" aria-label="Decrease quantity">-</button>
                        <span class="qty">${quantity}</span>
                        <button class="qty-btn" onclick="increaseQuantity('${item.id}')" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                <div class="cart-prices">
                    <span class="cart-price">${formatPrice(price)}</span>
                    <span class="cart-price">${formatPrice(itemTotal)}</span>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')" title="Remove item" aria-label="Remove item">🗑️</button>
            </div>
        `;
    }).join('');
    
    cartContainer.innerHTML = cartHTML;
    updateCartTotals();
}


// Make functions globally available
window.loadCart = loadCart;
window.renderCart = renderCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromCart = removeFromCart;
// Override any proceedToCheckout from app.js - this one goes to checkout.html
// Assign after DOM is ready to ensure it overrides app.js (which loads with defer)
const proceedToCheckoutFunction = async function() {
    console.log('🛒 proceedToCheckout() called from cart.js');
    
    // Check if user is logged in
    const authModule = await import('./assets/js/auth_frontend.js');
    const { auth } = authModule;
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        alert('You must log in first to proceed to checkout.');
        return;
    }
    
    // Load cart to check if it's empty
    await loadCart();
    
    if (cartItems.length === 0) {
        alert('Your cart is empty. Please add items before checkout.');
        return;
    }
    
    // Redirect to checkout page - IMPORTANT: This must go to checkout.html, not cart.html
    console.log('✅ Redirecting to checkout.html');
    window.location.href = 'checkout.html';
};

// Assign immediately, then reassign after DOM ready to ensure it overrides app.js
window.proceedToCheckout = proceedToCheckoutFunction;

// Reassign after DOM is ready to ensure it overrides app.js (which has defer attribute)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure app.js has executed
        setTimeout(() => {
            window.proceedToCheckout = proceedToCheckoutFunction;
            console.log('✅ proceedToCheckout assigned from cart.js (overriding app.js)');
        }, 100);
    });
} else {
    // DOM already loaded, assign after short delay
    setTimeout(() => {
        window.proceedToCheckout = proceedToCheckoutFunction;
        console.log('✅ proceedToCheckout assigned from cart.js (overriding app.js)');
    }, 100);
}
window.formatPrice = formatPrice;
window.updateCartTotals = updateCartTotals;
window.cartItems = cartItems; // Expose for debugging

// Initialize cart when DOM is ready
// NOTE: Cart rendering is handled by cart.html's loadCartItems() which waits for onAuthStateChanged
// We don't call loadCart() or renderCart() here to avoid race conditions
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Cart.js initialized - waiting for auth state from cart.html');
    // Cart will be loaded and rendered by cart.html's loadCartItems() function
    // which properly waits for onAuthStateChanged
});

