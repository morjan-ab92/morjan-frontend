import { db } from '../../firebase-frontend-config.js';
import { enforceAdminAccess, setupAdminLogoutButtons } from './admin_auth.js';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { 
    applyAdminTranslations, 
    getStoredAdminLang, 
    setStoredAdminLang,
    getAdminTranslation 
} from './translations_admin.js';
// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dwauouaxl';
const CLOUDINARY_UPLOAD_PRESET = 'ja_jewelry_unsigned';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Collection mapping: maps UI category names to Firestore collection names
const COLLECTION_MAP = {
    perfumes: "products"
};

/**
 * Upload image file to Cloudinary using unsigned upload
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The secure_url from Cloudinary response
 * @throws {Error} If upload fails
 */
async function uploadToCloudinary(file) {
    if (!file) {
        throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Cloudinary upload failed: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        
        if (!data.secure_url) {
            throw new Error('Cloudinary response missing secure_url');
        }

        return data.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

// Normalize category name for comparison
function normalizeCategory(value) {
    if (!value) return '';
    return String(value).trim().toLowerCase();
}

// Get category from window.ADMIN_CATEGORY or fallback to URL detection
function detectCategory() {
    // First priority: window.ADMIN_CATEGORY (set in HTML)
    if (window.ADMIN_CATEGORY) {
        const category = normalizeCategory(window.ADMIN_CATEGORY);
        console.log('Category from window.ADMIN_CATEGORY:', category);
        return category;
    }
    
    // Fallback: detect from filename
    const pathname = window.location.pathname || window.location.href;
    const filename = pathname.split('/').pop() || pathname.split('\\').pop() || '';
    const href = window.location.href.toLowerCase();
    
    if (filename.includes('accessories') || href.includes('admin_accessories')) return 'accessories';
    if (filename.includes('bags') || href.includes('admin_bags')) return 'bags';
    if (filename.includes('watches') || href.includes('admin_watches')) return 'watches';
    if (filename.includes('perfumes') || href.includes('admin_perfumes')) return 'perfumes';
    
    return null;
}

let CURRENT_CATEGORY = detectCategory();

// Final fallback if still not detected
if (!CURRENT_CATEGORY) {
    console.warn('Could not detect category, trying final fallback...');
    const title = document.title.toLowerCase();
    const href = window.location.href.toLowerCase();
    
    if (title.includes('accessories') || href.includes('accessories')) {
        CURRENT_CATEGORY = 'accessories';
    } else if (title.includes('bags') || href.includes('bags')) {
        CURRENT_CATEGORY = 'bags';
    } else if (title.includes('watches') || href.includes('watches')) {
        CURRENT_CATEGORY = 'watches';
    } else if (title.includes('perfumes') || href.includes('perfumes')) {
        CURRENT_CATEGORY = 'perfumes';
    }
    
    if (CURRENT_CATEGORY) {
        console.log('Category detected via final fallback:', CURRENT_CATEGORY);
    } else {
        console.error('Could not detect category. Current URL:', window.location.href, 'Title:', document.title);
    }
}

// Helper function to get the actual Firestore collection name from a category alias
function getCollectionName(categoryAlias) {
    return COLLECTION_MAP[categoryAlias] || categoryAlias;
}

let productsCache = [];
let currentEditProduct = null;

const filters = {
    search: '',
    gender: 'all',
    priceMin: null,
    priceMax: null
};

function getCategorySlug() {
    return normalizeCategory(CURRENT_CATEGORY || '');
}

function getCategoryElementId(baseId) {
    const slug = getCategorySlug();
    return slug ? `${baseId}-${slug}` : baseId;
}

function findCategoryElement(baseId) {
    const sluggedId = getCategoryElementId(baseId);
    return document.getElementById(sluggedId) || document.getElementById(baseId);
}

// Translation helper
const translate = (key, replacements = {}) => {
    const lang = getStoredAdminLang();
    let text = getAdminTranslation(lang, key);
    Object.entries(replacements).forEach(([token, value]) => {
        const pattern = new RegExp(`\\{${token}\\}`, 'g');
        text = text.replace(pattern, value);
    });
    return text;
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Enforce admin access - redirects if not authenticated
        const isAuthorized = await enforceAdminAccess();
        if (!isAuthorized) {
            return; // Redirect already happened
        }
        
        // Apply translations on page load
        const savedLang = getStoredAdminLang();
        applyAdminTranslations(savedLang);
        initializeInterface();
        refreshProducts();
    } catch (error) {
        console.error('Error initializing admin category page:', error);
        const tableBody = findCategoryElement('products-table-body');
        if (tableBody) {
            const errorMsg = getAdminTranslation(getStoredAdminLang(), 'admin.messages.error_loading');
            tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${errorMsg}</td></tr>`;
        }
    }
});

function initializeInterface() {
    setupHeaderNavigation();
    setupLanguageToggle();
    setupAdminLogoutButtons(); // Use shared admin logout function
    setupSidebarNavigation(); // Add sidebar navigation handler
    ensureCategoryPanelVisibility();
    showOnlyCurrentCategorySection();
    bindFilterControls();
    bindModalControls();
    bindTableActions();
}

function ensureCategoryPanelVisibility() {
    const panel = document.getElementById('products-panel');
    if (panel) {
        panel.style.display = '';
    }
}

function showOnlyCurrentCategorySection() {
    const slug = getCategorySlug();
    if (!slug) return;

    document.querySelectorAll('.category-section').forEach(section => {
        const isCurrent = section.id === `section-${slug}`;
        section.style.display = isCurrent ? 'block' : 'none';
    });
}

function setupHeaderNavigation() {
    // Highlight current page in header navbar
    const currentPage = window.location.pathname.split('/').pop() || '';
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(link => {
        link.classList.remove('active');
    });

    // Map pages to their corresponding nav buttons
    const pageToNavMap = {
        'admin.html': 'admin.html',
        'admin_watches.html': 'admin_watches.html',
        'admin_bags.html': 'admin_bags.html',
        'admin_accessories.html': 'admin_accessories.html',
        'admin_perfumes.html': 'admin_perfumes.html',
        'admin_orders.html': 'admin_orders.html'
    };

    // Find and highlight the active nav button
    const targetHref = pageToNavMap[currentPage];
    if (targetHref) {
        const activeNav = document.querySelector(`.nav-btn[href="${targetHref}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    // Dashboard navigation
    document.querySelector(".admin-nav-dashboard")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "admin.html";
    });

    // Products navigation
    document.querySelector(".admin-nav-products")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "admin_products.html";
    });

    // Categories navigation
    document.querySelector(".admin-nav-categories")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "admin_categories.html";
    });

    // Orders navigation
    document.querySelector(".admin-nav-orders")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "admin_orders.html";
    });
}

