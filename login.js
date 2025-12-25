// Login.js - Firebase Authentication + FastAPI Backend Integration
console.log("🔥 LOGIN.JS LOADED");

import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { app, db } from "./firebase-frontend-config.js";

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Backend API URL
const BACKEND_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://127.0.0.1:8000'  // FastAPI default port
    : window.location.origin;  // Use same origin in production

// DOM Elements (only for login.html - may be null in other pages)
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const btnGoogleLogin = document.getElementById("btn-google-login");
const messageContainer = document.getElementById("message-container");

// Functions will be exported at the end of the file

// Reusable email/password login function
async function handleEmailPasswordLogin(email, password, messageCallback = null) {
    console.log("🔄 Starting email/password login...");
    console.log("📧 Email:", email);
    
    try {
        // Step 1: Firebase Authentication
        console.log("🔄 Calling signInWithEmailAndPassword...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Firebase authentication successful:", user.email);
        console.log("✅ User UID:", user.uid);
        
        // Step 2: Get Firebase ID Token
        console.log("🔄 Getting Firebase ID token...");
        const idToken = await user.getIdToken();
        console.log("✅ Firebase token obtained:", idToken.substring(0, 20) + "...");
        
        // Step 3: Send token to backend for verification
        console.log("🔄 Sending token to backend:", `${BACKEND_URL}/auth/verify-token`);
        const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ token: idToken }),
        });
        
        console.log("📡 Backend response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("📩 Backend response:", data);
            
            // Store backend JWT token and user info
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("jwt_token", data.access_token);
                console.log("✅ Backend JWT token stored");
            } else {
                localStorage.setItem("access_token", idToken);
                localStorage.setItem("jwt_token", idToken);
                console.log("⚠️ No access_token in response, using Firebase token");
            }
            
            // Store user info
            const displayName = data.user?.display_name || data.user?.email?.split('@')[0] || email.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName);
            localStorage.setItem("email", data.user?.email || user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: data.user?.uid || user.uid,
                email: data.user?.email || user.email,
                displayName: displayName,
                role: data.user?.role || 'client'
            }));
            
            console.log("✅ User info stored:", displayName);
            
            if (messageCallback) {
                messageCallback("✅ تسجيل الدخول ناجح!", 'success');
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
            
        } else {
            // Backend verification failed, but Firebase auth succeeded
            const errorText = await response.text();
            console.warn("⚠️ Backend verification failed:", response.status, errorText);
            console.warn("⚠️ Using Firebase token as fallback");
            
            // Store Firebase token
            localStorage.setItem("access_token", idToken);
            localStorage.setItem("jwt_token", idToken);
            const displayName = user.displayName || user.email?.split('@')[0] || email.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName);
            localStorage.setItem("email", user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            
            console.log("✅ Fallback: Using Firebase token, username stored:", displayName);
            
            if (messageCallback) {
                messageCallback("✅ تسجيل الدخول ناجح! (Fallback mode)", 'success');
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
        }
        
    } catch (error) {
        console.error("❌ Error during login:", error);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error message:", error.message);
        
        let errorMsg = "⚠️ خطأ أثناء تسجيل الدخول: " + error.message;
        if (error.code === 'auth/user-not-found') {
            errorMsg = "❌ المستخدم غير موجود";
        } else if (error.code === 'auth/wrong-password') {
            errorMsg = "❌ كلمة المرور غير صحيحة";
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = "❌ البريد الإلكتروني غير صحيح";
        }
        
        if (messageCallback) {
            messageCallback(errorMsg, 'error');
        }
        
        throw error;
    }
}

