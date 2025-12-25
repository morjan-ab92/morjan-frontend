// Welcome Message Display System - Works on All Pages
// This file ensures "Welcome, [username] 👑" appears on all pages after login

/**
 * Get greeting text based on language
 * Uses window.getGreetingText if available, otherwise defines it
 */
function getWelcomeGreetingText(langCode) {
    const greetings = {
        'ar': 'مرحبا',
        'he': 'שלום',
        'en': 'Welcome'
    };
    return greetings[langCode] || greetings['en'];
}

/**
 * Display welcome message on page load
 * Checks localStorage for display_name and shows welcome message in header
 */
function displayWelcomeMessage() {
    // Check for display_name first (new format), then fallback to username (old format)
    const displayName = localStorage.getItem('display_name') || localStorage.getItem('username');
    const userProfileArea = document.getElementById('user-profile-area');
    const userGreeting = document.getElementById('user-greeting');
    
    if (displayName && userProfileArea && userGreeting) {
        // Get current language from HTML lang attribute
        const currentLang = document.documentElement.lang || 'en';
        const langCode = currentLang.split('-')[0];
        
        // Get language-dependent greeting - use window function if available, otherwise use local
        const greeting = (typeof window.getGreetingText === 'function') 
            ? window.getGreetingText(langCode) 
            : getWelcomeGreetingText(langCode);
        
        // Update greeting text - format: "Welcome, [username] 👑"
        userGreeting.innerHTML = `${greeting}, <span id="user-display-name" style="color: #FFD700; font-weight: 600;">${displayName}</span> 👑`;
        
        // Show user profile area
        userProfileArea.style.display = 'flex';
        
        console.log('✅ Welcome message displayed:', displayName);
    } else if (userProfileArea) {
        // No display name found, hide the profile area
        userProfileArea.style.display = 'none';
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Guard: Prevent duplicate welcome message display
        if (window.__welcomeMessageDisplayed) {
            console.log('✅ Welcome message already displayed, skipping');
            return;
        }
        window.__welcomeMessageDisplayed = true;
        setTimeout(displayWelcomeMessage, 100);
    });
} else {
    // Guard: Prevent duplicate welcome message display
    if (window.__welcomeMessageDisplayed) {
        console.log('✅ Welcome message already displayed, skipping');
        return;
    }
    window.__welcomeMessageDisplayed = true;
    setTimeout(displayWelcomeMessage, 100);
}

// Also run when language changes
document.addEventListener('languageChanged', () => {
    setTimeout(displayWelcomeMessage, 100);
});

// Make function globally available (only if not already defined)
if (typeof window.displayWelcomeMessage === 'undefined') {
    window.displayWelcomeMessage = displayWelcomeMessage;
}
// Only set getGreetingText if it doesn't exist
if (typeof window.getGreetingText === 'undefined') {
    window.getGreetingText = getWelcomeGreetingText;
}

console.log('✅ Welcome message system loaded');

