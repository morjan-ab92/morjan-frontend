/* ===== J&A JEWELRY - ENHANCED GLOBAL JAVASCRIPT ===== */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentLanguage = 'ar';
let cartItems = [];
let wishlistItems = [];

// Translations
const translations = {
  ar: {
    "brand-main": "J&A Jewelry",
    "brand-sub": "حيث يلتقي الذوق الرفيع بالفخامة",
    "brand-slogan": "الفخامة تليق بك.",
    "nav-home": "الرئيسية",
    "nav-perfumes": "العطور",
    "nav-watches": "الساعات",
    "nav-bags": "الحقائب",
    "nav-accessories": "الإكسسوارات",
    "nav-products": "المنتجات",
    "nav-cart": "السلة",
    "nav-about": "عنا",
    "nav-contact": "تواصل",
    "nav-admin": "لوحة التحكم",
    "btn-shop": "تسوق الآن",
    "btn-show-all": "عرض الكل",
    "btn-add-to-cart": "أضف إلى السلة",
    "btn-buy-now": "اشتري الآن",
    "btn-login": "تسجيل الدخول",
    "btn-register": "إنشاء حساب",
    "btn-logout": "تسجيل الخروج",
    "btn-checkout": "الدفع",
    "btn-continue-shopping": "متابعة التسوق",
    "cart.title": "سلة التسوق",
    "cart.subtitle": "راجع العناصر المحددة",
    "cart.items": "عناصر السلة",
    "cart.order_summary": "ملخص الطلب",
    "cart.subtotal": "المجموع الفرعي",
    "cart.shipping": "الشحن",
    "cart.tax": "الضريبة",
    "cart.total": "المجموع",
    "cart.checkout": "الدفع",
    "cart.continue_shopping": "متابعة التسوق",
    "cart.empty_title": "سلة التسوق فارغة",
    "cart.empty_message": "يبدو أنك لم تضيف أي عناصر إلى سلة التسوق بعد.",
    "cart.start_shopping": "ابدأ التسوق",
    "auth.login": "تسجيل الدخول",
    "auth.register": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.confirm_password": "تأكيد كلمة المرور",
    "auth.forgot_password": "نسيت كلمة المرور؟",
    "auth.google_signin": "تسجيل الدخول بـ Google",
    "auth.guest_checkout": "المتابعة كضيف",
    "checkout.title": "الدفع",
    "checkout.shipping_title": "معلومات الشحن",
    "checkout.payment_title": "طريقة الدفع",
    "checkout.review_title": "مراجعة الطلب",
    "checkout.first_name": "الاسم الأول",
    "checkout.last_name": "الاسم الأخير",
    "checkout.email": "البريد الإلكتروني",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.city": "المدينة",
    "checkout.postal_code": "الرمز البريدي",
    "checkout.credit_card": "بطاقة ائتمان",
    "checkout.secure_payment": "دفع آمن",
    "checkout.paypal_desc": "دفع عبر PayPal",
    "checkout.cash_delivery": "الدفع عند الاستلام",
    "checkout.cash_desc": "دفع نقدي عند التسليم",
    "checkout.notes": "ملاحظات إضافية (اختياري)",
    "checkout.discount_code": "كود الخصم (اختياري)",
    "checkout.order_summary": "ملخص الطلب",
    "checkout.subtotal": "المجموع الفرعي",
    "checkout.shipping": "الشحن",
    "checkout.tax": "الضريبة",
    "checkout.discount": "الخصم",
    "checkout.total": "المجموع",
    "checkout.place_order": "تأكيد الطلب",
    "checkout.processing": "جاري معالجة طلبك...",
    "search.placeholder": "ابحث عن المنتجات...",
    "search.no_results": "لم يتم العثور على نتائج",
    "wishlist.title": "قائمة الأمنيات",
    "wishlist.empty": "قائمة الأمنيات فارغة",
    "wishlist.added": "تم إضافة المنتج إلى قائمة الأمنيات",
    "wishlist.removed": "تم إزالة المنتج من قائمة الأمنيات",
    "product.added_to_cart": "تم إضافة المنتج إلى السلة",
    "product.out_of_stock": "المنتج غير متوفر",
    "product.in_stock": "متوفر",
    "product.limited_stock": "كمية محدودة",
    "language.arabic": "العربية",
    "language.hebrew": "עברית",
    "language.english": "English",
    "error.generic": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "error.network": "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.",
    "error.auth": "خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.",
    "success.order_placed": "تم تأكيد طلبك بنجاح!",
    "success.product_added": "تم إضافة المنتج بنجاح",
    "success.profile_updated": "تم تحديث الملف الشخصي بنجاح"
  },
  he: {
    "brand-main": "J&A Jewelry",
    "brand-sub": "כאשר האלגנטיות פוגשת את היוקרה",
    "brand-slogan": "יוקרה שמדברת אליך.",
    "nav-home": "בית",
    "nav-perfumes": "בשמים",
    "nav-watches": "שעונים",
    "nav-bags": "תיקים",
    "nav-accessories": "אביזרים",
    "nav-products": "מוצרים",
    "nav-cart": "עגלה",
    "nav-about": "אודות",
    "nav-contact": "צור קשר",
    "nav-admin": "לוח בקרה",
    "btn-shop": "קני עכשיו",
    "btn-show-all": "הצג הכל",
    "btn-add-to-cart": "הוסף לעגלה",
    "btn-buy-now": "קנה עכשיו",
    "btn-login": "התחבר",
    "btn-register": "הירשם",
    "btn-logout": "התנתק",
    "btn-checkout": "תשלום",
    "btn-continue-shopping": "המשך קניות",
    "cart.title": "עגלת קניות",
    "cart.subtitle": "סקור את הפריטים שנבחרו",
    "cart.items": "פריטי עגלה",
    "cart.order_summary": "סיכום הזמנה",
    "cart.subtotal": "סכום ביניים",
    "cart.shipping": "משלוח",
    "cart.tax": "מס",
    "cart.total": "סה\"כ",
    "cart.checkout": "תשלום",
    "cart.continue_shopping": "המשך קניות",
    "cart.empty_title": "עגלת הקניות ריקה",
    "cart.empty_message": "נראה שלא הוספת פריטים לעגלת הקניות עדיין.",
    "cart.start_shopping": "התחל לקנות",
    "auth.login": "התחברות",
    "auth.register": "הרשמה",
    "auth.email": "אימייל",
    "auth.password": "סיסמה",
    "auth.confirm_password": "אשר סיסמה",
    "auth.forgot_password": "שכחת סיסמה?",
    "auth.google_signin": "התחבר עם Google",
    "auth.guest_checkout": "המשך כאורח",
    "checkout.title": "תשלום",
    "checkout.shipping_title": "פרטי משלוח",
    "checkout.payment_title": "אמצעי תשלום",
    "checkout.review_title": "סקירת הזמנה",
    "checkout.first_name": "שם פרטי",
    "checkout.last_name": "שם משפחה",
    "checkout.email": "אימייל",
    "checkout.phone": "טלפון",
    "checkout.address": "כתובת",
    "checkout.city": "עיר",
    "checkout.postal_code": "מיקוד",
    "checkout.credit_card": "כרטיס אשראי",
    "checkout.secure_payment": "תשלום מאובטח",
    "checkout.paypal_desc": "תשלום דרך PayPal",
    "checkout.cash_delivery": "תשלום במזומן בהגעה",
    "checkout.cash_desc": "תשלום במזומן במסירה",
    "checkout.notes": "הערות נוספות (אופציונלי)",
    "checkout.discount_code": "קוד הנחה (אופציונלי)",
    "checkout.order_summary": "סיכום הזמנה",
    "checkout.subtotal": "סכום ביניים",
    "checkout.shipping": "משלוח",
    "checkout.tax": "מס",
    "checkout.discount": "הנחה",
    "checkout.total": "סה\"כ",
    "checkout.place_order": "אשר הזמנה",
    "checkout.processing": "מעבד את ההזמנה שלך...",
    "search.placeholder": "חפש מוצרים...",
    "search.no_results": "לא נמצאו תוצאות",
    "wishlist.title": "רשימת משאלות",
    "wishlist.empty": "רשימת המשאלות ריקה",
    "wishlist.added": "המוצר נוסף לרשימת המשאלות",
    "wishlist.removed": "המוצר הוסר מרשימת המשאלות",
    "product.added_to_cart": "המוצר נוסף לעגלה",
    "product.out_of_stock": "המוצר לא זמין",
    "product.in_stock": "זמין",
    "product.limited_stock": "כמות מוגבלת",
    "language.arabic": "العربية",
    "language.hebrew": "עברית",
    "language.english": "English",
    "error.generic": "אירעה שגיאה. אנא נסה שוב.",
    "error.network": "שגיאת חיבור. בדוק את החיבור לאינטרנט.",
    "error.auth": "שגיאת אימות. אנא התחבר שוב.",
    "success.order_placed": "ההזמנה שלך אושרה בהצלחה!",
    "success.product_added": "המוצר נוסף בהצלחה",
    "success.profile_updated": "הפרופיל עודכן בהצלחה"
  },
  en: {
    "brand-main": "J&A Jewelry",
    "brand-sub": "Where Elegance Meets Luxury",
    "brand-slogan": "Luxury that speaks to you.",
    "nav-home": "Home",
    "nav-perfumes": "Perfumes",
    "nav-watches": "Watches",
    "nav-bags": "Bags",
    "nav-accessories": "Accessories",
    "nav-products": "Products",
    "nav-cart": "Cart",
    "nav-about": "About",
    "nav-contact": "Contact",
    "nav-admin": "Admin Dashboard",
    "btn-shop": "Shop Now",
    "btn-show-all": "Show All",
    "btn-add-to-cart": "Add to Cart",
    "btn-buy-now": "Buy Now",
    "btn-login": "Login",
    "btn-register": "Register",
    "btn-logout": "Logout",
    "btn-checkout": "Checkout",
    "btn-continue-shopping": "Continue Shopping",
    "cart.title": "Shopping Cart",
    "cart.subtitle": "Review selected items",
    "cart.items": "Cart Items",
    "cart.order_summary": "Order Summary",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.tax": "Tax",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.continue_shopping": "Continue Shopping",
    "cart.empty_title": "Shopping Cart is Empty",
    "cart.empty_message": "It looks like you haven't added any items to your cart yet.",
    "cart.start_shopping": "Start Shopping",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirm_password": "Confirm Password",
    "auth.forgot_password": "Forgot Password?",
    "auth.google_signin": "Sign in with Google",
    "auth.guest_checkout": "Continue as Guest",
    "checkout.title": "Checkout",
    "checkout.shipping_title": "Shipping Information",
    "checkout.payment_title": "Payment Method",
    "checkout.review_title": "Review Order",
    "checkout.first_name": "First Name",
    "checkout.last_name": "Last Name",
    "checkout.email": "Email",
    "checkout.phone": "Phone",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.postal_code": "Postal Code",
    "checkout.credit_card": "Credit Card",
    "checkout.secure_payment": "Secure Payment",
    "checkout.paypal_desc": "Pay with PayPal",
    "checkout.cash_delivery": "Cash on Delivery",
    "checkout.cash_desc": "Pay cash on delivery",
    "checkout.notes": "Additional Notes (Optional)",
    "checkout.discount_code": "Discount Code (Optional)",
    "checkout.order_summary": "Order Summary",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping": "Shipping",
    "checkout.tax": "Tax",
    "checkout.discount": "Discount",
    "checkout.total": "Total",
    "checkout.place_order": "Place Order",
    "checkout.processing": "Processing your order...",
    "search.placeholder": "Search products...",
    "search.no_results": "No results found",
    "wishlist.title": "Wishlist",
    "wishlist.empty": "Wishlist is empty",
    "wishlist.added": "Product added to wishlist",
    "wishlist.removed": "Product removed from wishlist",
    "product.added_to_cart": "Product added to cart",
    "product.out_of_stock": "Out of stock",
    "product.in_stock": "In stock",
    "product.limited_stock": "Limited stock",
    "language.arabic": "العربية",
    "language.hebrew": "עברית",
    "language.english": "English",
    "error.generic": "An error occurred. Please try again.",
    "error.network": "Connection error. Check your internet connection.",
    "error.auth": "Authentication error. Please login again.",
    "success.order_placed": "Your order has been confirmed successfully!",
    "success.product_added": "Product added successfully",
    "success.profile_updated": "Profile updated successfully"
  }
};

