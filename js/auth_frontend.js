// Firebase Authentication Module for J&A Jewelry Frontend

// Import Firebase functions (using SDK version 10.1.0 to match firebase-frontend-config.js)
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Import already initialized Firebase instances from firebase-frontend-config.js
// This ensures we use the same Firebase app instance across the entire application
import { auth, db } from "../../firebase-frontend-config.js";

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Backend API URL - adjust if your backend runs on a different port
const BACKEND_URL = 'https://morjan-backend.onrender.com';

// Verify Firebase initialization
console.log("🔥 Firebase Authentication module loaded");
console.log("📦 Firestore instance:", db ? "ready" : "not available");
console.log("🔐 Auth instance:", auth ? "ready" : "not available");
console.log("✅ Using Firebase instances from firebase-frontend-config.js");
console.log("🌐 Backend URL:", BACKEND_URL);

/**
 * Ensure user document exists in Firestore, creating or updating as needed
 * @param {Object} user - Firebase user object
 * @returns {Promise<Object>} User data object
 */
async function ensureUserDoc(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        // Extract provider from user.providerData
        let provider = 'email';
        if (user.providerData && user.providerData.length > 0) {
            const providerId = user.providerData[0].providerId;
            if (providerId === 'google.com') {
                provider = 'google';
            } else if (providerId === 'password') {
                provider = 'email';
            } else {
                provider = providerId.split('.')[0]; // Extract provider name
            }
        }
        
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            provider: provider,
            role: 'client',
            updatedAt: serverTimestamp()
        };
        
        if (!userDoc.exists()) {
            // New user - set createdAt
            userData.createdAt = serverTimestamp();
        }
        
        await setDoc(userRef, userData, { merge: true });
        console.log('✅ User document ensured in Firestore:', user.uid);
        
        return userData;
    } catch (error) {
        // Handle Firestore permission errors gracefully
        // Don't fail the entire signup if Firestore has permission issues
        if (error.code === 'permission-denied') {
            console.warn('⚠️ Firestore permission denied - user document not created, but auth account is valid');
            console.warn('⚠️ This is usually a Firestore security rules issue. User can still sign in.');
            // Don't throw - allow signup to succeed even if Firestore write fails
            return null;
        }
        console.error('Error ensuring user document in Firestore:', error);
        // Only throw for non-permission errors
        throw error;
    }
}


/**
 * Log in an existing user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential object
 */
export async function signIn(email, password) {
    try {
        console.log('🔄 Starting login process...');
        console.log('📧 Email:', email);
        console.log('🔐 Auth instance:', auth ? 'available' : 'NOT AVAILABLE');
        
        if (!auth) {
            throw new Error('Firebase Auth is not initialized. Please check firebase-frontend-config.js');
        }
        
        // Sign in with email and password
        console.log('🔄 Calling signInWithEmailAndPassword...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Firebase authentication successful:', user.uid);
        
        // Get Firebase ID token
        console.log('🔄 Getting Firebase ID token...');
        const firebaseToken = await user.getIdToken();
        console.log('✅ Firebase token obtained:', firebaseToken.substring(0, 20) + '...');
        
        // Send token to backend for verification and get JWT
        console.log('🔄 Sending token to backend:', `${BACKEND_URL}/auth/verify-token`);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: firebaseToken })
            });
            
            console.log('📡 Backend response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`Backend verification failed: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend response data:', data);
            
            // Store backend JWT token
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('jwt_token', data.access_token); // Keep for backward compatibility
            } else {
                // Fallback to Firebase token if backend doesn't return JWT
                localStorage.setItem('access_token', firebaseToken);
                localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            }
            
            // Store user info from backend response
            if (data.user) {
                const displayName = data.user.display_name || data.user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', data.user.email || user.email);
                localStorage.setItem('jwt_role', data.user.role || 'client');
                
                // Store full user info
                localStorage.setItem('user_info', JSON.stringify({
                    uid: data.user.uid || user.uid,
                    email: data.user.email || user.email,
                    displayName: displayName,
                    role: data.user.role || 'client'
                }));
            } else {
                // Fallback to Firebase user data
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', user.email);
                localStorage.setItem('jwt_role', 'client');
            }
            
            console.log('✅ Backend token verified and JWT stored');
        } catch (backendError) {
            console.warn('⚠️ Backend verification failed, using Firebase token only:', backendError);
            console.warn('⚠️ Backend error details:', {
                message: backendError.message,
                name: backendError.name
            });
            console.warn('⚠️ This is OK - login will still work with Firebase token');
            // Fallback: use Firebase token if backend is unavailable
            localStorage.setItem('access_token', firebaseToken);
            localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            localStorage.setItem('display_name', displayName);
            localStorage.setItem('username', displayName); // Keep for backward compatibility
            localStorage.setItem('email', user.email);
            localStorage.setItem('jwt_role', 'client');
            
            // Store user info for fallback
            localStorage.setItem('user_info', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            console.log('✅ Fallback: Using Firebase token, username stored:', displayName);
        }
        
        // Ensure user document exists in Firestore (non-blocking)
        try {
            await ensureUserDoc(user);
        } catch (firestoreError) {
            console.warn('⚠️ Firestore document creation had issues, but login succeeded:', firestoreError);
        }
        
        // Store user info and close modal
        storeUserInfoAndCloseModal(user);
        
        // Update UI immediately - force update
        console.log('🔄 Updating UI for logged in user:', user.email);
        updateAuthUI(user);
        
        // Also call checkLoginState to ensure welcome message is displayed
        if (typeof window.checkLoginState === 'function') {
            setTimeout(() => {
                window.checkLoginState();
            }, 200);
        }
        
        // Show success notification
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('Login successful!', 'success');
        } else {
            console.log('✅ Login successful!');
        }
        
        // NOTE: Redirects are handled in login.js, not here
        console.log('✅ User logged in successfully:', user.uid);
        console.log('✅ Username stored:', localStorage.getItem('username'));
        console.log('✅ JWT token stored:', !!localStorage.getItem('jwt_token'));
        return userCredential;
        
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        
        // Show error notification
        let errorMessage = 'Failed to login';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many login attempts. Please try again later';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage); // Fallback if notification system not available
        }
        
        throw error;
    }
}

// Export login as alias for backward compatibility
export async function login(email, password) {
    return signIn(email, password);
}

/**
 * Log in with Google OAuth
 * @returns {Promise<Object>} User credential object
 */