// Reusable Google login function
async function handleGoogleLogin(messageCallback = null) {
    console.log("🔄 Starting Google login...");
    
    try {
        // Step 1: Firebase Google Authentication
        console.log("🔄 Calling signInWithPopup...");
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;
        console.log("✅ Google authentication successful:", user.email);
        console.log("✅ User UID:", user.uid);
        
        // Step 2: Get Firebase ID Token
        console.log("🔄 Getting Firebase ID token...");
        const idToken = await user.getIdToken();
        console.log("✅ Firebase token obtained:", idToken.substring(0, 20) + "...");
        
        // Step 3: Send token to backend for verification
        console.log("🔄 Sending token to backend:", `${BACKEND_URL}/auth/verify-token`);
        const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ token: idToken }),
        });
        
        console.log("📡 Backend response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("📩 Backend response:", data);
            
            // Store backend JWT token and user info
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("jwt_token", data.access_token);
                console.log("✅ Backend JWT token stored");
            } else {
                localStorage.setItem("access_token", idToken);
                localStorage.setItem("jwt_token", idToken);
                console.log("⚠️ No access_token in response, using Firebase token");
            }
            
            // Store user info
            const displayName = data.user?.display_name || user.displayName || user.email?.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName);
            localStorage.setItem("email", data.user?.email || user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: data.user?.uid || user.uid,
                email: data.user?.email || user.email,
                displayName: displayName,
                role: data.user?.role || 'client'
            }));
            
            console.log("✅ User info stored:", displayName);
            
            if (messageCallback) {
                messageCallback("✅ تسجيل الدخول ناجح!", 'success');
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
            
        } else {
            // Backend verification failed, but Firebase auth succeeded
            const errorText = await response.text();
            console.warn("⚠️ Backend verification failed:", response.status, errorText);
            console.warn("⚠️ Using Firebase token as fallback");
            
            // Store Firebase token
            localStorage.setItem("access_token", idToken);
            localStorage.setItem("jwt_token", idToken);
            const displayName = user.displayName || user.email?.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName);
            localStorage.setItem("email", user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            
            console.log("✅ Fallback: Using Firebase token, username stored:", displayName);
            
            if (messageCallback) {
                messageCallback("✅ تسجيل الدخول ناجح! (Fallback mode)", 'success');
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
        }
        
    } catch (error) {
        console.error("❌ Error during Google login:", error);
        
        // Don't show error if user closed the popup
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("ℹ️ User closed Google login popup");
            return;
        }
        
        let errorMsg = "⚠️ خطأ أثناء تسجيل الدخول: " + error.message;
        if (error.code === 'auth/popup-blocked') {
            errorMsg = "❌ تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMsg = "❌ يوجد حساب بالفعل بطريقة تسجيل دخول مختلفة";
        }
        
        if (messageCallback) {
            messageCallback(errorMsg, 'error');
        }
        
        throw error;
    }
}