// Language and RTL Management
class LanguageManager {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.init();
  }

  detectLanguage() {
    // Check localStorage first
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }

    // Detect from browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }

    // Default to Arabic
    return 'ar';
  }

  init() {
    this.setLanguage(this.currentLanguage);
    this.setupLanguageSwitcher();
  }

  setLanguage(lang) {
    if (!translations[lang]) return;

    this.currentLanguage = lang;
    localStorage.setItem('language', lang);

    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = translations[lang][key];
      if (translation) {
        element.textContent = translation;
      }
    });

    // Update placeholder texts
    document.querySelectorAll('[data-placeholder]').forEach(element => {
      const key = element.getAttribute('data-placeholder');
      const translation = translations[lang][key];
      if (translation) {
        element.placeholder = translation;
      }
    });

    // Update page title
    const titleKey = document.title;
    const titleTranslation = translations[lang][titleKey];
    if (titleTranslation) {
      document.title = titleTranslation;
    }
  }

  setupLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
      switcher.innerHTML = `
        <button onclick="languageManager.setLanguage('ar')" class="lang-btn ${this.currentLanguage === 'ar' ? 'active' : ''}">العربية</button>
        <button onclick="languageManager.setLanguage('he')" class="lang-btn ${this.currentLanguage === 'he' ? 'active' : ''}">עברית</button>
        <button onclick="languageManager.setLanguage('en')" class="lang-btn ${this.currentLanguage === 'en' ? 'active' : ''}">English</button>
      `;
    }
  }

  translate(key) {
    return translations[this.currentLanguage][key] || key;
  }
}

