/* ===== USER MENU - Shared functionality for all customer pages ===== */
/* This file provides unified user menu behavior across all customer pages */
/* Source of truth: checkout.html user menu implementation */

// CRITICAL: Define toggleUserDrawer IMMEDIATELY at script load time (not in DOMContentLoaded)
// This ensures onclick="window.toggleUserDrawer()" works in HTML
(function() {
    'use strict';
    
    // Attach to window immediately - must be available before any onclick handlers fire
    window.toggleUserDrawer = function toggleUserDrawer() {
        console.log('🔵 toggleUserDrawer called');
        
        const drawer = document.getElementById("user-drawer");
        const overlay = document.getElementById("user-drawer-overlay");
        
        console.log('🔵 Drawer element:', drawer);
        console.log('🔵 Overlay element:', overlay);
        
        if (!drawer) {
            console.error('❌ user-drawer element not found');
            return;
        }
        
        if (!overlay) {
            console.error('❌ user-drawer-overlay element not found');
            return;
        }
        
        const isOpening = !drawer.classList.contains("open");
        console.log('🔵 Is opening?', isOpening);
        console.log('🔵 Drawer classes before:', drawer.className);
        console.log('🔵 Overlay classes before:', overlay.className);
        
        // Toggle classes - MUST match CSS exactly: "open" and "active"
        drawer.classList.toggle("open");
        overlay.classList.toggle("active");
        
        // Update aria-expanded on menu button for accessibility
        const menuButton = document.querySelector('.menu-toggle');
        if (menuButton) {
            const isOpen = drawer.classList.contains("open");
            menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        
        console.log('🔵 Drawer classes after:', drawer.className);
        console.log('🔵 Overlay classes after:', overlay.className);
        console.log('🔵 Drawer has "open"?', drawer.classList.contains("open"));
        console.log('🔵 Overlay has "active"?', overlay.classList.contains("active"));
        
        // Force reflow to ensure CSS applies
        void drawer.offsetHeight;
        void overlay.offsetHeight;
        
        // Check computed styles to verify CSS is applying
        const computedStyle = window.getComputedStyle(drawer);
        const transform = computedStyle.transform;
        const left = computedStyle.left;
        const right = computedStyle.right;
        const zIndex = computedStyle.zIndex;
        const position = computedStyle.position;
        const visibility = computedStyle.visibility;
        const opacity = computedStyle.opacity;
        
        console.log('🔵 Computed styles:', {
            transform: transform,
            left: left,
            right: right,
            zIndex: zIndex,
            position: position,
            visibility: visibility,
            opacity: opacity
        });
        
        // Prevent body scroll when drawer is open
        if (drawer.classList.contains("open")) {
            document.body.style.overflow = "hidden";
            console.log('✅ Drawer opened - transform should be translateX(0)');
            console.log('🔵 Actual transform:', transform);
            if (transform === 'none' || transform.includes('translateX(0px)') || transform.includes('matrix(1, 0, 0, 1, 0, 0)')) {
                console.log('✅ Transform is correct - drawer should be visible');
            } else {
                console.error('❌ Transform is NOT correct! Expected translateX(0) but got:', transform);
            }
        } else {
            document.body.style.overflow = "";
            console.log('✅ Drawer closed - transform should be translateX(-100%)');
            console.log('🔵 Actual transform:', transform);
        }
    };
    
    // Verify it's attached
    console.log('✅ window.toggleUserDrawer defined:', typeof window.toggleUserDrawer);
})();

// Set user name in drawer with translated greeting
function updateDrawerUserName() {
    const nameEl = document.getElementById("drawer-user-name");
    if (!nameEl) return;

    const name =
        localStorage.getItem("userName") ||
        localStorage.getItem("displayName") ||
        localStorage.getItem("display_name") ||
        "";

    // Get current language
    const currentLang = document.documentElement.lang || 'en';
    const langCode = currentLang.split('-')[0];
    
    // Get translated greeting
    let greeting = "Hello"; // Default fallback
    if (typeof window.getTranslation === 'function') {
        greeting = window.getTranslation('greeting.hello') || greeting;
    } else {
        // Fallback greeting map
        const greetings = {
            'ar': 'مرحبا',
            'he': 'שלום',
            'en': 'Hello'
        };
        greeting = greetings[langCode] || greetings['en'];
    }
    
    // Display greeting with name if available, otherwise just greeting
    if (name) {
        nameEl.textContent = `${greeting}, ${name}`;
    } else {
        nameEl.textContent = greeting;
    }
}

// Global logout function for drawer - directly calls the real logout function
window.logout = async function logout() {
    console.log('🚪 ===== USER MENU LOGOUT BUTTON CLICKED =====');
    console.log('🔍 Calling real logout function (signOut) from auth_frontend.js...');
    
    try {
        // Close drawer immediately for better UX
        if (window.toggleUserDrawer) {
            const drawer = document.getElementById("user-drawer");
            if (drawer && drawer.classList.contains("open")) {
                console.log('✅ Closing drawer...');
                window.toggleUserDrawer();
            }
        }
        
        // Import and call the REAL logout function (signOut) from auth_frontend.js
        // This function:
        // - Signs out from Firebase (PRIMARY LOGOUT ACTION)
        // - Clears all localStorage items
        // - Clears sessionStorage
        // - Updates UI state
        // - Verifies logout succeeded
        // - Redirects ONLY after logout is complete and verified
        const { signOut } = await import('./auth_frontend.js');
        console.log('✅ signOut function imported from auth_frontend.js');
        
        // Call the real logout function immediately
        await signOut();
        
        console.log('✅ ===== USER MENU LOGOUT COMPLETED =====');
        console.log('✅ Real logout function (signOut) completed successfully');
        // Note: signOut() handles redirect, so we don't redirect here
        
    } catch (error) {
        console.error('❌ ===== USER MENU LOGOUT ERROR =====');
        console.error('❌ Error from auth_frontend.js signOut:', error);
        
        // Even if logout fails, try emergency cleanup
        console.log('⚠️ Attempting emergency cleanup from userMenu.js...');
        try {
            // Clear all possible auth-related localStorage items
            const emergencyKeys = [
                'access_token',
                'jwt_token',
                'jwt_role',
                'userRole',
                'user_info',
                'username',
                'userName',
                'displayName',
                'display_name',
                'email'
            ];
            
            emergencyKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            sessionStorage.clear();
            
            console.log('⚠️ Emergency cleanup: Cleared all localStorage and sessionStorage');
            
            // Update UI
            updateDrawerUserName();
            
            // Update auth UI if function exists
            if (typeof window.updateAuthUI === 'function') {
                window.updateAuthUI(null);
            } else if (typeof window.checkLoginState === 'function') {
                window.checkLoginState();
            }
            
            console.log('⚠️ Emergency cleanup: UI updated');
        } catch (clearError) {
            console.error('❌ Emergency cleanup also failed:', clearError);
        }
        
        // Show error to user
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('Error logging out. Please try again.', 'error');
        } else {
            alert('Error logging out. Please try again.');
        }
        
        // Don't redirect on error - let user see the error message
        // They can manually navigate or try again
        throw error;
    }
};