// Helper function to get user role from Firestore and redirect
async function handleLoginRedirect(user) {
    console.log("📌 Starting handleLoginRedirect");
    console.log("📌 User:", user.email);
    console.log("📌 User UID:", user.uid);
    console.log("📌 Expected Admin UID: lGrWC5S4KWhEuHtEOZEHKY7vQ5B3");
    
    // Set timeout to ensure redirect happens even if Firestore is slow
    let redirectExecuted = false;
    const timeoutId = setTimeout(() => {
        if (!redirectExecuted) {
            redirectExecuted = true;
            console.log("⏰ Redirect timeout - redirecting to index.html as fallback");
            localStorage.setItem("userRole", "client");
            // Guard: Prevent redirect to same page and infinite loops
            if (window.__alreadyRedirected) return;
            const target = "index.html";
            if (!window.location.pathname.includes(target)) {
                window.__alreadyRedirected = true;
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'index.html' (timeout fallback)", new Error().stack);
                window.location.href = target;
            }
        }
    }, 3000); // 3 second timeout
    
    try {
        // Read role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        console.log("📌 Firestore path: users/" + user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // Log the returned Firestore data
        console.log("📌 Document exists:", userDoc.exists());
        console.log("📄 Firestore document:", userDoc.data());
        
        // Extract role properly
        let role = "client";
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("📄 User data:", userData);
            if (userData && userData.role) {
                role = String(userData.role).trim(); // Ensure it's a string and trim whitespace
                console.log("✅ Role found in document:", role);
                console.log("✅ Role length:", role.length);
                console.log("✅ Role char codes:", Array.from(role).map(c => c.charCodeAt(0)));
            } else {
                console.warn("⚠️ Role field not found in document");
                console.warn("⚠️ Available fields:", Object.keys(userData || {}));
            }
        } else {
            console.warn("⚠️ Firestore document does not exist for UID:", user.uid);
            console.warn("⚠️ This means the user document needs to be created in Firestore");
        }
        
        // Save role into localStorage
        localStorage.setItem("userRole", role);
        console.log("💾 Role saved to localStorage:", role);
        console.log("💾 localStorage.getItem('userRole'):", localStorage.getItem("userRole"));
        
        // Clear timeout since we got the role
        clearTimeout(timeoutId);
        
        // Add the correct redirect with strict comparison
        const isAdmin = role === "admin";
        console.log("🔍 Role comparison check:");
        console.log("   role value:", JSON.stringify(role));
        console.log("   role type:", typeof role);
        console.log("   role === 'admin':", isAdmin);
        console.log("   role.toLowerCase() === 'admin':", role.toLowerCase() === "admin");
        
        if (!redirectExecuted) {
            redirectExecuted = true;
            if (isAdmin) {
                console.log("✨ ADMIN ROLE DETECTED - Redirecting to admin.html…");
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'admin.html' (admin role)", new Error().stack);
                window.location.href = "admin.html";
            } else {
                console.log("➡️ CLIENT ROLE DETECTED - Redirecting to index.html…");
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'index.html' (client role)", new Error().stack);
                window.location.href = "index.html";
            }
        }
    } catch (error) {
        console.error("❌ Error retrieving user role:", error);
        console.error("❌ Error stack:", error.stack);
        // Clear timeout
        clearTimeout(timeoutId);
        // Fallback: default to client role
        if (!redirectExecuted) {
            redirectExecuted = true;
            const fallbackRole = "client";
            localStorage.setItem("userRole", fallbackRole);
            console.log("💾 Role saved:", fallbackRole, "(fallback due to error)");
            console.log("➡️ Redirecting to index.html…");
            // Guard: Prevent redirect to same page and infinite loops
            if (window.__alreadyRedirected) return;
            const target = "index.html";
            if (!window.location.pathname.includes(target)) {
                window.__alreadyRedirected = true;
                window.location.href = target;
            }
        }
    }
}

// Helper functions for messages (null-safe for use in other pages)
function showMessage(text, type = 'success') {
    if (messageContainer) {
    messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
    const message = messageContainer.querySelector('.message');
        if (message) {
    message.style.display = 'block';
    // Auto-hide after 5 seconds
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
        }
    }
}

function hideMessage() {
    if (messageContainer) {
    messageContainer.innerHTML = '';
    }
}

