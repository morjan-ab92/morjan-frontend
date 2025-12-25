/* ===== CHECKOUT MANAGEMENT - checkout.js ===== */

// Use the same cart source as cart.html - get cartItems from cart.js
// This ensures checkout.html uses the exact same cart data as cart.html
function getCartItems() {
    // Use the global cartItems array from cart.js (same source as cart.html)
    if (typeof window.cartItems !== 'undefined') {
        return window.cartItems || [];
    }
    // If cart.js hasn't loaded yet, return empty array
    // The cart will be loaded when cart.js initializes
    return [];
}

// Get current shipping cost based on delivery method and area
function getShippingCost() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
    
    if (deliveryMethod === 'pickup') {
        return 0;
    }
    
    if (deliveryMethod === 'delivery') {
        const areaSelect = document.getElementById('deliveryArea');
        if (areaSelect && areaSelect.value) {
            const selectedOption = areaSelect.options[areaSelect.selectedIndex];
            const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            return price;
        }
        // Default shipping if no area selected yet
        return 25.00;
    }
    
    // Default shipping
    return 25.00;
}

// Coupon state
let appliedCoupon = null; // { code, discountAmount }

// Calculate cart totals
function calculateTotals(cartItems, shippingOverride = null) {
    const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
    }, 0);
    
    const shipping = shippingOverride !== null ? shippingOverride : getShippingCost();
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = Math.max(0, subtotal + shipping - discount);
    
    return { subtotal, shipping, discount, total };
}

// Format price with ₪ symbol
function formatPrice(price) {
    return `₪${parseFloat(price).toFixed(2)}`;
}

// Render order summary
function renderOrderSummary() {
    // Use the same cartItems array from cart.js (same source as cart.html)
    const cartItems = getCartItems();
    const orderSummary = document.getElementById('orderSummary');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    
    if (!orderSummary) return;
    
    if (cartItems.length === 0) {
        orderSummary.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #d4af37;">
                <i class="fa-solid fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Your cart is empty</h3>
                <p style="color: var(--text-secondary); margin: 1rem 0;">Please add items to your cart before checkout.</p>
                <a href="cart.html" style="display: inline-block; margin-top: 1rem; padding: 12px 24px; background: linear-gradient(90deg, #d4af37, #f5d76e); color: #000; font-weight: bold; border-radius: 8px; text-decoration: none;">Go to Cart</a>
            </div>
        `;
        
        const shipping = getShippingCost();
        if (subtotalEl) subtotalEl.textContent = formatPrice(0);
        if (shippingEl) shippingEl.textContent = formatPrice(shipping);
        if (totalEl) totalEl.textContent = formatPrice(shipping);
        
        return;
    }
    
    // Render cart items - matching cart.js structure exactly
    // Use ONLY: item.name, item.brand, item.price, item.quantity, item.image
    orderSummary.innerHTML = '';
    
    cartItems.forEach(item => {
        // Use exact fields from Firestore cart (same as cart.js)
        // Firestore cart uses imageUrl, with fallback for backward compatibility
        const imageSrc = item.imageUrl || item.image || item.image_url || 'assets/images/products/placeholder.jpg';
        const productName = item.name || 'Product';
        const productBrand = item.brand || '';
        const productPrice = parseFloat(item.price) || 0;
        const productQty = parseInt(item.quantity) || 1;
        const itemTotal = productPrice * productQty;
        
        // Escape HTML to prevent XSS
        const escapedName = productName.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const escapedBrand = productBrand.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        
        orderSummary.innerHTML += `
            <div class="order-item">
                <img class="order-item-image" src="${imageSrc}" alt="${escapedName}" onerror="this.src='assets/images/products/placeholder.jpg'">
                
                <div class="order-item-info">
                    <div class="order-item-name">${escapedName}</div>
                    ${productBrand ? `<div class="order-item-brand">${escapedBrand}</div>` : ''}
                    <div class="order-item-qty-price">₪${productPrice.toFixed(2)} x ${productQty}</div>
                </div>
                
                <div class="order-item-total">₪${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    // Calculate and display totals
    const { subtotal, shipping, discount, total } = calculateTotals(cartItems);
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(total);
    
    // Update discount display
    const discountRow = document.getElementById('discountRow');
    const discountEl = document.getElementById('discount');
    if (discountRow && discountEl) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-${formatPrice(discount)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
}

// Update order summary totals (called when shipping changes)
function updateOrderSummary() {
    // Use the same cartItems array from cart.js (same source as cart.html)
    const cartItems = getCartItems();
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    
    if (cartItems.length === 0) return;
    
    // Calculate and display totals
    const { subtotal, shipping, discount, total } = calculateTotals(cartItems);
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(total);
    
    // Update discount display
    const discountRow = document.getElementById('discountRow');
    const discountEl = document.getElementById('discount');
    if (discountRow && discountEl) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-${formatPrice(discount)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
}

// Validate form
function validateForm() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
    const deliveryArea = document.getElementById('deliveryArea')?.value;
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const street = document.getElementById('street')?.value.trim();
    const houseNumber = document.getElementById('houseNumber')?.value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    const errors = [];
    
    if (!deliveryMethod) {
        errors.push('Delivery method is required');
    }
    
    // If delivery is selected, require delivery area
    if (deliveryMethod === 'delivery' && !deliveryArea) {
        errors.push('Please select a delivery area');
    }
    
    // If delivery is selected, require shipping information
    if (deliveryMethod === 'delivery') {
        if (!firstName) {
            errors.push('First name is required');
        }
        
        if (!lastName) {
            errors.push('Last name is required');
        }
        
        if (!email) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!phone) {
            errors.push('Phone number is required');
        }
        
        if (!city) {
            errors.push('City is required');
        }
        
        if (!street) {
            errors.push('Street is required');
        }
        
        if (!houseNumber) {
            errors.push('House number is required');
        }
    }
    
    if (!paymentMethod) {
        errors.push('Payment method is required');
    }
    
    // Check if cart is empty - use same cart source as cart.html
    const cartItems = getCartItems();
    if (!cartItems || cartItems.length === 0) {
        errors.push('Your cart is empty');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    } else {
        alert(message);
    }
}

// Show success message
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('show');
    } else {
        alert(message);
    }
}