// Authentication Manager
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      this.updateAuthUI();
      
      if (user) {
        // Sync cart and wishlist with user account
        await this.syncUserData();
      }
    });
  }

  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      // Clear local data
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      cartItems = [];
      wishlistItems = [];
    } catch (error) {
      throw new Error('Failed to sign out');
    }
  }

  async syncUserData() {
    if (!this.currentUser) return;

    try {
      // Get user's cart and wishlist from Firestore
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Sync cart and wishlist data
        if (userData.cart) {
          cartItems = userData.cart;
          this.updateCartUI();
        }
        if (userData.wishlist) {
          wishlistItems = userData.wishlist;
          this.updateWishlistUI();
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    
    if (this.currentUser) {
      // User is signed in
      if (authBtn) {
        authBtn.innerHTML = `
          <i class="icon-user"></i>
          <span>${this.currentUser.displayName || this.currentUser.email}</span>
        `;
      }
      
      // Show admin link if user is admin
      this.checkAdminAccess();
    } else {
      // User is signed out
      if (authBtn) {
        authBtn.innerHTML = '<i class="icon-user"></i>';
      }
    }
  }

  async checkAdminAccess() {
    if (!this.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          // Add admin link to navigation
          this.addAdminLink();
        }
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
    }
  }

  addAdminLink() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('adminLink')) {
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.className = 'nav-link';
      adminLink.id = 'adminLink';
      adminLink.innerHTML = '<i class="icon-settings"></i> لوحة التحكم';
      navLinks.appendChild(adminLink);
    }
  }

  getAuthErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
    };
    return errorMessages[errorCode] || 'Authentication error';
  }
}