// Main login handler (only for login.html - skip if form doesn't exist)
if (loginForm && emailInput && passwordInput && btnLogin) {
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showMessage("الرجاء إدخال البريد الإلكتروني وكلمة المرور", 'error');
        return;
    }
    
    // Disable button during submission
    btnLogin.disabled = true;
    const originalText = btnLogin.textContent;
    btnLogin.textContent = "جاري تسجيل الدخول...";
    
    console.log("🔄 Starting login process...");
    console.log("📧 Email:", email);
    
    try {
        // Step 1: Firebase Authentication
        console.log("🔄 Calling signInWithEmailAndPassword...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Firebase authentication successful:", user.email);
        console.log("✅ User UID:", user.uid);
        
        // Step 2: Get Firebase ID Token
        console.log("🔄 Getting Firebase ID token...");
        const idToken = await user.getIdToken();
        console.log("✅ Firebase token obtained:", idToken.substring(0, 20) + "...");
        
        // Step 3: Send token to backend for verification
        console.log("🔄 Sending token to backend:", `${BACKEND_URL}/auth/verify-token`);
        const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ token: idToken }),
        });
        
        console.log("📡 Backend response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("📩 Backend response:", data);
            
            // Store backend JWT token and user info
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("jwt_token", data.access_token); // Keep for backward compatibility
                console.log("✅ Backend JWT token stored");
            } else {
                // Fallback to Firebase token
                localStorage.setItem("access_token", idToken);
                localStorage.setItem("jwt_token", idToken); // Keep for backward compatibility
                console.log("⚠️ No access_token in response, using Firebase token");
            }
            
            // Store user info
            const displayName = data.user?.display_name || data.user?.email?.split('@')[0] || email.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName); // Keep for backward compatibility
            localStorage.setItem("email", data.user?.email || user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: data.user?.uid || user.uid,
                email: data.user?.email || user.email,
                displayName: displayName,
                role: data.user?.role || 'client'
            }));
            
            console.log("✅ User info stored:", displayName);
            console.log("✅ تسجيل الدخول ناجح!");
            
            // Show redirecting message
            if (btnLogin) {
                btnLogin.textContent = "جاري التوجيه...";
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
            
        } else {
            // Backend verification failed, but Firebase auth succeeded
            // Use Firebase token as fallback
            const errorText = await response.text();
            console.warn("⚠️ Backend verification failed:", response.status, errorText);
            console.warn("⚠️ Using Firebase token as fallback");
            
            // Store Firebase token
            localStorage.setItem("access_token", idToken);
            localStorage.setItem("jwt_token", idToken); // Keep for backward compatibility
            const displayName = user.displayName || user.email?.split('@')[0] || email.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName); // Keep for backward compatibility
            localStorage.setItem("email", user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            
            console.log("✅ Fallback: Using Firebase token, username stored:", displayName);
            console.log("✅ تسجيل الدخول ناجح! (Fallback mode)");
            
            // Show redirecting message
            if (btnLogin) {
                btnLogin.textContent = "جاري التوجيه...";
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
        }
        
    } catch (error) {
        console.error("❌ Error during login:", error);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error message:", error.message);
        
        // Show error message in Arabic
        let errorMsg = "⚠️ خطأ أثناء تسجيل الدخول: " + error.message;
        if (error.code === 'auth/user-not-found') {
            errorMsg = "❌ المستخدم غير موجود";
        } else if (error.code === 'auth/wrong-password') {
            errorMsg = "❌ كلمة المرور غير صحيحة";
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = "❌ عنوان البريد الإلكتروني غير صالح";
        } else if (error.code === 'auth/user-disabled') {
            errorMsg = "❌ تم تعطيل هذا الحساب";
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = "❌ محاولات كثيرة جداً. يرجى المحاولة لاحقاً";
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = "❌ فشل الاتصال بالشبكة. يرجى المحاولة مرة أخرى";
        }
        
        showMessage(errorMsg, 'error');
        
        // Re-enable button
        btnLogin.disabled = false;
        btnLogin.textContent = originalText;
    }
});
}