// Get current site language
function getCurrentLanguage() {
    // Try multiple sources for language detection
    if (typeof currentLanguage !== 'undefined' && currentLanguage) {
        return currentLanguage;
    }
    const langFromStorage = localStorage.getItem('preferred_lang') || 
                           localStorage.getItem('language') || 
                           'ar';
    return langFromStorage;
}

// Generate WhatsApp message based on language and payment method
function generateWhatsAppMessage(orderNumber, total, paymentMethod, language) {
    // Normalize payment method values
    const isBit = paymentMethod.toLowerCase() === 'bit';
    const isCredit = paymentMethod.toLowerCase() === 'credit';
    
    // Get payment method text in the correct language
    let paymentMethodText = '';
    if (isBit) {
        paymentMethodText = 'BIT';
    } else if (isCredit) {
        if (language === 'ar') {
            paymentMethodText = 'بطاقة ائتمان';
        } else if (language === 'he') {
            paymentMethodText = 'אשראי';
        } else {
            paymentMethodText = 'Credit Card';
        }
    }
    
    // Format total amount
    const formattedTotal = total.toFixed(2);
    
    // Generate message based on language
    let message = '';
    
    if (language === 'ar') {
        message = `مرحبًا،
قمت بإنشاء طلب رقم #${orderNumber}
المجموع: ${formattedTotal} ₪
أرغب بالدفع عبر ${paymentMethodText}
شكرًا لكم`;
    } else if (language === 'he') {
        message = `שלום,
ביצעתי הזמנה מספר #${orderNumber}
סכום לתשלום: ${formattedTotal} ₪
ברצוני לשלם באמצעות ${paymentMethodText}
תודה`;
    } else {
        // Default to English
        message = `Hello,
I have placed an order #${orderNumber}
Total amount: ${formattedTotal} ₪
I would like to pay via ${paymentMethodText}
Thank you`;
    }
    
    return message;
}

// Open WhatsApp with pre-filled message
function openWhatsAppToShop(orderNumber, total, paymentMethod) {
    // Shop phone number (hard-coded from index.html)
    const shopPhone = '972503701179'; // +972-50-3701179 without + and dashes (wa.me format: digits only)
    
    // Get current language
    const currentLang = getCurrentLanguage();
    
    // Generate message
    const message = generateWhatsAppMessage(orderNumber, total, paymentMethod, currentLang);
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    console.log('📱 WhatsApp opened with message:', message);
}