// Handle user icon click - redirects to login/profile (does NOT open drawer)
window.handleUserIconClick = async function handleUserIconClick() {
    console.log('👤 User icon clicked - checking login state');
    
    // Check localStorage for login indicators
    const hasToken = localStorage.getItem('jwt_token');
    const hasUserName = localStorage.getItem('userName') || 
                       localStorage.getItem('displayName') ||
                       localStorage.getItem('display_name');
    
    // Check Firebase auth state if available
    let isLoggedIn = false;
    try {
        if (window.firebase && window.firebase.auth) {
            const currentUser = window.firebase.auth.currentUser;
            if (currentUser) {
                isLoggedIn = true;
                console.log('✅ User is logged in (Firebase):', currentUser.email);
            }
        }
    } catch (error) {
        console.log('Firebase auth check failed:', error);
    }
    
    // If logged in via Firebase or has token/username, user is logged in
    if (isLoggedIn || hasToken || hasUserName) {
        console.log('✅ User is logged in - could redirect to profile if it exists');
        // For now, do nothing when logged in (could redirect to profile.html if it exists)
        return;
    }
    
    // User is not logged in - redirect to login page
    console.log('➡️ User not logged in - redirecting to login.html');
    window.location.href = 'login.html';
};

// Function to update drawer translations when language changes
function updateDrawerTranslations() {
    // Update user name with translated greeting
    updateDrawerUserName();
    
    // The translatePage() function will automatically update all elements with data-translate
    // including menu items and logout button, so we don't need to manually update them here
    // But we ensure the greeting is updated
}

// Initialize user menu when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Guard: Prevent duplicate user menu initialization
    if (window.__userMenuInitialized) {
        console.log('✅ User menu already initialized, skipping');
        return;
    }
    window.__userMenuInitialized = true;
    
    updateDrawerUserName();
    
    // Remove any drawer toggle from user icon button
    const userIconButton = document.getElementById("header-account-icon")?.closest('button');
    if (userIconButton) {
        // Remove toggleUserDrawer onclick if present
        const oldOnclick = userIconButton.getAttribute('onclick');
        if (oldOnclick && oldOnclick.includes('toggleUserDrawer')) {
            userIconButton.removeAttribute('onclick');
        }
        // Add login redirect handler
        userIconButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.handleUserIconClick();
        });
    }
    
    // Add drawer toggle to hamburger menu (menu-toggle)
    const hamburgerMenu = document.querySelector('.menu-toggle');
    if (hamburgerMenu) {
        // Remove any existing onclick
        hamburgerMenu.removeAttribute('onclick');
        // Add drawer toggle
        hamburgerMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.toggleUserDrawer();
        });
        hamburgerMenu.style.cursor = 'pointer';
    }
    
    // Listen for language changes and update drawer
    // Hook into the existing language switch system
    const originalSwitchLanguage = window.switchLanguage;
    if (originalSwitchLanguage) {
        window.switchLanguage = function(lang) {
            originalSwitchLanguage(lang);
            // Update drawer after language switch
            setTimeout(() => {
                updateDrawerTranslations();
            }, 100);
        };
    }
    
    // Also listen for translatePage calls to update drawer
    const originalTranslatePage = window.translatePage;
    if (originalTranslatePage) {
        window.translatePage = function() {
            originalTranslatePage();
            // Update drawer greeting after translation
            updateDrawerUserName();
        };
    }
});

// Make updateDrawerUserName available globally for auth_frontend.js to call
window.updateDrawerUserName = updateDrawerUserName;
// Make updateDrawerTranslations available globally
window.updateDrawerTranslations = updateDrawerTranslations;