// Google Login handler (only for login.html - skip if button doesn't exist)
if (btnGoogleLogin) {
btnGoogleLogin.addEventListener("click", async (e) => {
    e.preventDefault();
    hideMessage();
    
    // Disable button during submission
    btnGoogleLogin.disabled = true;
    const originalText = btnGoogleLogin.innerHTML;
    btnGoogleLogin.innerHTML = '<span>جاري المعالجة...</span>';
    
    console.log("🔄 Starting Google login...");
    
    try {
        // Step 1: Firebase Google Authentication
        console.log("🔄 Calling signInWithPopup...");
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;
        console.log("✅ Google authentication successful:", user.email);
        console.log("✅ User UID:", user.uid);
        
        // Step 2: Get Firebase ID Token
        console.log("🔄 Getting Firebase ID token...");
        const idToken = await user.getIdToken();
        console.log("✅ Firebase token obtained:", idToken.substring(0, 20) + "...");
        
        // Step 3: Send token to backend for verification
        console.log("🔄 Sending token to backend:", `${BACKEND_URL}/auth/verify-token`);
        const response = await fetch(`${BACKEND_URL}/auth/verify-token`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ token: idToken }),
        });
        
        console.log("📡 Backend response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("📩 Backend response:", data);
            
            // Store backend JWT token and user info
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("jwt_token", data.access_token); // Keep for backward compatibility
                console.log("✅ Backend JWT token stored");
            } else {
                localStorage.setItem("access_token", idToken);
                localStorage.setItem("jwt_token", idToken); // Keep for backward compatibility
                console.log("⚠️ No access_token in response, using Firebase token");
            }
            
            // Store user info
            const displayName = data.user?.display_name || user.displayName || user.email?.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName); // Keep for backward compatibility
            localStorage.setItem("email", data.user?.email || user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: data.user?.uid || user.uid,
                email: data.user?.email || user.email,
                displayName: displayName,
                role: data.user?.role || 'client'
            }));
            
            console.log("✅ User info stored:", displayName);
            console.log("✅ تسجيل الدخول ناجح!");
            
            // Show redirecting message
            if (btnGoogleLogin) {
                btnGoogleLogin.innerHTML = '<span>جاري التوجيه...</span>';
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
            
        } else {
            // Backend verification failed, but Firebase auth succeeded
            const errorText = await response.text();
            console.warn("⚠️ Backend verification failed:", response.status, errorText);
            console.warn("⚠️ Using Firebase token as fallback");
            
            // Store Firebase token
            localStorage.setItem("access_token", idToken);
            localStorage.setItem("jwt_token", idToken); // Keep for backward compatibility
            const displayName = user.displayName || user.email?.split('@')[0];
            localStorage.setItem("display_name", displayName);
            localStorage.setItem("username", displayName); // Keep for backward compatibility
            localStorage.setItem("email", user.email);
            
            // Store full user info (role will be updated by handleLoginRedirect)
            localStorage.setItem("user_info", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: 'client'
            }));
            
            console.log("✅ Fallback: Using Firebase token, username stored:", displayName);
            console.log("✅ تسجيل الدخول ناجح! (Fallback mode)");
            
            // Show redirecting message
            if (btnGoogleLogin) {
                btnGoogleLogin.innerHTML = '<span>جاري التوجيه...</span>';
            }
            
            // Get role from Firestore and redirect accordingly
            await handleLoginRedirect(user);
        }
        
    } catch (error) {
        console.error("❌ Error during Google login:", error);
        
        // Don't show error if user closed the popup
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("ℹ️ User closed Google login popup");
            // Re-enable button
            btnGoogleLogin.disabled = false;
            btnGoogleLogin.innerHTML = originalText;
            return;
        }
        
        // Show error message
        let errorMsg = "⚠️ خطأ أثناء تسجيل الدخول: " + error.message;
        if (error.code === 'auth/popup-blocked') {
            errorMsg = "❌ تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMsg = "❌ يوجد حساب بالفعل بطريقة تسجيل دخول مختلفة";
        }
        
        showMessage(errorMsg, 'error');
        
        // Re-enable button
        btnGoogleLogin.disabled = false;
        btnGoogleLogin.innerHTML = originalText;
    }
});
}

// Clear messages when user starts typing
[emailInput, passwordInput].forEach(input => {
    if (input) {
        input.addEventListener('input', () => {
            hideMessage();
        });
    }
});

// Redirect authenticated users away from login page
// Guard: Only register if not already registered globally
if (!window.__loginPageAuthListenerInitialized) {
  window.__loginPageAuthListenerInitialized = true;
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    
    // CRITICAL: Only redirect if we're on login.html
    // This prevents infinite refresh loops on index.html and other pages
    if (!window.location.pathname.includes('login.html')) {
      console.log("🔐 User authenticated but not on login page, skipping redirect");
      return;
    }
    
    // Guard: Prevent auth redirect from firing repeatedly
    if (window.__authRedirectDone) {
        console.log("🔐 Auth redirect already executed, skipping");
        return;
    }
    window.__authRedirectDone = true;
    
    console.log("🔐 User already authenticated, redirecting from login page...");
    // User is logged in, redirect them away from login page
    handleLoginRedirect(user).catch((error) => {
        console.error("❌ Error in redirect:", error);
        // Fallback: redirect to index.html if handleLoginRedirect fails
        // Guard: Prevent redirect to same page and infinite loops
        if (window.__alreadyRedirected) return;
        const target = "index.html";
        if (!window.location.pathname.includes(target)) {
            window.__alreadyRedirected = true;
            console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'index.html' (handleLoginRedirect error)", new Error().stack);
            window.location.href = target;
        }
    });
  });
}

console.log("✅ Login.js loaded successfully");

// Export functions for use in other pages (like index.html)
export { handleEmailPasswordLogin, handleGoogleLogin, handleLoginRedirect };