// Apply coupon
async function applyCoupon() {
    const couponCodeInput = document.getElementById('couponCode');
    const applyBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');
    const couponApplied = document.getElementById('couponApplied');
    
    if (!couponCodeInput || !applyBtn) return;
    
    const couponCode = couponCodeInput.value.trim();
    
    if (!couponCode) {
        const errorMsg = (typeof window.getTranslation === 'function') 
            ? window.getTranslation('checkout.coupon.empty') 
            : 'Please enter a coupon code';
        showCouponMessage(errorMsg, 'error');
        return;
    }
    
    // Prevent applying multiple coupons
    if (appliedCoupon) {
        const errorMsg = (typeof window.getTranslation === 'function')
            ? window.getTranslation('checkout.coupon.error')
            : 'A coupon is already applied. Please remove it first.';
        showCouponMessage(errorMsg, 'error');
        return;
    }
    
    // Disable button during request
    applyBtn.disabled = true;
    const originalText = applyBtn.querySelector('span')?.textContent || ((typeof window.getTranslation === 'function') ? window.getTranslation('checkout.coupon.apply') : 'Apply');
    const applyingText = (typeof window.getTranslation === 'function') 
        ? window.getTranslation('checkout.coupon.apply') + '...'
        : 'Applying...';
    applyBtn.querySelector('span').textContent = applyingText;
    
    try {
        // Get cart items to calculate subtotal
        const cartItems = getCartItems();
        const { subtotal } = calculateTotals(cartItems);
        
        // Get user ID if logged in
        let userId = null;
        try {
            const { auth } = await import('./firebase-frontend-config.js');
            const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js');
            const currentUser = auth.currentUser;
            if (currentUser) {
                userId = currentUser.uid;
            }
        } catch (e) {
            console.warn('Could not get user ID:', e);
        }
        
        // Call backend API
        const response = await fetch('/apply-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                couponCode: couponCode,
                userId: userId,
                cartTotal: subtotal
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store applied coupon
            appliedCoupon = {
                code: data.appliedCouponCode,
                discountAmount: data.discountAmount
            };
            
            // Update UI
            couponCodeInput.value = '';
            showCouponMessage(data.message || 'Coupon applied successfully!', 'success');
            
            // Show applied coupon badge
            if (couponApplied) {
                const appliedCodeSpan = document.getElementById('appliedCouponCode');
                if (appliedCodeSpan) {
                    appliedCodeSpan.textContent = data.appliedCouponCode;
                }
                couponApplied.style.display = 'block';
            }
            
            // Update totals
            updateOrderSummary();
            
            // Apply translations after UI update
            if (typeof window.translatePage === 'function') {
                window.translatePage();
            }
        } else {
            // Use backend message if available, otherwise use translation
            const errorMsg = data.message || ((typeof window.getTranslation === 'function')
                ? window.getTranslation('checkout.coupon.error')
                : 'Invalid coupon code');
            showCouponMessage(errorMsg, 'error');
        }
        
    } catch (error) {
        console.error('Error applying coupon:', error);
        const errorMsg = (typeof window.getTranslation === 'function')
            ? window.getTranslation('checkout.coupon.error')
            : 'Error applying coupon. Please try again.';
        showCouponMessage(errorMsg, 'error');
    } finally {
        // Re-enable button
        applyBtn.disabled = false;
        const applyText = (typeof window.getTranslation === 'function')
            ? window.getTranslation('checkout.coupon.apply')
            : 'Apply';
        if (applyBtn.querySelector('span')) {
            applyBtn.querySelector('span').textContent = applyText;
        }
        
        // Apply translations after button text update
        if (typeof window.translatePage === 'function') {
            window.translatePage();
        }
    }
}

// Remove coupon
function removeCoupon() {
    appliedCoupon = null;
    
    const couponMessage = document.getElementById('couponMessage');
    const couponApplied = document.getElementById('couponApplied');
    const couponCodeInput = document.getElementById('couponCode');
    
    if (couponMessage) {
        couponMessage.style.display = 'none';
        couponMessage.className = '';
    }
    
    if (couponApplied) {
        couponApplied.style.display = 'none';
    }
    
    if (couponCodeInput) {
        couponCodeInput.value = '';
    }
    
    // Update totals
    updateOrderSummary();
    
    // Apply translations after UI update
    if (typeof window.translatePage === 'function') {
        window.translatePage();
    }
}

// Show coupon message
function showCouponMessage(message, type) {
    const couponMessage = document.getElementById('couponMessage');
    if (!couponMessage) return;
    
    couponMessage.textContent = message;
    couponMessage.className = type;
    couponMessage.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            couponMessage.style.display = 'none';
        }, 3000);
    }
}