function setupLanguageToggle() {
    const langToggle = document.getElementById('language-toggle') || document.getElementById('admin-header-lang-toggle') || document.getElementById('lang-toggle');
    if (!langToggle) return;

    // Language cycle: ar -> he -> en -> ar
    const getNextLang = (currentLang) => {
        if (currentLang === 'ar') return 'he';
        if (currentLang === 'he') return 'en';
        return 'ar';
    };

    // Get label for next language
    const getNextLangLabel = (currentLang) => {
        const nextLang = getNextLang(currentLang);
        if (nextLang === 'ar') return 'العربية';
        if (nextLang === 'he') return 'עברית';
        return 'English';
    };

    // Update button label based on current language
    const updateButtonLabel = () => {
        const currentLang = getStoredAdminLang();
        const label = getNextLangLabel(currentLang);
        langToggle.textContent = label;
        langToggle.dataset.lang = currentLang;
    };

    updateButtonLabel();

    langToggle.addEventListener('click', () => {
        const currentLang = getStoredAdminLang();
        const nextLang = getNextLang(currentLang);
        setStoredAdminLang(nextLang);
        
        // Update UI without reload
        applyAdminTranslations(nextLang);
        updateButtonLabel();
        
        // Update RTL/LTR direction
        document.documentElement.lang = nextLang;
        document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.remove('rtl', 'ltr');
        document.body.classList.add(nextLang === 'ar' ? 'rtl' : 'ltr');
    });
}


function applyBasicLanguageFallback(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// Setup sidebar navigation for category pages
function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.admin-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
            
            // Check if section exists on current page
            const targetSection = document.getElementById(sectionId);
            
            if (targetSection) {
                // Section exists - show/hide it (same page navigation)
                e.preventDefault();
                
                // Update active state
                sidebarLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.dashboard-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show target section
                targetSection.style.display = 'block';
            } else {
                // Section doesn't exist - navigate to appropriate page
                e.preventDefault();
                
                // Map sections to pages
                const sectionToPageMap = {
                    'dashboard-panel': 'admin.html',
                    'categories-panel': 'admin_categories.html',
                    'orders-panel': 'admin_orders.html',
                    'upload-panel': 'admin.html#upload-panel'
                };
                
                const targetPage = sectionToPageMap[sectionId];
                if (targetPage) {
                    window.location.href = targetPage;
                }
            }
        });
    });
}

// Logout buttons are now handled by setupAdminLogoutButtons() from admin_auth.js
// This function is kept for backward compatibility but is no longer used

function bindFilterControls() {
    const searchInput = findCategoryElement('product-search');
    const genderSelect = findCategoryElement('filter-gender');
    const priceMinInput = findCategoryElement('filter-price-min');
    const priceMaxInput = findCategoryElement('filter-price-max');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filters.search = e.target.value.toLowerCase();
            applyFiltersAndRender();
        });
    }

    if (genderSelect) {
        genderSelect.addEventListener('change', (e) => {
            filters.gender = e.target.value;
            applyFiltersAndRender();
        });
    }

    if (priceMinInput) {
        priceMinInput.addEventListener('input', (e) => {
            filters.priceMin = e.target.value ? Number(e.target.value) : null;
            applyFiltersAndRender();
        });
    }

    if (priceMaxInput) {
        priceMaxInput.addEventListener('input', (e) => {
            filters.priceMax = e.target.value ? Number(e.target.value) : null;
            applyFiltersAndRender();
        });
    }
}

function bindModalControls() {
    const openModalBtn = document.getElementById('open-product-modal');
    const closeModalBtn = document.getElementById('close-product-modal');
    const cancelModalBtn = document.getElementById('cancel-product-modal');
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => openProductModal());
    }

    [closeModalBtn, cancelModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeProductModal);
    });

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeProductModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', handleProductFormSubmit);
    }
}

function bindTableActions() {
    const tableBody = findCategoryElement('products-table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const { action, id } = button.dataset;
        const product = productsCache.find(item => item.id === id);
        if (!product) {
            alert('Product not found. Please refresh the page.');
            return;
        }

        if (action === 'edit') {
            startEditProduct(product);
        } else if (action === 'delete') {
            confirmAndDeleteProduct(product);
        }
    });
}

