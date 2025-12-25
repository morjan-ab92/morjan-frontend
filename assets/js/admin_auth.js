/**
 * Admin Authentication Utilities
 * Shared logout and authentication check functions for all admin pages
 */

import { auth } from '../../firebase-frontend-config.js';
import { signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

/**
 * Admin-specific logout function
 * - Signs out from Firebase
 * - Clears all storage
 * - Redirects to login page using replace (prevents back navigation)
 */
export async function adminLogout() {
    console.log('🚪 ===== ADMIN LOGOUT STARTED =====');
    
    try {
        // Sign out from Firebase directly (bypass signOut() to avoid its redirect)
        console.log('🔍 Signing out from Firebase...');
        await firebaseSignOut(auth);
        console.log('✅ Firebase sign-out completed');
        
        // Clear ALL storage
        console.log('🔍 Clearing all storage...');
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ All storage cleared');
        
        // Verify logout
        const remainingAuth = {
            firebaseUser: auth.currentUser,
            hasLocalStorage: Object.keys(localStorage).length > 0,
            hasSessionStorage: Object.keys(sessionStorage).length > 0
        };
        
        if (remainingAuth.firebaseUser || remainingAuth.hasLocalStorage || remainingAuth.hasSessionStorage) {
            console.warn('⚠️ Some auth data may remain:', remainingAuth);
            // Force clear again
            localStorage.clear();
            sessionStorage.clear();
        }
        
        console.log('✅ Admin logout completed, redirecting...');
        
        // Use replace instead of href to prevent back navigation
        // This prevents users from using browser back button to return to admin pages
        const loginPage = 'login.html'; // Change to 'admin_login.html' if that page exists
        console.warn("🔴 NAVIGATION TRIGGERED: window.location.replace('login.html')", new Error().stack);
        window.location.replace(loginPage);
        
    } catch (error) {
        console.error('❌ Admin logout error:', error);
        
        // Even on error, clear storage and redirect
        try {
            localStorage.clear();
            sessionStorage.clear();
            console.warn("🔴 NAVIGATION TRIGGERED: window.location.replace('login.html') (error fallback)", new Error().stack);
            window.location.replace('login.html');
        } catch (redirectError) {
            console.error('❌ Failed to redirect after logout error:', redirectError);
            // Last resort - force reload
            console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'login.html' (last resort)", new Error().stack);
            window.location.href = 'login.html';
        }
        
        throw error;
    }
}

/**
 * Check if user is authenticated as admin
 * Verifies both Firebase Auth state and localStorage role
 */
export async function checkAdminAuth() {
    return new Promise((resolve) => {
        let resolved = false;
        
        // Set timeout to handle cases where auth state doesn't fire immediately
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                // Check localStorage for admin role (fallback if auth state not ready)
                const roleKeys = ['userRole', 'jwt_role'];
                const isAdmin = roleKeys.some(key => {
                    const role = localStorage.getItem(key);
                    return role && role.toLowerCase() === 'admin';
                });
                
                // If we have admin role in localStorage, assume authenticated
                // Otherwise, not authenticated
                const isAuthenticated = isAdmin && !!auth.currentUser;
                
                console.log('🔐 Admin auth check (timeout fallback):', {
                    firebaseUser: !!auth.currentUser,
                    isAdmin: isAdmin,
                    isAuthenticated: isAuthenticated
                });
                
                resolve(isAuthenticated);
            }
        }, 1000); // 1 second timeout
        
        // Check Firebase Auth state
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);
            unsubscribe(); // Unsubscribe immediately after first check
            
            // Check localStorage for admin role
            const roleKeys = ['userRole', 'jwt_role'];
            const isAdmin = roleKeys.some(key => {
                const role = localStorage.getItem(key);
                return role && role.toLowerCase() === 'admin';
            });
            
            // User must be authenticated AND have admin role
            const isAuthenticated = !!user && isAdmin;
            
            console.log('🔐 Admin auth check:', {
                firebaseUser: !!user,
                isAdmin: isAdmin,
                isAuthenticated: isAuthenticated
            });
            
            resolve(isAuthenticated);
        });
    });
}

/**
 * Enforce admin access - redirect if not authenticated
 * Call this on every admin page load
 */
export async function enforceAdminAccess() {
    const isAuthenticated = await checkAdminAuth();
    
    if (!isAuthenticated) {
        console.warn('⚠️ Unauthorized admin access attempt, redirecting...');
        // Use replace to prevent back navigation
        console.warn("🔴 NAVIGATION TRIGGERED: window.location.replace('login.html') (unauthorized)", new Error().stack);
        window.location.replace('login.html'); // Change to 'admin_login.html' if that page exists
        return false;
    }
    
    return true;
}

/**
 * Setup logout button handlers for admin pages
 * Call this after DOM is loaded
 */
export function setupAdminLogoutButtons() {
    const logoutButtons = [
        document.querySelector('.logout-btn'),
        document.querySelector('.admin-nav-logout'),
        document.getElementById('admin-header-logout'),
        document.getElementById('sidebar-logout'),
        document.getElementById('mobile-logout-btn')
    ].filter(Boolean);

    if (logoutButtons.length === 0) {
        console.warn('⚠️ No logout buttons found on admin page');
        return;
    }

    console.log(`✅ Found ${logoutButtons.length} logout button(s)`);

    logoutButtons.forEach(button => {
        // Check if button has a parent node before trying to replace it
        if (!button.parentNode) {
            console.warn('⚠️ Logout button has no parent node, skipping replace:', button);
            // Just add the listener directly to the existing button
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // Disable button to prevent double clicks
                    button.disabled = true;
                    button.style.opacity = '0.6';
                    button.style.cursor = 'not-allowed';
                    
                    console.log('🖱️ Logout button clicked');
                    
                    // Call admin logout
                    await adminLogout();
                    
                    // Note: adminLogout handles redirect, so we don't need to do it here
                    
                } catch (error) {
                    console.error('❌ Logout failed:', error);
                    
                    // Re-enable button on error
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    
                    // Show error message
                    alert('Failed to logout. Please try again.');
                }
            });
            return; // Skip the rest of the loop for this button
        }
        
        // Remove any existing listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // Disable button to prevent double clicks
                newButton.disabled = true;
                newButton.style.opacity = '0.6';
                newButton.style.cursor = 'not-allowed';
                
                console.log('🖱️ Logout button clicked');
                
                // Call admin logout
                await adminLogout();
                
                // Note: adminLogout handles redirect, so we don't need to do it here
                
            } catch (error) {
                console.error('❌ Logout failed:', error);
                
                // Re-enable button on error
                newButton.disabled = false;
                newButton.style.opacity = '1';
                newButton.style.cursor = 'pointer';
                
                // Show error message
                alert('Failed to logout. Please try again.');
            }
        });
    });
}