// Place order
async function placeOrder() {
    console.log('🛒 Place order clicked');
    
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
        showError(validation.errors.join(', '));
        return;
    }
    
    // Get form data
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
    const deliveryArea = document.getElementById('deliveryArea')?.value || '';
    const firstName = document.getElementById('firstName')?.value.trim() || '';
    const lastName = document.getElementById('lastName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const city = document.getElementById('city')?.value.trim() || '';
    const street = document.getElementById('street')?.value.trim() || '';
    const houseNumber = document.getElementById('houseNumber')?.value.trim() || '';
    const notes = document.getElementById('notes')?.value.trim() || '';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Get cart items - use same cart source as cart.html
    const cartItems = getCartItems();
    
    // Calculate totals (use current shipping cost)
    const { subtotal, shipping, discount, total } = calculateTotals(cartItems);
    
    // Get username from localStorage
    const userName = localStorage.getItem('display_name') || localStorage.getItem('username') || 'Guest';
    
    // Check if payment method requires WhatsApp redirection (BIT or Credit Card)
    const paymentMethodLower = paymentMethod.toLowerCase();
    const requiresWhatsApp = paymentMethodLower === 'bit' || paymentMethodLower === 'credit';
    
    // Determine order status based on payment method
    const orderStatus = requiresWhatsApp ? 'pending_whatsapp_payment' : 'pending';
    
    // Create order object
    const orderData = {
        userName: userName,
        items: cartItems,
        subtotal: subtotal,
        shipping: shipping,
        discount: discount || 0,
        discountCode: appliedCoupon ? appliedCoupon.code : null,
        total: total,
        deliveryMethod: deliveryMethod,
        deliveryArea: deliveryArea,
        paymentMethod: paymentMethod,
        status: orderStatus,
        customerInfo: {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`.trim() || 'Guest',
            email: email,
            phone: phone,
            city: city,
            street: street,
            houseNumber: houseNumber,
            address: `${street} ${houseNumber}`.trim() || '',
            notes: notes
        },
        orderDate: new Date().toISOString(),
        orderId: 'ORD-' + Date.now()
    };
    
    console.log('📦 Order data:', orderData);
    
    // Save order to localStorage (for demo purposes)
    // In production, this would be sent to a server
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('✅ Order saved to localStorage');
        
        // Save order to Firestore as well
        try {
            const { db } = await import('./firebase-frontend-config.js');
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js');
            
            const ordersRef = collection(db, 'orders');
            await addDoc(ordersRef, orderData);
            console.log('✅ Order saved to Firestore');
        } catch (firestoreError) {
            console.error('❌ Error saving order to Firestore:', firestoreError);
            // Continue even if Firestore save fails - order is still in localStorage
        }
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        
        // Show success message
        showSuccess('Order placed successfully! Order ID: ' + orderData.orderId);
        
        // Open WhatsApp if payment method is BIT or Credit Card
        if (requiresWhatsApp) {
            console.log('📱 Opening WhatsApp for payment method:', paymentMethod);
            openWhatsAppToShop(orderData.orderId, total, paymentMethod);
        }
        
        // Redirect to success page or show success message
        setTimeout(() => {
            // Optionally redirect to success page
            // window.location.href = 'success.html';
            
            // Or show success and redirect to home
            alert('Order placed successfully! Order ID: ' + orderData.orderId);
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error saving order:', error);
        showError('Error placing order. Please try again.');
    }
}

// Handle delivery method changes
function handleDeliveryMethodChange() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
    const shippingInfoSection = document.getElementById('shippingInfoSection');
    const deliveryAreaSection = document.getElementById('deliveryAreaSection');
    const deliveryAreaSelect = document.getElementById('deliveryArea');
    
    if (deliveryMethod === 'pickup') {
        // Hide shipping information section
        if (shippingInfoSection) {
            shippingInfoSection.classList.add('hidden');
            // Make shipping fields not required
            const shippingInputs = shippingInfoSection.querySelectorAll('input[required], textarea[required]');
            shippingInputs.forEach(input => {
                input.removeAttribute('required');
            });
        }
        // Hide delivery area selection
        if (deliveryAreaSection) {
            deliveryAreaSection.classList.add('hidden');
        }
        if (deliveryAreaSelect) {
            deliveryAreaSelect.removeAttribute('required');
        }
        // Set shipping to 0
        updateOrderSummary();
    } else if (deliveryMethod === 'delivery') {
        // Show shipping information section
        if (shippingInfoSection) {
            shippingInfoSection.classList.remove('hidden');
            // Make shipping fields required again
            const shippingInputs = shippingInfoSection.querySelectorAll('input, textarea');
            shippingInputs.forEach(input => {
                if (input.id !== 'notes') {
                    input.setAttribute('required', 'required');
                }
            });
        }
        // Show delivery area selection
        if (deliveryAreaSection) {
            deliveryAreaSection.classList.remove('hidden');
        }
        if (deliveryAreaSelect) {
            deliveryAreaSelect.setAttribute('required', 'required');
        }
        // Update shipping based on selected area
        updateOrderSummary();
    }
}

// Initialize checkout page - wait for auth state like cart.html does
async function initializeCheckout() {
    console.log('🛒 Initializing checkout page');
    
    // Import Firebase modules
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js');
    const { auth } = await import('./firebase-frontend-config.js');
    
    // Wait for Firebase authentication to be ready (same pattern as cart.html)
    return new Promise((resolve) => {
        let resolved = false;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (resolved) return;
            
            console.log('🔐 Auth state changed on checkout page:', user ? 'User logged in' : 'User logged out');
            
            try {
                // Load cart from Firestore (same source as cart.html)
                if (typeof window.loadCart === 'function') {
                    await window.loadCart();
                    console.log('✅ Cart loaded from Firestore for checkout:', window.cartItems?.length || 0, 'items');
                } else {
                    console.error('❌ loadCart function not found');
                }
                
                // Load and render cart using the same cartItems array from cart.js
                renderOrderSummary();
                
                // Apply translations after rendering
                if (typeof window.translatePage === 'function') {
                    window.translatePage();
                }
                
                // Setup delivery method change handlers
                const deliveryMethodInputs = document.querySelectorAll('input[name="deliveryMethod"]');
                deliveryMethodInputs.forEach(input => {
                    input.addEventListener('change', handleDeliveryMethodChange);
                });
                
                // Setup delivery area change handler
                const deliveryAreaSelect = document.getElementById('deliveryArea');
                if (deliveryAreaSelect) {
                    deliveryAreaSelect.addEventListener('change', updateOrderSummary);
                }
                
                // Initialize delivery method state
                handleDeliveryMethodChange();
                
                // Setup form validation on input
                const formInputs = document.querySelectorAll('#checkoutForm input[required], #checkoutForm textarea');
                formInputs.forEach(input => {
                    input.addEventListener('blur', () => {
                        validateForm();
                    });
                });
                
                // Setup place order button
                const placeOrderBtn = document.getElementById('placeOrderBtn');
                if (placeOrderBtn) {
                    placeOrderBtn.addEventListener('click', placeOrder);
                    
                    // Enable button if cart has items - use same cart source as cart.html
                    const cartItems = getCartItems();
                    if (cartItems.length > 0) {
                        placeOrderBtn.disabled = false;
                    }
                }
                
                // Update button state on form change
                const form = document.getElementById('checkoutForm');
                if (form) {
                    form.addEventListener('input', () => {
                        const validation = validateForm();
                        if (placeOrderBtn) {
                            placeOrderBtn.disabled = !validation.isValid;
                        }
                    });
                }
                
                console.log('✅ Checkout page initialized successfully');
                
                resolved = true;
                unsubscribe();
                resolve();
            } catch (error) {
                console.error('❌ Error initializing checkout:', error);
                // Still render empty cart state
                renderOrderSummary();
                resolved = true;
                unsubscribe();
                resolve();
            }
        });
        
        // Timeout after 5 seconds to prevent hanging
        setTimeout(() => {
            if (!resolved) {
                console.warn('⚠️ Auth state check timeout - proceeding with empty cart');
                unsubscribe();
                renderOrderSummary();
                resolve();
            }
        }, 5000);
    });
}

// Make functions globally available
// Note: loadCart is provided by cart.js - do not override it
window.calculateTotals = calculateTotals;
window.getShippingCost = getShippingCost;
window.formatPrice = formatPrice;
window.renderOrderSummary = renderOrderSummary;
window.updateOrderSummary = updateOrderSummary;
window.validateForm = validateForm;
window.placeOrder = placeOrder;
window.initializeCheckout = initializeCheckout;
window.handleDeliveryMethodChange = handleDeliveryMethodChange;
window.applyCoupon = applyCoupon;
window.removeCoupon = removeCoupon;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛒 Checkout.js initialized');
    await initializeCheckout();
});