async function refreshProducts() {
    setTableLoadingState(true);
    try {
        const products = await fetchCategoryProducts();
        productsCache = products;
        applyFiltersAndRender();
    } catch (error) {
        console.error('Failed to load products', error);
        renderProductsTable([], error);
    } finally {
        setTableLoadingState(false);
    }
}

async function fetchCategoryProducts() {
    if (!CURRENT_CATEGORY) {
        throw new Error('Category not detected');
    }

    try {
        const collectionName = getCollectionName(CURRENT_CATEGORY);
        const snapshot = await getDocs(collection(db, collectionName));
        const products = [];

        snapshot.forEach((docSnap) => {
            try {
                const data = docSnap.data();
                // Only include products that match the current category
                const productCategory = normalizeCategory(data.category || data.collection || '');
                const pageCategory = normalizeCategory(CURRENT_CATEGORY);
                
                // Match category (case-insensitive, exact match preferred)
                // Also handle plural/singular variations (e.g., "perfume" vs "perfumes")
                const categoryMatch = productCategory === pageCategory || 
                    productCategory === pageCategory + 's' ||
                    productCategory + 's' === pageCategory ||
                    (productCategory.startsWith(pageCategory) && productCategory.length <= pageCategory.length + 2) ||
                    (pageCategory.startsWith(productCategory) && pageCategory.length <= productCategory.length + 2);
                
                if (categoryMatch) {
                    products.push({
                        id: docSnap.id,
                        collection: CURRENT_CATEGORY,
                        ...data
                    });
                }
            } catch (err) {
                console.warn('Error processing product document:', docSnap.id, err);
            }
        });

        return products;
    } catch (error) {
        console.error('Error fetching category products:', error);
        throw error;
    }
}

function applyFiltersAndRender() {
    const filtered = applyFilters(productsCache);
    renderProductsTable(filtered);
    
    // Update category count element
    const slug = getCategorySlug();
    if (slug) {
        const countElementId = `${slug}-table-count`;
        const countElement = document.getElementById(countElementId);
        if (countElement) {
            countElement.textContent = filtered.length;
        }
    }
}

function applyFilters(products) {
    return products.filter(product => {
        const gender = (product.gender || '').toLowerCase();
        const price = Number(product.price_after ?? product.priceAfter ?? product.price ?? 0);

        const matchesSearch = filters.search
            ? matchesSearchQuery(product, filters.search)
            : true;

        const matchesGender = filters.gender === 'all'
            ? true
            : gender === filters.gender;

        const matchesPriceMin = filters.priceMin !== null
            ? price >= filters.priceMin
            : true;

        const matchesPriceMax = filters.priceMax !== null
            ? price <= filters.priceMax
            : true;

        return matchesSearch && matchesGender && matchesPriceMin && matchesPriceMax;
    });
}

function matchesSearchQuery(product, query) {
    const normalizedQuery = query.toLowerCase();
    const fieldsToSearch = [
        product.name,
        product.name_en,
        product.name_ar,
        product.name_he,
        product.category,
        product.gender,
        product.collection
    ];

    return fieldsToSearch.some(field => (field || '').toLowerCase().includes(normalizedQuery));
}