export async function signInWithGoogle() {
    try {
        // Sign in with Google
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;
        
        // Get Firebase ID token
        const firebaseToken = await user.getIdToken();
        
        // Send token to backend for verification and get JWT
        console.log('🔄 Sending token to backend:', `${BACKEND_URL}/auth/verify-token`);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: firebaseToken })
            });
            
            console.log('📡 Backend response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`Backend verification failed: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend response data:', data);
            
            // Store backend JWT token
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('jwt_token', data.access_token); // Keep for backward compatibility
            } else {
                // Fallback to Firebase token if backend doesn't return JWT
                localStorage.setItem('access_token', firebaseToken);
                localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            }
            
            // Store user info from backend response
            if (data.user) {
                const displayName = data.user.display_name || data.user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', data.user.email || user.email);
                localStorage.setItem('jwt_role', data.user.role || 'client');
                
                // Store full user info
                localStorage.setItem('user_info', JSON.stringify({
                    uid: data.user.uid || user.uid,
                    email: data.user.email || user.email,
                    displayName: displayName,
                    role: data.user.role || 'client'
                }));
            } else {
                // Fallback to Firebase user data
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', user.email);
                localStorage.setItem('jwt_role', 'client');
            }
            
            console.log('✅ Backend token verified and JWT stored');
        } catch (backendError) {
            console.warn('⚠️ Backend verification failed, using Firebase token only:', backendError);
            console.warn('⚠️ Backend error details:', {
                message: backendError.message,
                name: backendError.name
            });
            console.warn('⚠️ This is OK - login will still work with Firebase token');
            // Fallback: use Firebase token if backend is unavailable
            localStorage.setItem('access_token', firebaseToken);
            localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            localStorage.setItem('display_name', displayName);
            localStorage.setItem('username', displayName); // Keep for backward compatibility
            localStorage.setItem('email', user.email);
            localStorage.setItem('jwt_role', 'client');
            
            // Store user info for fallback
            localStorage.setItem('user_info', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            console.log('✅ Fallback: Using Firebase token, username stored:', displayName);
        }
        
        // Ensure user document exists in Firestore (non-blocking)
        try {
            await ensureUserDoc(user);
        } catch (firestoreError) {
            console.warn('⚠️ Firestore document creation had issues, but login succeeded:', firestoreError);
        }
        
        // Store user info and close modal
        storeUserInfoAndCloseModal(user);
        
        // Update UI immediately - force update
        console.log('🔄 Updating UI for logged in user:', user.email);
        updateAuthUI(user);
        
        // Also call checkLoginState to ensure welcome message is displayed
        if (typeof window.checkLoginState === 'function') {
            setTimeout(() => {
                window.checkLoginState();
            }, 200);
        }
        
        // Show success notification (if on a page with notification system)
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('Login successful!', 'success');
        } else {
            console.log('✅ Login successful!');
        }
        
        // NOTE: Redirects are handled in login.js, not here
        console.log('✅ User logged in with Google:', user.uid);
        console.log('✅ Username stored:', localStorage.getItem('username'));
        console.log('✅ JWT token stored:', !!localStorage.getItem('jwt_token'));
        return userCredential;
        
    } catch (error) {
        console.error('Google login error:', error);
        
        // Don't show error notification if user closed the popup (user action, not an error)
        if (error.code === 'auth/popup-closed-by-user') {
            console.log('ℹ️ User closed Google login popup');
            // Silently handle - user intentionally closed the popup
            return null;
        }
        
        // Show error notification for actual errors
        let errorMessage = 'Failed to login with Google';
        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup blocked. Please allow popups for this site';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with a different sign-in method';
        }
        
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification(errorMessage, 'error');
        }
        
        throw error;
    }
}

// Export googleLogin as alias for backward compatibility
export async function googleLogin() {
    return signInWithGoogle();
}

/**
 * Helper function to close login modal
 * Note: User info storage and UI updates are handled by updateAuthUI() via onAuthStateChanged
 * @param {Object} user - Firebase user object (not used, kept for compatibility)
 */
function storeUserInfoAndCloseModal(user) {
    // Close login modal immediately after login
    const loginDropdown = document.getElementById('login-dropdown');
    if (loginDropdown) {
        loginDropdown.style.display = 'none';
        loginDropdown.classList.remove('open');
        loginDropdown.setAttribute('aria-hidden', 'true');
    }
    // User info storage and UI updates will be handled automatically by onAuthStateChanged -> updateAuthUI
}

/**
 * Sign up a new user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential object
 */