// Cart Manager
class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.init();
  }

  init() {
    this.updateCartUI();
    this.setupEventListeners();
  }

  loadCart() {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  addItem(product) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        gender: product.gender,
        quantity: 1
      });
    }
    
    this.saveCart();
    this.updateCartUI();
    this.showNotification(languageManager.translate('product.added_to_cart'));
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.updateCartUI();
      }
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartUI();
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    
    if (cartCount) {
      cartCount.textContent = this.getTotalItems();
      cartCount.style.display = this.getTotalItems() > 0 ? 'block' : 'none';
    }
  }

  setupEventListeners() {
    // Cart button click - redirects to cart page
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'cart.html';
      });
    }
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--gold);
      color: var(--bg-primary);
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Wishlist Manager
class WishlistManager {
  constructor() {
    this.items = this.loadWishlist();
    this.init();
  }

  init() {
    this.updateWishlistUI();
    this.setupEventListeners();
  }

  loadWishlist() {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem('wishlist', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  }

  addItem(product) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (!existingItem) {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        gender: product.gender
      });
      
      this.saveWishlist();
      this.updateWishlistUI();
      this.showNotification(languageManager.translate('wishlist.added'));
    }
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveWishlist();
    this.updateWishlistUI();
    this.showNotification(languageManager.translate('wishlist.removed'));
  }

  isInWishlist(productId) {
    return this.items.some(item => item.id === productId);
  }

  updateWishlistUI() {
    const wishlistCount = document.getElementById('wishlistCount');
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    
    if (wishlistCount) {
      wishlistCount.textContent = this.items.length;
      wishlistCount.style.display = this.items.length > 0 ? 'block' : 'none';
    }
    
    if (wishlistDrawer) {
      this.updateWishlistDrawer();
    }
  }

  updateWishlistDrawer() {
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    if (!wishlistDrawer) return;

    if (this.items.length === 0) {
      wishlistDrawer.innerHTML = `
        <div class="wishlist-empty">
          <h3>${languageManager.translate('wishlist.empty')}</h3>
          <button class="btn-primary" onclick="closeWishlistDrawer()">
            ${languageManager.translate('btn-shop')}
          </button>
        </div>
      `;
      return;
    }

    const itemsHtml = this.items.map(item => `
      <div class="wishlist-item">
        <img src="${item.image_url || 'assets/images/products/placeholder.jpg'}" 
             alt="${item.name}" class="wishlist-item-image">
        <div class="wishlist-item-details">
          <h4>${item.name}</h4>
          <p>₪${item.price.toFixed(2)}</p>
          <div class="wishlist-item-actions">
            <button class="btn-primary" onclick="cartManager.addItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">
              ${languageManager.translate('btn-add-to-cart')}
            </button>
            <button onclick="wishlistManager.removeItem('${item.id}')" class="remove-btn">×</button>
          </div>
        </div>
      </div>
    `).join('');

    wishlistDrawer.innerHTML = `
      <div class="wishlist-header">
        <h3>${languageManager.translate('wishlist.title')}</h3>
        <button onclick="closeWishlistDrawer()" class="close-btn">×</button>
      </div>
      <div class="wishlist-items">
        ${itemsHtml}
      </div>
    `;
  }

  setupEventListeners() {
    // Wishlist button click
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', () => {
        this.toggleWishlistDrawer();
      });
    }

    // Close wishlist drawer when clicking outside
    document.addEventListener('click', (e) => {
      const wishlistDrawer = document.getElementById('wishlistDrawer');
      const wishlistBtn = document.getElementById('wishlistBtn');
      
      if (wishlistDrawer && wishlistDrawer.classList.contains('show') && 
          !wishlistDrawer.contains(e.target) && !wishlistBtn.contains(e.target)) {
        this.closeWishlistDrawer();
      }
    });
  }

  toggleWishlistDrawer() {
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    if (wishlistDrawer) {
      wishlistDrawer.classList.toggle('show');
    }
  }

  closeWishlistDrawer() {
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    if (wishlistDrawer) {
      wishlistDrawer.classList.remove('show');
    }
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--gold);
      color: var(--bg-primary);
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Search Manager
class SearchManager {
  constructor() {
    this.searchResults = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  async searchProducts(query) {
    try {
      // Search in Firestore
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('name', '>=', query), where('name', '<=', query + '\uf8ff'));
      const snapshot = await getDocs(q);
      
      this.searchResults = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.displaySearchResults();
    } catch (error) {
      console.error('Error searching products:', error);
      this.showSearchError();
    }
  }

  displaySearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    if (this.searchResults.length === 0) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <p>${languageManager.translate('search.no_results')}</p>
        </div>
      `;
      return;
    }

    const resultsHtml = this.searchResults.map(product => `
      <div class="search-result-item" onclick="goToProduct('${product.id}')">
        <img src="${product.image_url || 'assets/images/products/placeholder.jpg'}" 
             alt="${product.name}" class="search-result-image">
        <div class="search-result-details">
          <h4>${product.name}</h4>
          <p>₪${product.price?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
    `).join('');

    searchResults.innerHTML = resultsHtml;
  }

  showSearchError() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="search-error">
          <p>${languageManager.translate('error.generic')}</p>
        </div>
      `;
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
          searchTimeout = setTimeout(() => {
            this.searchProducts(query);
          }, 300);
        } else {
          this.clearSearchResults();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.toggleSearchModal();
      });
    }

    // Close search modal when clicking outside
    document.addEventListener('click', (e) => {
      if (searchModal && searchModal.classList.contains('show') && 
          !searchModal.contains(e.target) && !searchBtn.contains(e.target)) {
        this.closeSearchModal();
      }
    });
  }

  toggleSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
      searchModal.classList.toggle('show');
      if (searchModal.classList.contains('show')) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
        }
      }
    }
  }

  closeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
      searchModal.classList.remove('show');
    }
  }

  clearSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = '';
    }
  }
}

// Global Functions
function goToCheckout() {
  window.location.href = 'checkout.html';
}

function goToProduct(productId) {
  window.location.href = `product.html?id=${productId}`;
}


function closeWishlistDrawer() {
  wishlistManager.closeWishlistDrawer();
}

// Initialize managers
let languageManager;
let authManager;
let cartManager;
let wishlistManager;
let searchManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  languageManager = new LanguageManager();
  authManager = new AuthManager();
  cartManager = new CartManager();
  wishlistManager = new WishlistManager();
  searchManager = new SearchManager();
});

// Export for use in other scripts
window.languageManager = languageManager;
window.authManager = authManager;
window.cartManager = cartManager;
window.wishlistManager = wishlistManager;
window.searchManager = searchManager;