function renderProductsTable(products, error = null) {
    const tableBody = findCategoryElement('products-table-body');
    if (!tableBody) return;

    if (error) {
        const errorMsg = translate('admin.table.failed');
        tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${escapeHtml(error.message || errorMsg)}</td></tr>`;
        return;
    }

    if (!products.length) {
        const noResultsMsg = translate('admin.table.no_results');
        tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${escapeHtml(noResultsMsg)}</td></tr>`;
        return;
    }

    const rows = products.map(product => {
        const category = capitalizeFirst(product.category || product.collection || '-');
        const gender = capitalizeFirst(product.gender || 'Unisex');
        const priceBefore = formatCurrency(product.price_before ?? product.priceBefore);
        const priceAfter = formatCurrency(product.price_after ?? product.priceAfter ?? product.price);
        
        // Validate and sanitize image URL - use imageUrl with fallback for backward compatibility
        let imageUrl = product.imageUrl || product.image || product.image_url || '';
        // Convert to string and trim
        imageUrl = String(imageUrl || '').trim();
        
        // Enhanced validation: check for invalid patterns
        const isValidImageUrl = (url) => {
            if (!url || url.length < 3) return false;
            // Check if it's just a number (like "21", "53", "75")
            if (/^\d+$/.test(url)) return false;
            // Check for common invalid patterns (just numbers with slashes, etc.)
            if (/^\/\d+$/.test(url) || /^\/\d+\//.test(url)) return false;
            // Check if it starts with valid URL/path prefixes
            const validPrefixes = ['http://', 'https://', '/', 'assets/', 'data:', './'];
            if (!validPrefixes.some(prefix => url.startsWith(prefix))) return false;
            return true;
        };
        
        if (!isValidImageUrl(imageUrl)) {
            imageUrl = 'assets/images/products/placeholder.jpg';
        }
        
        // Get product name safely
        const productName = typeof product.name === 'string' ? product.name : 
                           (product.name_en || product.name_ar || product.name_he || 'Product');

        return `
            <tr>
                <td>
                    <div class="product-summary">
                        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" class="product-thumb" onerror="this.onerror=null; this.src='assets/images/products/placeholder.jpg';">
                        <div class="product-names">
                            ${renderMultilingualNames(product)}
                            <span class="product-id">ID: ${escapeHtml(product.id)}</span>
                        </div>
                    </div>
                </td>
                <td><span class="tag tag-category">${escapeHtml(category)}</span></td>
                <td><span class="tag tag-gender">${escapeHtml(gender)}</span></td>
                <td>
                    <div class="pricing-stack">
                        <span class="price-old">${priceBefore}</span>
                        <span class="price-new">${priceAfter}</span>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-gold" data-action="edit" data-id="${escapeHtml(product.id)}" data-translate="admin.action.edit">
                            <i class="fa fa-edit"></i> ${translate('admin.action.edit')}
                        </button>
                        <button class="btn-danger" data-action="delete" data-id="${escapeHtml(product.id)}" data-translate="admin.action.delete">
                            <i class="fa fa-trash"></i> ${translate('admin.action.delete')}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function renderMultilingualNames(product) {
    // Helper to safely extract string value
    const getStringValue = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
            // If it's an object, try to get a string property or convert to string
            return value.toString ? value.toString() : JSON.stringify(value);
        }
        return String(value);
    };

    const names = [
        { label: 'EN', value: getStringValue(product.name || product.name_en) },
        { label: 'AR', value: getStringValue(product.name_ar) },
        { label: 'HE', value: getStringValue(product.name_he) }
    ];

    return names
        .filter(item => item.value && item.value.trim())
        .map((item, index) => {
            const cls = index === 0 ? 'name-primary' : '';
            return `<span class="${cls}">${escapeHtml(item.value)} (${item.label})</span>`;
        })
        .join('');
}

function openProductModal() {
    currentEditProduct = null;
    clearModal();
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('product-form-submit');
    const messageEl = document.getElementById('modal-message');
    const categorySelect = document.getElementById('product-category');
    const translateBtn = document.getElementById('translate-from-ar-btn');
    
    // Hide translation helper text
    const hintEn = document.getElementById('translation-unavailable-hint');
    const hintHe = document.getElementById('translation-unavailable-hint-he');
    if (hintEn) hintEn.style.display = 'none';
    if (hintHe) hintHe.style.display = 'none';
    
    // Reset translation availability flag for new modal
    translationAvailable = true;

    if (modalTitle) modalTitle.textContent = translate('admin.modal.title.add');
    if (submitBtn) {
        const span = submitBtn.querySelector('span');
        if (span) span.textContent = translate('admin.action.save');
    }
    if (messageEl) messageEl.classList.remove('show', 'success', 'error');
    // Hide translate button in add mode (only show in edit mode)
    if (translateBtn) translateBtn.style.display = 'none';
    // Keep category field disabled since it's fixed for this page
    if (categorySelect && CURRENT_CATEGORY) {
        categorySelect.value = normalizeCategory(CURRENT_CATEGORY);
        categorySelect.disabled = true;
    }
    if (modal) modal.classList.add('active');
    
    // Initialize image uploader
    initializeImageUploader();
    
    // Setup auto-fill for Arabic name to EN/HE (only for new products)
    setupArabicNameAutoFill();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('active');
    clearModal();
}

// Setup auto-translate: Arabic name automatically translates to EN and HE fields when they're empty
let arabicNameAutoTranslateHandler = null;
let translateDebounceTimer = null;

// Translation availability flag (set to false if CORS or other errors occur)
let translationAvailable = true;

// Translation function using LibreTranslate public API
async function translateText(text, targetLang) {
    if (!text || !text.trim()) return '';
    
    // If translation was previously unavailable, skip API call
    if (!translationAvailable) {
        return '';
    }
    
    try {
        // Using LibreTranslate public API (free, no API key required)
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: 'ar',
                target: targetLang,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.translatedText || '';
    } catch (error) {
        // Check if it's a CORS error
        const isCorsError = error.message.includes('CORS') || 
                           error.message.includes('Failed to fetch') ||
                           error.name === 'TypeError';
        
        if (isCorsError) {
            // Mark translation as unavailable to prevent future attempts
            translationAvailable = false;
            // Silently fail - don't spam console
            return '';
        }
        
        // For other errors, log once but don't spam
        if (translationAvailable) {
            console.warn('Translation API unavailable (CORS or network error). Automatic translation disabled.');
            translationAvailable = false;
        }
        
        return '';
    }
}

function setupArabicNameAutoFill() {
    // TRANSLATION DISABLED: Automatic translation is disabled
    return;
    
    const nameArInput = document.getElementById('product-name-ar');
    const nameEnInput = document.getElementById('product-name');
    const nameHeInput = document.getElementById('product-name-he');
    
    if (!nameArInput || !nameEnInput || !nameHeInput) return;
    
    // Remove existing listener if it exists
    if (arabicNameAutoTranslateHandler) {
        nameArInput.removeEventListener('input', arabicNameAutoTranslateHandler);
    }
    
    // Clear any existing debounce timer
    if (translateDebounceTimer) {
        clearTimeout(translateDebounceTimer);
    }
    
    // Create new handler with debouncing
    arabicNameAutoTranslateHandler = () => {
        // Clear existing timer
        if (translateDebounceTimer) {
            clearTimeout(translateDebounceTimer);
        }
        
        // Debounce: wait 500ms after user stops typing
        translateDebounceTimer = setTimeout(async () => {
            // Only translate if we're adding a new product (not editing)
            if (currentEditProduct) return;
            
            const arabicText = nameArInput.value.trim();
            
            // Don't translate if Arabic field is empty
            if (!arabicText) return;
            
            // Only translate if EN field is empty
            const shouldTranslateEn = !nameEnInput.value.trim();
            
            // Only translate if HE field is empty
            const shouldTranslateHe = !nameHeInput.value.trim();
            
            // Translate to English if needed
            if (shouldTranslateEn) {
                try {
                    const translatedEn = await translateText(arabicText, 'en');
                    // Double-check field is still empty (user might have typed while translating)
                    if (!nameEnInput.value.trim() && translatedEn) {
                        nameEnInput.value = translatedEn;
                        // Hide helper text if translation succeeded
                        const hintEn = document.getElementById('translation-unavailable-hint');
                        if (hintEn) hintEn.style.display = 'none';
                    } else if (!translatedEn && !translationAvailable) {
                        // Show helper text if translation is unavailable
                        const hintEn = document.getElementById('translation-unavailable-hint');
                        if (hintEn) hintEn.style.display = 'block';
                    }
                } catch (error) {
                    // Silent fail - already handled in translateText
                }
            }
            
            // Translate to Hebrew if needed
            if (shouldTranslateHe) {
                try {
                    const translatedHe = await translateText(arabicText, 'he');
                    // Double-check field is still empty (user might have typed while translating)
                    if (!nameHeInput.value.trim() && translatedHe) {
                        nameHeInput.value = translatedHe;
                        // Hide helper text if translation succeeded
                        const hintHe = document.getElementById('translation-unavailable-hint-he');
                        if (hintHe) hintHe.style.display = 'none';
                    } else if (!translatedHe && !translationAvailable) {
                        // Show helper text if translation is unavailable
                        const hintHe = document.getElementById('translation-unavailable-hint-he');
                        if (hintHe) hintHe.style.display = 'block';
                    }
                } catch (error) {
                    // Silent fail - already handled in translateText
                }
            }
        }, 500); // 500ms debounce
    };
    
    // Add the listener
    nameArInput.addEventListener('input', arabicNameAutoTranslateHandler);
}

// Setup manual translate button for edit mode
function setupEditModeTranslateButton() {
    // TRANSLATION DISABLED: Manual translation is disabled
    return;
    
    const translateBtn = document.getElementById('translate-from-ar-btn');
    const nameArInput = document.getElementById('product-name-ar');
    const nameEnInput = document.getElementById('product-name');
    const nameHeInput = document.getElementById('product-name-he');
    
    if (!translateBtn || !nameArInput || !nameEnInput || !nameHeInput) return;
    
    // Remove existing listener if it exists
    const newTranslateBtn = translateBtn.cloneNode(true);
    translateBtn.parentNode.replaceChild(newTranslateBtn, translateBtn);
    
    // Get fresh reference
    const freshTranslateBtn = document.getElementById('translate-from-ar-btn');
    const freshNameArInput = document.getElementById('product-name-ar');
    const freshNameEnInput = document.getElementById('product-name');
    const freshNameHeInput = document.getElementById('product-name-he');
    
    if (freshTranslateBtn && freshNameArInput && freshNameEnInput && freshNameHeInput) {
        freshTranslateBtn.addEventListener('click', async () => {
            // Only work in edit mode
            if (!currentEditProduct) return;
            
            const arabicText = freshNameArInput.value.trim();
            
            if (!arabicText) {
                alert(translate('admin.messages.name_ar_required') || 'Arabic name is required for translation.');
                return;
            }
            
            // Disable button during translation
            freshTranslateBtn.disabled = true;
            const originalText = freshTranslateBtn.textContent;
            freshTranslateBtn.textContent = 'Translating...';
            
            try {
                // Translate to English
                const translatedEn = await translateText(arabicText, 'en');
                if (translatedEn) {
                    freshNameEnInput.value = translatedEn;
                    // Hide helper text if translation succeeded
                    const hintEn = document.getElementById('translation-unavailable-hint');
                    if (hintEn) hintEn.style.display = 'none';
                } else if (!translationAvailable) {
                    // Show helper text if translation is unavailable
                    const hintEn = document.getElementById('translation-unavailable-hint');
                    if (hintEn) hintEn.style.display = 'block';
                }
                
                // Translate to Hebrew
                const translatedHe = await translateText(arabicText, 'he');
                if (translatedHe) {
                    freshNameHeInput.value = translatedHe;
                    // Hide helper text if translation succeeded
                    const hintHe = document.getElementById('translation-unavailable-hint-he');
                    if (hintHe) hintHe.style.display = 'none';
                } else if (!translationAvailable) {
                    // Show helper text if translation is unavailable
                    const hintHe = document.getElementById('translation-unavailable-hint-he');
                    if (hintHe) hintHe.style.display = 'block';
                }
                
                if (!translationAvailable && !translatedEn && !translatedHe) {
                    alert('Automatic translation is unavailable (CORS error). Please enter English and Hebrew names manually.');
                }
            } catch (error) {
                // Silent fail - already handled in translateText
                if (!translationAvailable) {
                    alert('Automatic translation is unavailable. Please enter English and Hebrew names manually.');
                }
            } finally {
                // Re-enable button
                freshTranslateBtn.disabled = false;
                freshTranslateBtn.textContent = originalText;
            }
        });
    }
}

function clearModal() {
    const form = document.getElementById('product-form');
    if (form) form.reset();
    // Hide translate button when clearing modal
    const translateBtn = document.getElementById('translate-from-ar-btn');
    if (translateBtn) translateBtn.style.display = 'none';
    // Set category to current category (normalized)
    const categorySelect = document.getElementById('product-category');
    if (categorySelect && CURRENT_CATEGORY) {
        // Map normalized category back to form value
        const categoryValue = normalizeCategory(CURRENT_CATEGORY);
        categorySelect.value = categoryValue;
        // Also disable the category field since it's fixed for this page
        categorySelect.disabled = true;
    }
    // Reset image uploader
    resetImageUploader();
    currentEditProduct = null;
}

/**
 * Initialize image uploader with drag & drop functionality
 * Reusable function for image upload container
 */
function initializeImageUploader() {
    const fileInput = document.getElementById('product-image-file');
    const uploadZone = document.getElementById('image-upload-zone');
    const uploadContent = document.getElementById('image-upload-content');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const filenameSpan = document.getElementById('image-filename');
    const filesizeSpan = document.getElementById('image-filesize');
    const removeBtn = document.getElementById('remove-image-btn');
    const errorDiv = document.getElementById('image-upload-error');
    const progressDiv = document.getElementById('image-upload-progress');
    const progressFill = progressDiv?.querySelector('.upload-progress-fill');

    if (!fileInput || !uploadZone) return;

    // Click to open file picker
    uploadZone.addEventListener('click', (e) => {
        if (e.target !== removeBtn && !e.target.closest('.remove-image-btn')) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    // Drag and drop handlers
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Remove image button
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetImageUploader();
        });
    }

    function handleFileSelection(file) {
            // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const fileType = file.type.toLowerCase();
        if (!validTypes.includes(fileType)) {
            showImageError(translate('admin.form.image_invalid_type') || 'Invalid file type. Only JPG, PNG, and WEBP images are allowed.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showImageError(translate('admin.form.image_too_large') || 'File size too large. Maximum size is 5MB.');
            return;
        }

        // Hide error
        if (errorDiv) errorDiv.style.display = 'none';

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImg) previewImg.src = e.target.result;
            if (filenameSpan) filenameSpan.textContent = file.name;
            if (filesizeSpan) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                filesizeSpan.textContent = `${sizeMB} MB`;
            }
            if (uploadContent) uploadContent.style.display = 'none';
            if (previewContainer) previewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    function showImageError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function resetImageUploader() {
        if (fileInput) fileInput.value = '';
        if (uploadContent) uploadContent.style.display = 'block';
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';
        if (errorDiv) errorDiv.style.display = 'none';
        if (progressDiv) progressDiv.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        uploadZone.classList.remove('drag-over');
        // Clear hidden image URL input to allow saving without image
        const imageUrlInput = document.getElementById('product-image-url');
        if (imageUrlInput) imageUrlInput.value = '';
    }

    // Expose reset function globally for this instance
    window.resetImageUploader = resetImageUploader;
}

/**
 * Reset image uploader to initial state
 */
function resetImageUploader() {
    const fileInput = document.getElementById('product-image-file');
    const uploadContent = document.getElementById('image-upload-content');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const errorDiv = document.getElementById('image-upload-error');
    const progressDiv = document.getElementById('image-upload-progress');
    const progressFill = progressDiv?.querySelector('.upload-progress-fill');
    const uploadZone = document.getElementById('image-upload-zone');
    const imageUrlInput = document.getElementById('product-image-url');

    if (fileInput) fileInput.value = '';
    if (uploadContent) uploadContent.style.display = 'block';
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (errorDiv) errorDiv.style.display = 'none';
    if (progressDiv) progressDiv.style.display = 'none';
    if (progressFill) progressFill.style.width = '0%';
    if (uploadZone) uploadZone.classList.remove('drag-over');
    // Clear hidden image URL input to allow saving without image
    if (imageUrlInput) imageUrlInput.value = '';
}

/**
 * Show existing image in preview when editing
 */
function showExistingImagePreview(imageUrl) {
    const uploadContent = document.getElementById('image-upload-content');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const filenameSpan = document.getElementById('image-filename');
    const filesizeSpan = document.getElementById('image-filesize');
    const imageUrlInput = document.getElementById('product-image-url');

    if (!imageUrl || !previewImg) return;

    // Store existing URL in hidden input
    if (imageUrlInput) imageUrlInput.value = imageUrl;

    // Show preview with existing image
    previewImg.src = imageUrl;
    if (filenameSpan) filenameSpan.textContent = translate('admin.form.existing_image') || 'Existing image';
    if (filesizeSpan) filesizeSpan.textContent = '';
    if (uploadContent) uploadContent.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'flex';
}

function startEditProduct(product) {
    currentEditProduct = { id: product.id, collection: product.collection || CURRENT_CATEGORY };
    const formFields = {
        'product-name': product.name || product.name_en || '',
        'product-name-ar': product.name_ar || '',
        'product-name-he': product.name_he || '',
        'product-category': normalizeCategory(product.category || product.collection || CURRENT_CATEGORY),
        'product-gender': product.gender || '',
        'product-price-before': product.price_before ?? product.priceBefore ?? '',
        'product-price-after': product.price_after ?? product.priceAfter ?? product.price ?? '',
        'product-image-url': product.imageUrl || product.image || product.image_url || '',
        'product-description': product.description || '',
        'product-is-sale': product.isSale === true ? true : false
    };

    Object.entries(formFields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) {
            // Handle checkbox separately
            if (field.type === 'checkbox') {
                field.checked = value === true;
            } else {
                field.value = value;
            }
            // Disable category field in edit mode since it's fixed for this page
            if (id === 'product-category') {
                field.disabled = true;
            }
        }
    });

    // Show existing image preview if available - use imageUrl with fallback
    const existingImageUrl = product.imageUrl || product.image || product.image_url || '';
    if (existingImageUrl) {
        showExistingImagePreview(existingImageUrl);
    } else {
        resetImageUploader();
    }

    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('product-form-submit');
    const translateBtn = document.getElementById('translate-from-ar-btn');
    
    if (modalTitle) modalTitle.textContent = translate('admin.modal.title.edit');
    if (submitBtn) {
        const span = submitBtn.querySelector('span');
        if (span) span.textContent = translate('admin.action.update');
    }
    // Show translate button in edit mode
    if (translateBtn) translateBtn.style.display = 'block';

    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.add('active');
    
    // Initialize image uploader for edit mode
    initializeImageUploader();
    
    // Setup translate button handler for edit mode
    setupEditModeTranslateButton();
}

function collectModalFormData() {
    const valueOf = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
    };

    const name = valueOf('product-name');
    const nameAr = valueOf('product-name-ar');
    const nameHe = valueOf('product-name-he');
    // Always use current page category, not form value
    const category = normalizeCategory(CURRENT_CATEGORY);
    const gender = valueOf('product-gender');
    const priceBefore = valueOf('product-price-before');
    const priceAfter = valueOf('product-price-after');
    const imageUrlValue = valueOf('product-image-url'); // Existing image URL (for edit mode)
    const description = valueOf('product-description');
    const isSale = document.getElementById('product-is-sale')?.checked || false;

    // Get file from file input (if new image is uploaded)
    const fileInput = document.getElementById('product-image-file');
    const imageFile = fileInput?.files?.[0] || null;

    // All fields are optional - no validation required
    return {
        name: name || null,
        name_ar: nameAr || null,
        name_he: nameHe || null,
        category, // Always set to current page category
        gender: gender || null,
        price_before: priceBefore ? Number(priceBefore) : null,
        price_after: priceAfter ? Number(priceAfter) : null,
        isSale: isSale === true,
        imageUrl: imageUrlValue || null, // Unified image URL field
        imageFile: imageFile || null, // New file to upload (optional)
        description: description || null
    };
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    const messageEl = document.getElementById('modal-message');
    const submitBtn = document.getElementById('product-form-submit');
    const progressDiv = document.getElementById('image-upload-progress');
    const progressFill = progressDiv?.querySelector('.upload-progress-fill');
    const progressText = progressDiv?.querySelector('.upload-progress-text');

    // No required fields - all validations removed
    try {
        // Disable submit button during upload
        if (submitBtn) {
            submitBtn.disabled = true;
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = translate('admin.form.uploading') || 'Uploading...';
        }

        const formData = collectModalFormData();
        // Ensure category matches current page category
        formData.category = normalizeCategory(CURRENT_CATEGORY);
        
        // Double-check file input directly (in case formData didn't capture it)
        const fileInput = document.getElementById('product-image-file');
        const directFileInput = fileInput?.files?.[0] || null;
        
        // Use direct file input if formData doesn't have it (safety check)
        const imageFile = formData.imageFile || directFileInput;
        
        console.log('🔍 Form data collected:', {
            hasImageFile: !!formData.imageFile,
            hasDirectFileInput: !!directFileInput,
            imageFile: imageFile?.name,
            imageUrl: formData.imageUrl,
            isEditMode: !!currentEditProduct,
            currentEditProductId: currentEditProduct?.id
        });
        
        // Prepare initial payload (will add image URL later)
        const { imageFile: _, ...payloadData } = formData;
        
        // Initialize imageUrl as null - will be set by upload or existing image lookup
        // DO NOT initialize from formData.imageUrl as it contains the OLD value
        let imageUrl = null;

        // Upload image if a new file is provided
        if (imageFile) {
            console.log('📤 Uploading new image file to Cloudinary:', imageFile.name);
            
            // Show upload progress and disable save button
            if (progressDiv) progressDiv.style.display = 'block';
            if (progressFill) progressFill.style.width = '30%';
            if (progressText) progressText.textContent = translate('admin.form.uploading') || 'Uploading image...';
            
            try {
                // Upload to Cloudinary (works for both edit and new products)
                imageUrl = await uploadToCloudinary(imageFile);
                
                if (progressFill) progressFill.style.width = '100%';
                console.log('✅ Image uploaded successfully to Cloudinary:', imageUrl);
            } catch (uploadError) {
                console.error('❌ Image upload error:', uploadError);
                
                // Hide progress on error
                if (progressDiv) progressDiv.style.display = 'none';
                
                // Show error message to user
                const errorMsg = translate('admin.messages.image_upload_failed') || `Failed to upload image: ${uploadError.message}`;
                showInlineMessage('modal-message', errorMsg, 'error');
                
                // Re-throw to prevent saving product when upload fails
                throw uploadError;
            }
        }
        
        // If no new image was uploaded:
        if (!imageUrl) {
            if (currentEditProduct) {
                // Edit mode: Keep existing imageUrl
                console.log('🔍 No new image uploaded, keeping existing image from cache');
                const existingProduct = productsCache.find(
                    p => p.id === currentEditProduct.id && (p.collection === currentEditProduct.collection || p.collection === CURRENT_CATEGORY)
                );
                if (existingProduct) {
                    // Read from imageUrl with fallback for backward compatibility
                    imageUrl = existingProduct.imageUrl || existingProduct.image || existingProduct.image_url || null;
                    console.log('📷 Found existing image in cache:', imageUrl);
                } else {
                    // Fallback to formData if cache lookup fails
                    imageUrl = formData.imageUrl || null;
                    console.log('⚠️ Existing product not found in cache, using form data:', imageUrl);
                }
            } else {
                // New product: Set to null
                imageUrl = null;
                console.log('📝 New product with no image - setting imageUrl to null');
            }
        }

        // Prepare payload with image URL - use only imageUrl field
        // IMPORTANT: Remove imageUrl from payloadData first to avoid using old value
        const { imageUrl: oldImageUrl, ...cleanPayloadData } = payloadData;
        
        // Build final payload - explicitly set imageUrl to ensure it's not null/undefined
        const basePayload = {
            ...cleanPayloadData,
            updated_at: new Date().toISOString()
        };
        
        // Explicitly set imageUrl AFTER spreading to ensure it's the last value set
        // Only set if we have a value (null is allowed, but don't set undefined)
        if (imageUrl !== undefined) {
            basePayload.imageUrl = imageUrl;
        }

        console.log('💾 Final payload being saved:', {
            productId: currentEditProduct?.id,
            finalImageUrl: basePayload.imageUrl,
            imageUrlType: typeof basePayload.imageUrl,
            hasImageFile: !!imageFile,
            imageUrlFromForm: formData.imageUrl,
            imageUrlAfterUpload: imageUrl,
            fullPayload: JSON.stringify(basePayload, null, 2)
        });

        if (currentEditProduct) {
            // Update existing product - SINGLE updateDoc call
            const collectionName = getCollectionName(currentEditProduct.collection || CURRENT_CATEGORY);
            console.log('📝 Updating document with SINGLE updateDoc call:', collectionName, currentEditProduct.id);
            console.log('📝 Payload imageUrl value:', basePayload.imageUrl);
            
            await updateDoc(doc(db, collectionName, currentEditProduct.id), basePayload);
            
            console.log('✅ Product updated successfully. Image URL saved:', basePayload.imageUrl);
            
            // Hide progress
            if (progressDiv) progressDiv.style.display = 'none';
            
            const successMsg = translate('admin.messages.product_updated');
            showInlineMessage('modal-message', successMsg, 'success');
        } else {
            // Create new product
            const collectionName = getCollectionName(formData.category || CURRENT_CATEGORY);
            const docRef = await addDoc(collection(db, collectionName), {
                ...basePayload,
                created_at: new Date().toISOString()
            });
            
            console.log('✅ Product created with ID:', docRef.id);
            
            // Note: Image upload for new products is handled before document creation
            // If imageUrl was set during upload, it's already in basePayload
            // No need for separate upload step since Cloudinary doesn't require product ID
            
            // Hide progress
            if (progressDiv) progressDiv.style.display = 'none';
            
            const successMsg = translate('admin.messages.product_added');
            showInlineMessage('modal-message', successMsg, 'success');
        }

        // Hide progress
        if (progressDiv) progressDiv.style.display = 'none';

        closeProductModal();
        await refreshProducts();
    } catch (error) {
        console.error('Error saving product', error);
        const errorMsg = error.message || translate('admin.messages.product_save_failed');
        showInlineMessage('modal-message', errorMsg, 'error');
        
        // Hide progress on error
        const progressDiv = document.getElementById('image-upload-progress');
        if (progressDiv) progressDiv.style.display = 'none';
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            const span = submitBtn.querySelector('span');
            if (span) {
                span.textContent = currentEditProduct 
                    ? (translate('admin.action.update') || 'Update Product')
                    : (translate('admin.action.save') || 'Save Product');
            }
        }
    }
}

async function confirmAndDeleteProduct(product) {
    const productName = product.name || product.name_en || translate('admin.messages.this_product');
    const confirmMsg = translate('admin.messages.confirm_delete', { name: productName });
    const confirmed = confirm(confirmMsg);
    if (!confirmed) return;

    try {
        const collectionName = getCollectionName(product.collection || CURRENT_CATEGORY);
        await deleteDoc(doc(db, collectionName, product.id));
        const successMsg = translate('admin.messages.product_deleted');
        showInlineMessage('modal-message', successMsg, 'success');
        await refreshProducts();
    } catch (error) {
        console.error('Error deleting product', error);
        const errorMsg = translate('admin.messages.delete_failed');
        alert(errorMsg);
    }
}

function setTableLoadingState(isLoading) {
    const tableBody = findCategoryElement('products-table-body');
    if (!tableBody || !isLoading) return;
    const loadingMsg = translate('admin.table.loading');
    tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${escapeHtml(loadingMsg)}</td></tr>`;
}

function showInlineMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.classList.remove('success', 'error', 'show');
    el.classList.add(type, 'show');

    setTimeout(() => {
        el.classList.remove('show');
    }, 4000);
}

function formatCurrency(value) {
    if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
        return '-';
    }
    return `${Number(value).toFixed(2)} ₪`;
}

function capitalizeFirst(value) {
    const str = String(value || '');
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