export async function signUp(email, password) {
    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get Firebase ID token
        const firebaseToken = await user.getIdToken();
        
        // Send token to backend for verification and get JWT
        console.log('🔄 Sending token to backend:', `${BACKEND_URL}/auth/verify-token`);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: firebaseToken })
            });
            
            console.log('📡 Backend response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`Backend verification failed: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend response data:', data);
            
            // Store backend JWT token
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('jwt_token', data.access_token); // Keep for backward compatibility
            } else {
                // Fallback to Firebase token if backend doesn't return JWT
                localStorage.setItem('access_token', firebaseToken);
                localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            }
            
            // Store user info from backend response
            if (data.user) {
                const displayName = data.user.display_name || data.user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', data.user.email || user.email);
                localStorage.setItem('jwt_role', data.user.role || 'client');
                
                // Store full user info
                localStorage.setItem('user_info', JSON.stringify({
                    uid: data.user.uid || user.uid,
                    email: data.user.email || user.email,
                    displayName: displayName,
                    role: data.user.role || 'client'
                }));
            } else {
                // Fallback to Firebase user data
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                localStorage.setItem('display_name', displayName);
                localStorage.setItem('username', displayName); // Keep for backward compatibility
                localStorage.setItem('email', user.email);
                localStorage.setItem('jwt_role', 'client');
            }
            
            console.log('✅ Backend token verified and JWT stored');
        } catch (backendError) {
            console.warn('⚠️ Backend verification failed, using Firebase token only:', backendError);
            console.warn('⚠️ Backend error details:', {
                message: backendError.message,
                name: backendError.name
            });
            console.warn('⚠️ This is OK - login will still work with Firebase token');
            // Fallback: use Firebase token if backend is unavailable
            localStorage.setItem('access_token', firebaseToken);
            localStorage.setItem('jwt_token', firebaseToken); // Keep for backward compatibility
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            localStorage.setItem('display_name', displayName);
            localStorage.setItem('username', displayName); // Keep for backward compatibility
            localStorage.setItem('email', user.email);
            localStorage.setItem('jwt_role', 'client');
            
            // Store user info for fallback
            localStorage.setItem('user_info', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            console.log('✅ Fallback: Using Firebase token, username stored:', displayName);
        }
        
        // Ensure user document exists in Firestore (non-blocking)
        // If Firestore has permission issues, don't fail the signup
        try {
            await ensureUserDoc(user);
        } catch (firestoreError) {
            // Firestore errors are already handled in ensureUserDoc
            // Only log here, don't throw - user account is still valid
            console.warn('⚠️ Firestore document creation had issues, but user account was created successfully');
        }
        
        // Store user info and close modal (if on a page with modal)
        // Note: On signup.html, this won't affect anything, but it's safe to call
        storeUserInfoAndCloseModal(user);
        
        // Update UI immediately - force update
        console.log('🔄 Updating UI for signed up user:', user.email);
        updateAuthUI(user);
        
        // Also call checkLoginState to ensure welcome message is displayed
        if (typeof window.checkLoginState === 'function') {
            setTimeout(() => {
                window.checkLoginState();
            }, 200);
        }
        
        // Show success notification in Arabic (if on a page with notification system)
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('تم إنشاء الحساب بنجاح!', 'success');
        } else {
            console.log('✅ Account created successfully!');
        }
        
        console.log('✅ User signed up and automatically logged in:', user.uid);
        console.log('✅ Username stored:', localStorage.getItem('username'));
        console.log('✅ JWT token stored:', !!localStorage.getItem('jwt_token'));
        
        // NOTE: Redirects are handled in login.js, not here
        return userCredential;
        
    } catch (error) {
        console.error('❌ Sign up error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        
        // Show error notification in Arabic
        let errorMessage = 'فشل إنشاء الحساب';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'عنوان البريد الإلكتروني غير صالح';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'كلمة المرور ضعيفة جداً';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'عملية إنشاء الحساب غير مسموحة';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'فشل الاتصال بالشبكة. يرجى المحاولة مرة أخرى';
        }
        
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification(errorMessage, 'error');
        } else {
            console.error('❌ showNotification not available, error:', errorMessage);
        }
        
        throw error;
    }
}

// Export signup as alias for backward compatibility
export async function signup(email, password) {
    return signUp(email, password);
}

/**
 * Log out the current user
 */
export async function signOut() {
    console.log('🚪 ===== LOGOUT PROCESS STARTED =====');
    console.log('🔍 Step 1: Checking current auth state...');
    
    // Log current state before logout
    const currentUserBefore = auth.currentUser;
    const hasJwtToken = !!localStorage.getItem('jwt_token');
    const hasAccessToken = !!localStorage.getItem('access_token');
    const hasUserRole = !!localStorage.getItem('jwt_role') || !!localStorage.getItem('userRole');
    const hasUsername = !!localStorage.getItem('username') || !!localStorage.getItem('userName');
    
    console.log('📊 Auth state before logout:', {
        firebaseUser: currentUserBefore ? currentUserBefore.email : 'null',
        jwtToken: hasJwtToken ? 'exists' : 'missing',
        accessToken: hasAccessToken ? 'exists' : 'missing',
        userRole: hasUserRole ? 'exists' : 'missing',
        username: hasUsername ? 'exists' : 'missing'
    });
    
    try {
        console.log('🔍 Step 2: Signing out from Firebase...');
        // Sign out from Firebase - THIS IS THE PRIMARY LOGOUT ACTION
        await firebaseSignOut(auth);
        console.log('✅ Firebase sign-out completed');
        
        // Verify Firebase sign-out worked
        const currentUserAfter = auth.currentUser;
        if (currentUserAfter) {
            console.error('❌ CRITICAL: Firebase sign-out failed - user still logged in!');
            throw new Error('Firebase sign-out did not complete');
        }
        console.log('✅ Verified: Firebase user is null after sign-out');
        
        console.log('🔍 Step 3: Clearing all localStorage items...');
        // Clear ALL localStorage items (including all variants)
        const keysToRemove = [
            'access_token',
            'jwt_token',
            'jwt_role',
            'userRole', // Alternative key used in login.js
            'user_info',
            'username',
            'userName', // camelCase variant
            'displayName', // camelCase variant
            'display_name', // snake_case variant
            'email'
        ];
        
        keysToRemove.forEach(key => {
            const hadValue = !!localStorage.getItem(key);
            localStorage.removeItem(key);
            if (hadValue) {
                console.log(`  ✅ Removed: ${key}`);
            }
        });
        
        // Verify all keys are cleared
        const remainingKeys = keysToRemove.filter(key => !!localStorage.getItem(key));
        if (remainingKeys.length > 0) {
            console.error('❌ WARNING: Some keys were not cleared:', remainingKeys);
        } else {
            console.log('✅ All localStorage keys cleared successfully');
        }
        
        console.log('🔍 Step 4: Clearing sessionStorage (if used)...');
        // Clear sessionStorage as well (even if not currently used, for safety)
        try {
            sessionStorage.clear();
            console.log('✅ sessionStorage cleared');
        } catch (e) {
            console.log('ℹ️ sessionStorage clear failed (may not be used):', e);
        }
        
        console.log('🔍 Step 5: Updating UI state...');
        // Update UI immediately to restore default header icons
        updateAuthUI(null);
        console.log('✅ UI updated to logged-out state');
        
        // Also call checkLoginState to ensure welcome message is hidden
        if (typeof window.checkLoginState === 'function') {
            window.checkLoginState();
            console.log('✅ checkLoginState called');
        }
        
        // Update drawer if function exists
        if (typeof window.updateDrawerUserName === 'function') {
            window.updateDrawerUserName();
            console.log('✅ Drawer UI updated');
        }
        
        console.log('🔍 Step 6: Final verification...');
        // Final verification - check that user is truly logged out
        const finalCheck = {
            firebaseUser: auth.currentUser,
            jwtToken: localStorage.getItem('jwt_token'),
            accessToken: localStorage.getItem('access_token'),
            userRole: localStorage.getItem('jwt_role') || localStorage.getItem('userRole'),
            username: localStorage.getItem('username') || localStorage.getItem('userName')
        };
        
        const isFullyLoggedOut = !finalCheck.firebaseUser && 
                                 !finalCheck.jwtToken && 
                                 !finalCheck.accessToken && 
                                 !finalCheck.userRole && 
                                 !finalCheck.username;
        
        if (isFullyLoggedOut) {
            console.log('✅ ===== LOGOUT VERIFICATION PASSED =====');
            console.log('✅ User is fully logged out - all auth data cleared');
        } else {
            console.error('❌ ===== LOGOUT VERIFICATION FAILED =====');
            console.error('❌ Remaining auth data:', finalCheck);
            throw new Error('Logout verification failed - some auth data remains');
        }
        
        // Show success notification
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('تم تسجيل الخروج بنجاح!', 'success');
        } else {
            alert('تم تسجيل الخروج بنجاح!');
        }
        
        console.log('🔍 Step 7: Redirecting to login page...');
        // Redirect to login page ONLY after logout is complete and verified
        // This ensures user must log in again - no automatic re-login on refresh
        setTimeout(() => {
            // Guard: Prevent redirect to same page and infinite loops
            if (window.__alreadyRedirected) {
                console.log('✅ Redirect already executed, skipping');
                return;
            }
            const target = 'login.html';
            if (!window.location.pathname.includes(target)) {
                window.__alreadyRedirected = true;
                console.log('✅ Redirecting to login.html (logout complete)');
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'login.html' (logout)", new Error().stack);
                window.location.href = target;
            } else {
                console.log('✅ Already on login page, skipping redirect');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ ===== LOGOUT ERROR =====');
        console.error('❌ Error details:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Even on error, try to clear what we can
        console.log('⚠️ Attempting emergency cleanup...');
        try {
            localStorage.clear(); // Nuclear option - clear everything
            sessionStorage.clear();
            console.log('⚠️ Emergency cleanup: All storage cleared');
        } catch (clearError) {
            console.error('❌ Emergency cleanup also failed:', clearError);
        }
        
        if (window.JAJewelry?.showNotification) {
            window.JAJewelry.showNotification('Error logging out', 'error');
        } else {
            alert('خطأ أثناء تسجيل الخروج');
        }
        
        throw error;
    }
}

// Export logout as alias for backward compatibility
export async function logout() {
    return signOut();
}

/**
 * Add product to Firestore cart by productId (reads from products collection)
 * @param {string} productId - Product ID from products collection
 * @returns {Promise<void>}
 */
export async function addToCart(productId) {
    try {
        // DEBUG: Log what we receive
        console.log('🔍 DEBUG auth_frontend.addToCart called with:', productId);
        console.log('🔍 DEBUG typeof productId:', typeof productId);
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Please log in first!");
            return;
        }
        
        // Validate and ensure productId is a string
        if (!productId) {
            console.error('❌ DEBUG: productId is falsy:', productId);
            throw new Error('Product ID is required');
        }
        
        // DEBUG: Check if we received an object instead of a string
        if (typeof productId === 'object') {
            console.error('❌ DEBUG: addToCart received an OBJECT instead of string ID:', productId);
            console.error('❌ DEBUG: This should NOT happen - product object should go to addToFirestoreCart');
            throw new Error('Invalid: addToCart expects a string productId, but received an object. Use addToFirestoreCart for product objects.');
        }
        
        const productIdString = String(productId).trim();
        if (!productIdString) {
            console.error('❌ DEBUG: productIdString is empty after conversion');
            throw new Error('Product ID must be a valid string');
        }
        
        console.log('🔍 DEBUG: Searching for productId:', productIdString);
        
        // Search for product across all collections (bags, watches, perfumes, accessories, products)
        // Products can be in different collections, so we need to check all of them
        const collections = ['bags', 'watches', 'perfumes', 'accessories', 'products'];
        let product = null;
        let foundCollection = null;
        
        for (const collectionName of collections) {
            try {
                console.log(`🔍 DEBUG: Searching ID "${productIdString}" in collection "${collectionName}"`);
                const productRef = doc(db, collectionName, productIdString);
                const productSnap = await getDoc(productRef);
                
                if (productSnap.exists()) {
                    product = productSnap.data();
                    foundCollection = collectionName;
                    console.log(`✅ DEBUG: Product found in "${collectionName}" collection:`, product);
                    break;
                } else {
                    console.log(`🔍 DEBUG: Product NOT found in "${collectionName}" collection`);
                }
            } catch (error) {
                // Continue to next collection if this one fails
                console.warn(`⚠️ DEBUG: Error checking ${collectionName} collection:`, error);
                continue;
            }
        }
        
        if (!product) {
            console.error('❌ DEBUG: Product not found in any collection:', productIdString);
            console.error('❌ DEBUG: Searched collections:', collections);
            alert("Product not found!");
            return;
        }
        
        // Check if item already exists in cart
        const cartRef = doc(db, "users", currentUser.uid, "cart", productIdString);
        const cartItemDoc = await getDoc(cartRef);
        
        let quantity = 1;
        if (cartItemDoc.exists()) {
            // Item exists - increment quantity
            const existingData = cartItemDoc.data();
            quantity = (existingData.quantity || 1) + 1;
        }
        
        // Use image_url if available, otherwise image, otherwise placeholder
        let imageUrl = product.image_url || product.image || '';
        imageUrl = String(imageUrl || '').trim();
        
        // Validate image URL - reject numeric-only values
        const isValidImageUrl = (url) => {
            if (!url || url.length < 3) return false;
            if (/^\d+$/.test(url)) return false; // Just numbers
            if (/^\/\d+$/.test(url) || /^\/\d+\//.test(url)) return false; // Numeric paths
            const validPrefixes = ['http://', 'https://', '/', 'assets/', 'data:', './'];
            if (!validPrefixes.some(prefix => url.startsWith(prefix))) return false;
            return true;
        };
        
        if (!isValidImageUrl(imageUrl)) {
            imageUrl = 'assets/images/products/placeholder.jpg';
        }
        
        // Determine category from collection or product data
        let productCategory = product.category || '';
        if (!productCategory && foundCollection) {
            // If category is not set, use collection name as category
            productCategory = foundCollection;
        }
        
        // Save to user's cart
        await setDoc(cartRef, {
            name: product.name,
            price: product.price_after || product.priceAfter || product.price || 0,
            image: imageUrl,
            image_url: imageUrl,
            category: productCategory,
            quantity: quantity,
        }, { merge: true });
        
        console.log('✅ Product added to Firestore cart:', productIdString);
        
        // Update cart badge
        updateCartBadgeFromFirestore();
        
        alert("✅ Added to cart!");
        return true;
    } catch (error) {
        console.error('❌ Error adding to Firestore cart:', error);
        
        // Provide helpful error messages
        if (error.code === 'permission-denied') {
            console.error('🔒 Firestore permission denied. Please update Firestore security rules to allow users to write to their cart.');
            alert('Permission denied. Please ensure Firestore security rules allow users to write to their cart collection.');
        } else if (error.code === 'unavailable') {
            console.error('🌐 Firestore unavailable. Check your internet connection.');
            alert('Service unavailable. Please check your internet connection.');
        } else {
            alert('Error adding product to cart: ' + (error.message || 'Unknown error'));
        }
        
        throw error;
    }
}

/**
 * Add product to cart via backend API (using product object)
 * @param {Object} product - Product object with id, name, price, image
 * @returns {Promise<void>}
 */
export async function addToFirestoreCart(product) {
    try {
        console.log('🔄 addToFirestoreCart called with product:', product);
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('❌ No current user found');
            throw new Error('User must be logged in to add items to cart');
        }
        
        console.log('✅ Current user found:', currentUser.uid);
        
        // Validate and ensure product.id is a string
        if (!product || !product.id) {
            console.error('❌ Invalid product object:', product);
            throw new Error('Product object must have an id property');
        }
        const productId = String(product.id);
        console.log('✅ Product ID validated:', productId);
        
        // Get Firebase ID token for authentication
        console.log('🔄 Getting Firebase ID token for cart API call...');
        let firebaseToken;
        try {
            firebaseToken = await currentUser.getIdToken();
            console.log('✅ Firebase token obtained (length:', firebaseToken.length, ')');
        } catch (tokenError) {
            console.error('❌ Error getting Firebase token:', tokenError);
            throw new Error('Failed to get authentication token. Please try logging in again.');
        }
        
        // Call backend API to add item to cart
        console.log('🔄 Calling backend API:', `${BACKEND_URL}/cart/add`);
        console.log('🔄 Request payload:', { product_id: productId, quantity: 1 });
        
        let response;
        try {
            response = await fetch(`${BACKEND_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseToken}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });
            console.log('📡 Backend response received, status:', response.status);
        } catch (fetchError) {
            console.error('❌ Network error calling backend:', fetchError);
            throw new Error(`Network error: ${fetchError.message}. Please check your connection.`);
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response (status', response.status, '):', errorText);
            let errorMessage = 'Error adding product to cart. Please try again.';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // If response is not JSON, use the text or default message
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        console.log('✅ Product added to cart via backend API:', responseData);
        
        // Update cart badge by calling backend /cart endpoint
        try {
            await updateCartBadgeFromBackend();
        } catch (badgeError) {
            console.warn('⚠️ Error updating cart badge:', badgeError);
            // Don't fail the whole operation if badge update fails
        }
        
        return responseData;
    } catch (error) {
        console.error('❌ Error adding to cart via backend API:', error);
        console.error('❌ Error stack:', error.stack);
        throw error;
    }
}

/**
 * Get all cart items from Firestore
 * @returns {Promise<Array>} Array of cart items
 */
export async function getFirestoreCart() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('ℹ️ User not logged in - returning empty cart');
            return [];
        }
        
        const userId = currentUser.uid;
        const cartCollection = collection(db, 'users', userId, 'cart');
        const cartSnapshot = await getDocs(cartCollection);
        
        const cartItems = [];
        cartSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cartItems.push({
                id: docSnap.id,
                name: data.name,
                price: data.price,
                image: data.image_url || data.image || 'assets/images/products/placeholder.jpg',
                image_url: data.image_url || data.image || 'assets/images/products/placeholder.jpg',
                quantity: data.quantity || 1
            });
        });
        
        console.log('✅ Fetched cart items from Firestore:', cartItems.length);
        return cartItems;
    } catch (error) {
        console.error('❌ Error fetching Firestore cart:', error);
        throw error;
    }
}

/**
 * Update cart item quantity in Firestore
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise<void>}
 */
export async function updateFirestoreCartItem(productId, quantity) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn('⚠️ User not logged in');
            return;
        }
        
        // Validate and ensure productId is a string
        if (!productId) {
            throw new Error('Product ID is required');
        }
        const productIdString = String(productId).trim();
        if (!productIdString) {
            throw new Error('Product ID must be a valid string');
        }
        
        const userId = currentUser.uid;
        const cartItemRef = doc(db, 'users', userId, 'cart', productIdString);
        
        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            await deleteFirestoreCartItem(productIdString);
            return;
        }
        
        await updateDoc(cartItemRef, {
            quantity: quantity,
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Updated cart item quantity:', productIdString, quantity);
        updateCartBadgeFromFirestore();
    } catch (error) {
        console.error('❌ Error updating Firestore cart item:', error);
        throw error;
    }
}

/**
 * Remove cart item from Firestore
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export async function removeFirestoreCartItem(productId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn('⚠️ User not logged in');
            return;
        }
        
        // Validate and ensure productId is a string
        if (!productId) {
            throw new Error('Product ID is required');
        }
        const productIdString = String(productId).trim();
        if (!productIdString) {
            throw new Error('Product ID must be a valid string');
        }
        
        const userId = currentUser.uid;
        const cartItemRef = doc(db, 'users', userId, 'cart', productIdString);
        await deleteDoc(cartItemRef);
        
        console.log('✅ Removed cart item from Firestore:', productIdString);
        updateCartBadgeFromFirestore();
    } catch (error) {
        console.error('❌ Error removing Firestore cart item:', error);
        throw error;
    }
}

/**
 * Update cart badge count from Firestore
 */
async function updateCartBadgeFromFirestore() {
    try {
        const cartItems = await getFirestoreCart();
        const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Update all cart badges
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        });
        
        console.log('✅ Cart badge updated:', totalItems);
    } catch (error) {
        console.error('❌ Error updating cart badge:', error);
    }
}

/**
 * Update cart badge from backend API
 * @returns {Promise<void>}
 */
async function updateCartBadgeFromBackend() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            // Guest user - show 0
            const badges = document.querySelectorAll('.cart-badge');
            badges.forEach(badge => {
                badge.textContent = '0';
                badge.style.display = 'none';
            });
            return;
        }
        
        // Get Firebase ID token
        const firebaseToken = await currentUser.getIdToken();
        
        // Call backend API to get cart
        const response = await fetch(`${BACKEND_URL}/cart/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${firebaseToken}`
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Failed to fetch cart from backend for badge update:', response.status);
            return;
        }
        
        const cartData = await response.json();
        const totalItems = cartData.total_items || 0;
        
        // Update all cart badges
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        });
        
        console.log('✅ Cart badge updated from backend:', totalItems, 'items');
    } catch (error) {
        console.error('❌ Error updating cart badge from backend:', error);
    }
}

// ========== WISHLIST FIRESTORE FUNCTIONS ==========

/**
 * Add product to Firestore wishlist
 * @param {Object} product - Product object with id, name, price, image, etc.
 * @returns {Promise<Object>} Wishlist item data
 */
export async function addToFirestoreWishlist(product) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be logged in to add items to wishlist');
        }
        
        // Validate and ensure product.id is a string
        if (!product || !product.id) {
            throw new Error('Product object must have an id property');
        }
        const productIdString = String(product.id).trim();
        if (!productIdString) {
            throw new Error('Product ID must be a valid string');
        }
        
        const userId = currentUser.uid;
        const wishlistItemRef = doc(db, 'users', userId, 'wishlist', productIdString);
        
        // Use image_url if available, otherwise image, otherwise placeholder
        let imageUrl = product.image_url || product.image || '';
        imageUrl = String(imageUrl || '').trim();
        
        // Validate image URL
        const isValidImageUrl = (url) => {
            if (!url || url.length < 3) return false;
            if (/^\d+$/.test(url)) return false;
            if (/^\/\d+$/.test(url) || /^\/\d+\//.test(url)) return false;
            const validPrefixes = ['http://', 'https://', '/', 'assets/', 'data:', './'];
            if (!validPrefixes.some(prefix => url.startsWith(prefix))) return false;
            return true;
        };
        
        if (!isValidImageUrl(imageUrl)) {
            imageUrl = 'assets/images/products/placeholder.jpg';
        }
        
        const wishlistItemData = {
            name: product.name || {},
            price: product.price || product.price_after || 0,
            original_price: product.original_price || product.price_before || null,
            currency: product.currency || '₪',
            image: imageUrl,
            image_url: imageUrl,
            gender: product.gender || 'unisex',
            brand: product.brand || '',
            category: product.category || '',
            type: product.type || null,
            material: product.material || null,
            color: product.color || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(wishlistItemRef, wishlistItemData, { merge: true });
        console.log('✅ Product added to Firestore wishlist:', product.id);
        
        // Update wishlist badge
        if (typeof window.updateWishlistBadge === 'function') {
            window.updateWishlistBadge().catch(error => {
                console.error('Error updating wishlist badge:', error);
            });
        }
        
        return wishlistItemData;
    } catch (error) {
        console.error('❌ Error adding to Firestore wishlist:', error);
        throw error;
    }
}

/**
 * Get all wishlist items from Firestore
 * @returns {Promise<Array>} Array of wishlist items
 */
export async function getFirestoreWishlist() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('ℹ️ User not logged in - returning empty wishlist');
            return [];
        }
        
        const userId = currentUser.uid;
        const wishlistCollection = collection(db, 'users', userId, 'wishlist');
        const wishlistSnapshot = await getDocs(wishlistCollection);
        
        const wishlistItems = [];
        wishlistSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            wishlistItems.push({
                id: docSnap.id,
                name: data.name || {},
                price: data.price || 0,
                original_price: data.original_price || null,
                currency: data.currency || '₪',
                image: data.image_url || data.image || 'assets/images/products/placeholder.jpg',
                image_url: data.image_url || data.image || 'assets/images/products/placeholder.jpg',
                gender: data.gender || 'unisex',
                brand: data.brand || '',
                category: data.category || '',
                type: data.type || null,
                material: data.material || null,
                color: data.color || null
            });
        });
        
        console.log('✅ Fetched wishlist items from Firestore:', wishlistItems.length);
        return wishlistItems;
    } catch (error) {
        console.error('❌ Error fetching Firestore wishlist:', error);
        throw error;
    }
}

/**
 * Remove wishlist item from Firestore
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export async function removeFirestoreWishlistItem(productId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be logged in to remove items from wishlist');
        }
        
        // Validate and ensure productId is a string
        if (!productId) {
            throw new Error('Product ID is required');
        }
        const productIdString = String(productId).trim();
        if (!productIdString) {
            throw new Error('Product ID must be a valid string');
        }
        
        const userId = currentUser.uid;
        const wishlistItemRef = doc(db, 'users', userId, 'wishlist', productIdString);
        await deleteDoc(wishlistItemRef);
        
        console.log('✅ Removed wishlist item from Firestore:', productIdString);
        
        // Update wishlist badge
        if (typeof window.updateWishlistBadge === 'function') {
            window.updateWishlistBadge().catch(error => {
                console.error('Error updating wishlist badge:', error);
            });
        }
    } catch (error) {
        console.error('❌ Error removing Firestore wishlist item:', error);
        throw error;
    }
}

/**
 * Check if product is in wishlist
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>}
 */
export async function isInFirestoreWishlist(productId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return false;
        }
        
        // Validate and ensure productId is a string
        if (!productId) {
            return false;
        }
        const productIdString = String(productId).trim();
        if (!productIdString) {
            return false;
        }
        
        const userId = currentUser.uid;
        const wishlistItemRef = doc(db, 'users', userId, 'wishlist', productIdString);
        const wishlistItemDoc = await getDoc(wishlistItemRef);
        
        return wishlistItemDoc.exists();
    } catch (error) {
        console.error('❌ Error checking wishlist:', error);
        return false;
    }
}

// Auth state change listener - updates UI immediately when auth state changes
// This is the PRIMARY source of truth for auth state - all cart badge updates should come from here
// Guard: Prevent duplicate listener registration
if (!window.__authListenerInitialized) {
  window.__authListenerInitialized = true;
  onAuthStateChanged(auth, (user) => {
    console.log('🔐 Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
    
    // Update UI immediately - don't wait for DOM
    const updateUI = () => {
        try {
            updateAuthUI(user);
            // Also call checkLoginState to ensure welcome message is displayed
            if (typeof window.checkLoginState === 'function') {
                setTimeout(() => {
                    window.checkLoginState();
                }, 100);
            }
            
            // CRITICAL: Update cart and wishlist badges when auth state changes
            // This is the ONLY place these should be called from
            // onAuthStateChanged ensures Firebase auth is fully initialized before this fires
            if (typeof window.updateCartBadge === 'function') {
                // No delay needed - onAuthStateChanged already ensures auth is ready
                window.updateCartBadge().catch(error => {
                    console.error('Error updating cart badge on auth change:', error);
                });
            }
            
            // Update wishlist badge
            if (typeof window.updateWishlistBadge === 'function') {
                window.updateWishlistBadge().catch(error => {
                    console.error('Error updating wishlist badge on auth change:', error);
                });
            }
        } catch (error) {
            console.error('Error updating auth UI:', error);
        }
    };
    
    // If DOM is ready, update immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        updateUI();
    } else {
        // Otherwise wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', updateUI);
        // Also try after a short delay as backup
        setTimeout(updateUI, 500);
    }
  });
}

// Check auth state on page load to ensure UI is updated
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (auth.currentUser) {
            console.log('🔄 Checking auth state on page load:', auth.currentUser.email);
            updateAuthUI(auth.currentUser);
            if (typeof window.checkLoginState === 'function') {
                setTimeout(() => {
                    window.checkLoginState();
                }, 100);
            }
        }
    });
} else {
    // DOM already ready
    if (auth.currentUser) {
        console.log('🔄 Checking auth state on page load:', auth.currentUser.email);
        updateAuthUI(auth.currentUser);
        if (typeof window.checkLoginState === 'function') {
            setTimeout(() => {
                window.checkLoginState();
            }, 100);
        }
    }
}

/**
 * Get language-dependent greeting text
 * @param {string} lang - Language code (ar, en, he)
 * @returns {string} Greeting text in the specified language
 */
function getGreetingText(lang) {
    const greetings = {
        ar: 'مرحبا',
        en: 'Welcome',
        he: 'שלום'
    };
    return greetings[lang] || greetings['en']; // Default to English if language not found
}

/**
 * Update greeting text for logged-in user when language changes
 * This function can be called externally (e.g., from app.js when language switches)
 */
export function updateGreetingForCurrentUser() {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
        // Get user display name
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        
        // Get current language from HTML lang attribute
        const currentLang = document.documentElement.lang || 'en';
        const langCode = currentLang.split('-')[0]; // Get 'ar' from 'ar-SA', 'en' from 'en-US', etc.
        
        // Get language-dependent greeting
        const greeting = getAuthGreetingText(langCode);
        
        // Create full greeting text with name
        const greetingText = `${greeting}, ${displayName} 👑`;
        
        // Update desktop greeting
        const userGreeting = document.getElementById('user-greeting');
        if (userGreeting) {
            userGreeting.innerHTML = `${greeting}, <span id="user-display-name">${displayName}</span> 👑`;
            console.log('✅ Desktop greeting updated for language change:', greetingText);
        }
        
        // Update mobile greeting
        const mobileUserGreeting = document.getElementById('mobile-user-greeting');
        if (mobileUserGreeting && mobileUserGreeting.style.display !== 'none') {
            mobileUserGreeting.innerHTML = `${greeting}, <span id="mobile-user-display-name">${displayName}</span> 👑`;
            console.log('✅ Mobile greeting updated for language change:', greetingText);
        }
    }
}

/**
 * Update UI based on authentication state
 * @param {Object|null} user - Firebase user object or null
 */
export function updateAuthUI(user) {
    const accountIcon = document.getElementById('header-account-icon');
    const loginDropdown = document.getElementById('login-dropdown');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginSubmitBtn = loginForm?.querySelector('button[type="submit"]');
    const loginGoogleBtn = document.getElementById('login-google');
    const logoutLink = document.getElementById('logout-link');
    const createAccountLink = document.getElementById('create-account-link');
    const userProfileArea = document.getElementById('user-profile-area');
    const userGreeting = document.getElementById('user-greeting');
    const userDisplayNameSpan = document.getElementById('user-display-name');
    
    // Mobile menu elements
    const mobileUserGreeting = document.getElementById('mobile-user-greeting');
    const mobileUserDisplayName = document.getElementById('mobile-user-display-name');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileLogoutContainer = document.querySelector('.mobile-logout-container');
    
    if (user) {
        // User is logged in
        // Account icon remains visible - it will show profile dropdown instead
        // The icon itself doesn't need to be hidden
        
        // Early return if user-profile-area doesn't exist (e.g., on admin page)
        if (!userProfileArea) {
            return;
        }
        
        // Show user profile area
        userProfileArea.style.display = 'flex';
        console.log('✅ User profile area shown');
        
        // Get user display name (prefer displayName, fallback to email username, then localStorage)
        let displayName = user.displayName || user.email?.split('@')[0] || localStorage.getItem('username') || 'User';
        
        // Get current language from HTML lang attribute
        const currentLang = document.documentElement.lang || 'en';
        const langCode = currentLang.split('-')[0]; // Get 'ar' from 'ar-SA', 'en' from 'en-US', etc.
        
        // Get language-dependent greeting
        const greeting = getAuthGreetingText(langCode);
        
        // Create full greeting text with name (don't translate the name)
        const greetingText = `${greeting}, ${displayName} 👑`;
        
        // Update desktop greeting
        // Structure: <span id="user-greeting">مرحبا, <span id="user-display-name">User</span> 👑</span>
        if (userGreeting) {
            userGreeting.innerHTML = `${greeting}, <span id="user-display-name">${displayName}</span> 👑`;
            console.log('✅ Desktop greeting updated:', greetingText);
        }
        // userDisplayNameSpan is updated via innerHTML above, but keep this as backup
        if (userDisplayNameSpan) {
            userDisplayNameSpan.textContent = displayName;
        }
        
        // Update mobile menu - show greeting and logout, hide login
        if (mobileUserGreeting) {
            mobileUserGreeting.style.display = '';
            // Update mobile greeting - replace entire content
            // Structure: <span>مرحبا, <span id="mobile-user-display-name">User</span> 👑</span>
            mobileUserGreeting.innerHTML = `${greeting}, <span id="mobile-user-display-name">${displayName}</span> 👑`;
            console.log('✅ Mobile user greeting updated:', greetingText);
        }
        // mobileUserDisplayName is updated via innerHTML above, but keep this as backup
        if (mobileUserDisplayName) {
            mobileUserDisplayName.textContent = displayName;
            console.log('✅ Mobile user display name updated:', displayName);
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.style.display = 'none';
            console.log('✅ Mobile login button hidden');
        }
        if (mobileLogoutContainer) {
            mobileLogoutContainer.style.display = '';
            console.log('✅ Mobile logout container shown');
        }
        if (mobileLogoutBtn) {
            console.log('✅ Mobile logout button found');
        }
        
        // Hide login form fields when logged in (show only logout link)
        if (loginEmail) loginEmail.closest('.form-row')?.style.setProperty('display', 'none');
        if (loginPassword) loginPassword.closest('.form-row')?.style.setProperty('display', 'none');
        if (loginSubmitBtn) loginSubmitBtn.style.display = 'none';
        if (loginGoogleBtn) loginGoogleBtn.style.display = 'none';
        
        // Close dropdown if open
        if (loginDropdown) {
            loginDropdown.style.display = 'none';
            loginDropdown.classList.remove('open');
            loginDropdown.setAttribute('aria-hidden', 'true');
        }
        
        // Show logout link, hide create account link (inside dropdown)
        if (logoutLink) {
            logoutLink.style.display = '';
        }
        if (createAccountLink) {
            createAccountLink.style.display = 'none';
        }
        
        // Update user icon to show logged-in state
        const userIcon = document.querySelector("#header-account-icon");
        if (userIcon) {
            userIcon.classList.remove("fa-user");
            userIcon.classList.add("fa-user-check");
            console.log('✅ User icon updated to logged-in state');
        }
        
        // Store user info in localStorage
        const userInfo = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
        };
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        
        // Store username separately for easy access
        localStorage.setItem('username', displayName);
        localStorage.setItem('display_name', displayName); // Also store as display_name
        localStorage.setItem('email', user.email); // Store email
        
    } else {
        // User is not logged in
        // Account icon is always visible - it opens login dropdown when logged out
        // No need to show/hide the icon itself
        
        // Hide user profile area
        if (userProfileArea) {
            userProfileArea.style.display = 'none';
        }
        
        // Update mobile menu - hide greeting and logout, show login
        if (mobileUserGreeting) {
            mobileUserGreeting.style.display = 'none';
            console.log('✅ Mobile user greeting hidden');
        }
        if (mobileLogoutContainer) {
            mobileLogoutContainer.style.display = 'none';
            console.log('✅ Mobile logout container hidden');
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.style.display = 'block'; // Use 'block' instead of empty string
            console.log('✅ Mobile login button shown');
        }
        
        // Show login form fields when logged out
        if (loginEmail) loginEmail.closest('.form-row')?.style.setProperty('display', '');
        if (loginPassword) loginPassword.closest('.form-row')?.style.setProperty('display', '');
        if (loginSubmitBtn) loginSubmitBtn.style.display = '';
        if (loginGoogleBtn) loginGoogleBtn.style.display = '';
        
        // Close dropdown
        if (loginDropdown) {
            loginDropdown.style.display = 'none';
            loginDropdown.classList.remove('open');
            loginDropdown.setAttribute('aria-hidden', 'true');
        }
        
        // Hide logout link, show create account link
        if (logoutLink) {
            logoutLink.style.display = 'none';
        }
        if (createAccountLink) {
            createAccountLink.style.display = '';
        }
        
        // Update user icon to show logged-out state
        const userIcon = document.querySelector("#header-account-icon");
        if (userIcon) {
            userIcon.classList.remove("fa-user-check");
            userIcon.classList.add("fa-user");
            console.log('✅ User icon updated to logged-out state');
        }
        
        // Clear user info from localStorage
        localStorage.removeItem('user_info');
        localStorage.removeItem('username');
    }
}

// Function to check localStorage and display welcome message on page load
export function checkLoginState() {
    // Guard: Prevent duplicate execution per page load
    if (window.__loginStateChecked) return;
    window.__loginStateChecked = true;
    
    // Check for display_name first (new format), then fallback to username (old format)
    const displayName = localStorage.getItem('display_name') || localStorage.getItem('username');
    const userProfileArea = document.getElementById('user-profile-area');
    const userGreeting = document.getElementById('user-greeting');
    
    if (displayName && userProfileArea && userGreeting) {
        // Get current language from HTML lang attribute
        const currentLang = document.documentElement.lang || 'en';
        const langCode = currentLang.split('-')[0];
        
        // Get language-dependent greeting
        const greeting = getAuthGreetingText(langCode);
        
        // Update greeting text - use "Welcome" format as requested
        const welcomeText = langCode === 'ar' ? 'مرحبا' : langCode === 'he' ? 'שלום' : 'Welcome';
        userGreeting.innerHTML = `${welcomeText}, <span id="user-display-name" style="color: #FFD700; font-weight: 600;">${displayName}</span> 👑`;
        
        // Show user profile area
        userProfileArea.style.display = 'flex';
        
        console.log('✅ Welcome message displayed from localStorage:', displayName);
    } else if (userProfileArea) {
        // No display name found, hide the profile area
        userProfileArea.style.display = 'none';
        console.log('ℹ️ No user logged in, hiding profile area');
    }
}

// Helper function to get greeting text based on language
// Use window function if available, otherwise define locally
function getAuthGreetingText(langCode) {
    if (typeof window.getGreetingText === 'function') {
        return window.getGreetingText(langCode);
    }
    const greetings = {
        'ar': 'مرحبا',
        'he': 'שלום',
        'en': 'Welcome'
    };
    return greetings[langCode] || greetings['en'];
}

// Make checkLoginState available globally (both export and window for compatibility)
window.checkLoginState = checkLoginState;

// Also attach other commonly used functions to window for compatibility
// This ensures functions are available even if module loading fails
window.updateAuthUI = updateAuthUI;
window.updateGreetingForCurrentUser = updateGreetingForCurrentUser;
window.signIn = signIn;
window.login = login; // Alias for signIn
window.signInWithGoogle = signInWithGoogle;
window.googleLogin = googleLogin; // Alias for signInWithGoogle
window.signUp = signUp;
window.signup = signup; // Alias for signUp
window.signOut = signOut;
window.logout = logout; // Alias for signOut
// DO NOT override window.addToCart - app.js defines the wrapper that handles both strings and objects
// window.addToCart = addToCart; // REMOVED - app.js handles this
window.addToFirestoreCart = addToFirestoreCart;
window.getFirestoreCart = getFirestoreCart;
window.updateFirestoreCartItem = updateFirestoreCartItem;
window.removeFirestoreCartItem = removeFirestoreCartItem;
window.addToFirestoreWishlist = addToFirestoreWishlist;
window.getFirestoreWishlist = getFirestoreWishlist;
window.removeFirestoreWishlistItem = removeFirestoreWishlistItem;
window.isInFirestoreWishlist = isInFirestoreWishlist;

// Attach auth and db to window for compatibility
window.auth = auth;
window.db = db;

// Re-export auth and db for other modules that might need them
export { auth, db };

