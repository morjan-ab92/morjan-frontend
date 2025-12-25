import { applyAdminTranslations, getAdminTranslation, getStoredAdminLang, setStoredAdminLang } from './translations_admin.js';
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
import { uploadProductImage } from './storage_utils.js';

const COLLECTION_MAP = {
    perfumes: "products"
};

const COLLECTIONS = ['accessories', 'bags', 'watches', 'perfumes'];

let productsCache = [];
let currentEditProduct = null;

// Per-category filters
const categoryFilters = {
    accessories: { search: '', gender: 'all', priceMin: null, priceMax: null },
    bags: { search: '', gender: 'all', priceMin: null, priceMax: null },
    watches: { search: '', gender: 'all', priceMin: null, priceMax: null },
    perfumes: { search: '', gender: 'all', priceMin: null, priceMax: null }
};

// Legacy filters object (kept for compatibility, but not used for rendering)
const filters = {
    search: '',
    category: 'all',
    gender: 'all',
    priceMin: null,
    priceMax: null
};

let activeAdminLang = getStoredAdminLang();

const translate = (key, replacements = {}) => {
    let text = getAdminTranslation(activeAdminLang, key);
    Object.entries(replacements).forEach(([token, value]) => {
        const pattern = new RegExp(`\\{${token}\\}`, 'g');
        text = text.replace(pattern, value);
    });
    return text;
};

function updateAdminDocumentTitle() {
    document.title = `${translate('admin.subtitle')} - J&A Jewelry`;
}

function getCategoryLabel(category) {
    return translate(`admin.categories.${category}`) || capitalizeFirst(category);
}

document.addEventListener('DOMContentLoaded', async () => {
    activeAdminLang = getStoredAdminLang();
    applyAdminTranslations(activeAdminLang);
    updateAdminDocumentTitle();
    
    // Enforce admin access - redirects if not authenticated
    const isAuthorized = await enforceAdminAccess();
    if (!isAuthorized) {
        return; // Redirect already happened
    }
    
    initializeInterface();
    refreshDashboard();
    initializeInstallmentOrders();
    loadDashboardCoupons();
    setupViewAllCouponsButton();
    handleHashNavigation();
});

// Handle hash navigation on page load and hash changes
function handleHashNavigation() {
    // Check if URL has dashboard-coupons-section hash
    const checkHash = () => {
        if (window.location.hash === '#dashboard-coupons-section' || window.location.hash === '#coupons-panel') {
            // Handle legacy coupons-panel hash by redirecting to dashboard-coupons-section
            if (window.location.hash === '#coupons-panel') {
                window.location.hash = 'dashboard-coupons-section';
                return;
            }
            
            const couponsSection = document.getElementById('dashboard-coupons-section');
            if (couponsSection) {
                couponsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update sidebar active state
                const sidebarLinks = document.querySelectorAll('.admin-nav a');
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    const sectionId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
                    if (sectionId === 'dashboard-coupons-section') {
                        link.classList.add('active');
                    }
                });
                
                // Load dashboard coupons
                setTimeout(() => {
                    if (typeof loadDashboardCoupons === 'function') {
                        loadDashboardCoupons();
                    }
                }, 100);
            }
        }
    };
    
    // Check on page load
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
}

function initializeInterface() {
    setupAdminNavbar();
    setupHeaderNavigation();
    setupLanguageToggle();
    setupSidebarNavigation();
    setupAdminLogoutButtons(); // Use shared admin logout function
    bindFilterControls();
    bindModalControls();
    bindTableActions();
    bindBulkUpload();
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
        activeAdminLang = nextLang;
        applyAdminTranslations(nextLang);
        updateAdminDocumentTitle();
        updateButtonLabel();
        
        // Update RTL/LTR direction
        document.documentElement.lang = nextLang;
        document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.remove('rtl', 'ltr');
        document.body.classList.add(nextLang === 'ar' ? 'rtl' : 'ltr');
    });
}

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.admin-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            sidebarLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            
            // Get target section
            const sectionId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    // Scroll to target section smoothly
                    // scroll-margin-top CSS handles the header offset
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Load installment orders if orders panel is shown
                    if (sectionId === 'orders-panel') {
                        setTimeout(() => loadInstallmentOrders(), 100);
                    }
                    
                    // Load coupons if dashboard coupons section is shown
                    if (sectionId === 'dashboard-coupons-section') {
                        // Load dashboard coupons
                        setTimeout(() => {
                            if (typeof loadDashboardCoupons === 'function') {
                                loadDashboardCoupons();
                            }
                        }, 100);
                    }
                }
            }
        });
    });
}

function setupAdminNavbar() {
    // Highlight current page in header navbar
    const currentPage = window.location.pathname.split('/').pop() || 'admin.html';
    
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
}

function setupHeaderNavigation() {
    // Dashboard navigation
    document.querySelectorAll(".admin-nav-dashboard").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "admin.html";
        });
    });

    // Categories navigation
    document.querySelectorAll(".admin-nav-categories").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "admin_categories.html";
        });
    });

    // Orders navigation
    document.querySelectorAll(".admin-nav-orders").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "admin_orders.html";
        });
    });

    // Category links in main nav (for admin.html) - these already have href attributes, so they work naturally
    // But we can add preventDefault if needed for consistency
    document.querySelectorAll(".admin-header-nav-main #category-watches, .admin-header-nav-main #category-bags, .admin-header-nav-main #category-accessories, .admin-header-nav-main #category-perfumes").forEach(link => {
        link.addEventListener("click", (e) => {
            // Allow natural navigation since href is already set
            // Just ensure it works
        });
    });
}

// Logout buttons are now handled by setupAdminLogoutButtons() from admin_auth.js
// This function is kept for backward compatibility but is no longer used

function bindFilterControls() {
    // Bind filters for each category
    COLLECTIONS.forEach(category => {
        const searchInput = document.getElementById(`product-search-${category}`);
        const genderSelect = document.getElementById(`filter-gender-${category}`);
        const priceMinInput = document.getElementById(`filter-price-min-${category}`);
        const priceMaxInput = document.getElementById(`filter-price-max-${category}`);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                categoryFilters[category].search = e.target.value.toLowerCase();
                applyFiltersAndRenderForCategory(category);
            });
        }

        if (genderSelect) {
            genderSelect.addEventListener('change', (e) => {
                categoryFilters[category].gender = e.target.value;
                applyFiltersAndRenderForCategory(category);
            });
        }

        if (priceMinInput) {
            priceMinInput.addEventListener('input', (e) => {
                categoryFilters[category].priceMin = e.target.value ? Number(e.target.value) : null;
                applyFiltersAndRenderForCategory(category);
            });
        }

        if (priceMaxInput) {
            priceMaxInput.addEventListener('input', (e) => {
                categoryFilters[category].priceMax = e.target.value ? Number(e.target.value) : null;
                applyFiltersAndRenderForCategory(category);
            });
        }
    });
}

function bindModalControls() {
    const openModalBtn = document.getElementById('open-product-modal');
    const closeModalBtn = document.getElementById('close-product-modal');
    const cancelModalBtn = document.getElementById('cancel-product-modal');
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');

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

    // Image preview handler
    if (imageInput && imagePreview && imagePreviewContainer) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    alert('Invalid file type. Please select a JPG, JPEG, or PNG image.');
                    e.target.value = '';
                    imagePreviewContainer.style.display = 'none';
                    return;
                }

                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    alert('File size too large. Maximum size is 5MB.');
                    e.target.value = '';
                    imagePreviewContainer.style.display = 'none';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagePreview.src = event.target.result;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreviewContainer.style.display = 'none';
            }
        });
    }
}

function bindTableActions() {
    // Bind actions for all category tables
    COLLECTIONS.forEach(category => {
        const tableBody = document.getElementById(`products-table-body-${category}`);
        if (!tableBody) return;

        tableBody.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const { action, id, collection } = button.dataset;
            const product = productsCache.find(item => item.id === id && item.collection === collection);
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
    });
}

function bindBulkUpload() {
    const uploadBtn = document.getElementById('bulk-upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleBulkUpload);
    }
}

async function refreshDashboard() {
    setTableLoadingState(true);
    try {
        const { products, stats } = await fetchAllProductsFromFirestore();
        productsCache = products;
        updateStatistics(stats);
        renderCategorySummary(stats);
        
        // Group products by category
        const grouped = {
            accessories: [],
            bags: [],
            watches: [],
            perfumes: []
        };
        
        products.forEach(product => {
            const category = product.collection || product.category || '';
            if (grouped.hasOwnProperty(category)) {
                grouped[category].push(product);
            }
        });
        
        // Render each category separately
        COLLECTIONS.forEach(category => {
            applyFiltersAndRenderForCategory(category, grouped[category]);
        });
    } catch (error) {
        console.error('Failed to load dashboard data', error);
        COLLECTIONS.forEach(category => {
            renderProductsTable([], error, category);
        });
    } finally {
        setTableLoadingState(false);
    }
}

async function fetchAllProductsFromFirestore() {
    const stats = {};
    const products = [];

    await Promise.all(
        COLLECTIONS.map(async (categoryAlias) => {
            const collectionName = getCollectionName(categoryAlias);
            const snapshot = await getDocs(collection(db, collectionName));
            stats[categoryAlias] = snapshot.size;
            snapshot.forEach((docSnap) => {
                products.push({
                    id: docSnap.id,
                    collection: categoryAlias,
                    ...docSnap.data()
                });
            });
        })
    );

    return { products, stats };
}

function getCollectionName(alias) {
    return COLLECTION_MAP[alias] || alias;
}

function updateStatistics(stats) {
    const map = {
        accessories: 'accessories-count',
        bags: 'bags-count',
        watches: 'watches-count',
        perfumes: 'perfumes-count'
    };

    Object.entries(map).forEach(([key, elementId]) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = stats[key] ?? '--';
        }
    });
}

function renderCategorySummary(stats) {
    const container = document.getElementById('categories-summary');
    if (!container) return;

    const chips = COLLECTIONS.map(category => {
        const count = stats[category] ?? 0;
        return `<span class="category-chip">
            <strong>${getCategoryLabel(category)}</strong>
            <span>${count} ${translate('admin.count.items')}</span>
        </span>`;
    }).join('');

    container.innerHTML = chips;
}

function applyFiltersAndRenderForCategory(category, productsToFilter = null) {
    const products = productsToFilter || productsCache.filter(p => 
        (p.collection || p.category || '').toLowerCase() === category.toLowerCase()
    );
    const filtered = applyFiltersForCategory(products, category);
    renderProductsTable(filtered, null, category);
    
    // Update category count
    const countElement = document.getElementById(`${category}-table-count`);
    if (countElement) {
        countElement.textContent = filtered.length;
    }
}

function applyFiltersForCategory(products, category) {
    const filter = categoryFilters[category] || categoryFilters.accessories;
    
    return products.filter(product => {
        const gender = (product.gender || '').toLowerCase();
        const price = Number(product.price_after ?? product.priceAfter ?? product.price ?? 0);

        const matchesSearch = filter.search
            ? matchesSearchQuery(product, filter.search)
            : true;

        const matchesGender = filter.gender === 'all'
            ? true
            : gender === filter.gender;

        const matchesPriceMin = filter.priceMin !== null
            ? price >= filter.priceMin
            : true;

        const matchesPriceMax = filter.priceMax !== null
            ? price <= filter.priceMax
            : true;

        return matchesSearch && matchesGender && matchesPriceMin && matchesPriceMax;
    });
}

// Legacy function kept for compatibility
function applyFiltersAndRender() {
    const filtered = applyFilters(productsCache);
    renderProductsTable(filtered);
}

function applyFilters(products) {
    return products.filter(product => {
        const category = (product.category || product.collection || '').toLowerCase();
        const gender = (product.gender || '').toLowerCase();
        const price = Number(product.price_after ?? product.priceAfter ?? product.price ?? 0);

        const matchesSearch = filters.search
            ? matchesSearchQuery(product, filters.search)
            : true;

        const matchesCategory = filters.category === 'all'
            ? true
            : category === filters.category;

        const matchesGender = filters.gender === 'all'
            ? true
            : gender === filters.gender;

        const matchesPriceMin = filters.priceMin !== null
            ? price >= filters.priceMin
            : true;

        const matchesPriceMax = filters.priceMax !== null
            ? price <= filters.priceMax
            : true;

        return matchesSearch && matchesCategory && matchesGender && matchesPriceMin && matchesPriceMax;
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

function renderProductsTable(products, error = null, categoryName = null) {
    // Determine which table body to use
    const tableBodyId = categoryName 
        ? `products-table-body-${categoryName}` 
        : 'products-table-body';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    if (error) {
        const message = escapeHtml(error.message || translate('admin.table.failed'));
        tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${message}</td></tr>`;
        return;
    }

    if (!products.length) {
        const emptyMessage = escapeHtml(translate('admin.messages.no_products_match'));
        tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">${emptyMessage}</td></tr>`;
        return;
    }

    const rows = products.map(product => {
        const categorySlug = (product.category || product.collection || '-').toLowerCase();
        const category = categorySlug === '-' ? '-' : getCategoryLabel(categorySlug);
        const genderSlug = (product.gender || 'unisex').toLowerCase();
        const gender = translate(`admin.filters.gender_${genderSlug}`) || capitalizeFirst(genderSlug);
        const priceBefore = formatCurrency(product.price_before ?? product.priceBefore);
        const priceAfter = formatCurrency(product.price_after ?? product.priceAfter ?? product.price);
        
        // Validate and sanitize image URL - prioritize product.image
        let imageUrl = product.image || product.image_url || '';
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

        return `
            <tr>
                <td>
                    <div class="product-summary">
                        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name || translate('admin.table.product'))}" class="product-thumb" onerror="this.onerror=null; this.src='assets/images/products/placeholder.jpg';">
                        <div class="product-names">
                            ${renderMultilingualNames(product)}
                            <span class="product-id">${translate('admin.table.id_prefix')} ${escapeHtml(product.id)}</span>
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
                        <button class="btn-gold" data-action="edit" data-id="${escapeHtml(product.id)}" data-collection="${escapeHtml(product.collection)}">
                            <i class="fa fa-edit"></i> ${translate('admin.action.edit')}
                        </button>
                        <button class="btn-danger" data-action="delete" data-id="${escapeHtml(product.id)}" data-collection="${escapeHtml(product.collection)}">
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
    const names = [
        { label: 'EN', value: product.name || product.name_en },
        { label: 'AR', value: product.name_ar },
        { label: 'HE', value: product.name_he }
    ];

    return names
        .filter(item => item.value)
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
    const translateBtn = document.getElementById('translate-from-ar-btn');
    
    // Hide translation helper text
    const hintEn = document.getElementById('translation-unavailable-hint');
    const hintHe = document.getElementById('translation-unavailable-hint-he');
    if (hintEn) hintEn.style.display = 'none';
    if (hintHe) hintHe.style.display = 'none';
    
    // Reset translation availability flag for new modal
    translationAvailable = true;

    if (modalTitle) modalTitle.textContent = translate('admin.modal.title.add');
    if (submitBtn) submitBtn.querySelector('span').textContent = translate('admin.action.save');
    if (messageEl) messageEl.classList.remove('show', 'success', 'error');
    // Hide translate button in add mode (only show in edit mode)
    if (translateBtn) translateBtn.style.display = 'none';
    if (modal) modal.classList.add('active');
    
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
    currentEditProduct = null;
    
    // Clear image preview
    const imageInput = document.getElementById('product-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    if (imageInput) {
        imageInput.value = '';
        imageInput.required = true; // Required for new products
    }
    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }
}

function startEditProduct(product) {
    currentEditProduct = { id: product.id, collection: product.collection };
    const formFields = {
        'product-name': product.name || product.name_en || '',
        'product-name-ar': product.name_ar || '',
        'product-name-he': product.name_he || '',
        'product-category': product.category || product.collection || '',
        'product-gender': product.gender || '',
        'product-price-before': product.price_before ?? product.priceBefore ?? '',
        'product-price-after': product.price_after ?? product.priceAfter ?? product.price ?? '',
        'product-brand': product.brand || '',
        'product-image-url': product.image_url || product.image || '',
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
        }
    });

    // Clear image input and preview for edit (admin can upload new image)
    const imageInput = document.getElementById('product-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    if (imageInput) {
        imageInput.value = '';
        imageInput.required = false; // Not required when editing
    }
    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }

    // Show current image if available
    const currentImageUrl = product.image || product.image_url || '';
    if (currentImageUrl && imagePreviewContainer) {
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) {
            imagePreview.src = currentImageUrl;
            imagePreviewContainer.style.display = 'block';
        }
    }

    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('product-form-submit');
    const translateBtn = document.getElementById('translate-from-ar-btn');
    
    if (modalTitle) modalTitle.textContent = translate('admin.modal.title.edit');
    if (submitBtn) submitBtn.querySelector('span').textContent = translate('admin.action.update');
    // Show translate button in edit mode
    if (translateBtn) translateBtn.style.display = 'block';

    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.add('active');
    
    // Setup translate button handler for edit mode
    setupEditModeTranslateButton();
}

function collectModalFormData() {
    const valueOf = (id) => (document.getElementById(id)?.value || '').trim();

    const name = valueOf('product-name');
    const nameAr = valueOf('product-name-ar');
    const nameHe = valueOf('product-name-he');
    const category = valueOf('product-category');
    const gender = valueOf('product-gender');
    const priceBefore = valueOf('product-price-before');
    const priceAfter = valueOf('product-price-after');
    const brand = valueOf('product-brand');
    const description = valueOf('product-description');
    const isSale = document.getElementById('product-is-sale')?.checked || false;
    const imageInput = document.getElementById('product-image');
    const imageFile = imageInput?.files?.[0];

    // Basic validation
    if (!name || !category || !gender || !priceAfter) {
        throw new Error(translate('admin.messages.required_fields'));
    }

    // For new products, image is required
    if (!currentEditProduct && !imageFile) {
        throw new Error('Please select an image file.');
    }

    // Determine brand: use provided brand, or name for watches/perfumes
    let finalBrand = brand;
    if (!finalBrand && (category === 'watches' || category === 'perfumes')) {
        finalBrand = name; // Use name as brand for watches/perfumes
    }

    return {
        name,
        name_ar: nameAr || null,
        name_he: nameHe || null,
        category,
        gender,
        brand: finalBrand || null,
        price_before: priceBefore ? Number(priceBefore) : null,
        price_after: Number(priceAfter),
        isSale: isSale === true,
        imageFile, // Include file for upload
        description: description || null
    };
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    const messageEl = document.getElementById('modal-message');
    const submitBtn = document.getElementById('product-form-submit');

    // Validate Arabic name is required
    const nameAr = document.getElementById('product-name-ar')?.value.trim();
    if (!nameAr) {
        const errorMsg = translate('admin.messages.name_ar_required') || 'الاسم بالعربية مطلوب / Arabic product name is required.';
        showInlineMessage('modal-message', errorMsg, 'error');
        return;
    }

    try {
        // Disable submit button during upload
        if (submitBtn) {
            submitBtn.disabled = true;
            const originalText = submitBtn.querySelector('span')?.textContent || 'Save';
            submitBtn.querySelector('span').textContent = 'Uploading...';
        }

        const formData = collectModalFormData();
        let imageUrl = formData.imageFile ? null : (formData.image_url || '');

        // Upload image if provided
        if (formData.imageFile) {
            try {
                showInlineMessage('modal-message', 'Uploading image...', 'success');
                imageUrl = await uploadProductImage(
                    formData.imageFile,
                    formData.category,
                    formData.brand || formData.name,
                    formData.gender
                );
                console.log('✅ Image uploaded successfully:', imageUrl);
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                throw new Error(`Failed to upload image: ${uploadError.message}`);
            }
        }

        // If editing and no new image, use existing image
        if (currentEditProduct && !imageUrl) {
            const existingProduct = productsCache.find(
                p => p.id === currentEditProduct.id && p.collection === currentEditProduct.collection
            );
            if (existingProduct) {
                imageUrl = existingProduct.image || existingProduct.image_url || '';
            }
        }

        if (!imageUrl) {
            throw new Error('Image is required. Please upload an image or provide an image URL.');
        }

        // Prepare payload (remove imageFile, add image URL)
        const { imageFile, ...payloadData } = formData;
        const basePayload = {
            ...payloadData,
            image: imageUrl, // Use 'image' field (highest priority)
            image_url: imageUrl, // Keep for backward compatibility
            updated_at: new Date().toISOString()
        };

        if (currentEditProduct) {
            const collectionName = getCollectionName(currentEditProduct.collection);
            await updateDoc(doc(db, collectionName, currentEditProduct.id), basePayload);
            showInlineMessage('modal-message', translate('admin.messages.product_updated'), 'success');
        } else {
            const collectionName = getCollectionName(formData.category);
            await addDoc(collection(db, collectionName), {
                ...basePayload,
                created_at: new Date().toISOString()
            });
            showInlineMessage('modal-message', translate('admin.messages.product_added'), 'success');
        }

        closeProductModal();
        await refreshDashboard();
    } catch (error) {
        console.error('Error saving product', error);
        showInlineMessage('modal-message', error.message || translate('admin.messages.product_save_failed'), 'error');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            const actionText = currentEditProduct 
                ? translate('admin.action.update') 
                : translate('admin.action.save');
            if (submitBtn.querySelector('span')) {
                submitBtn.querySelector('span').textContent = actionText;
            }
        }
    }
}

async function confirmAndDeleteProduct(product) {
    const productName = product.name || translate('admin.messages.this_product');
    const confirmed = confirm(translate('admin.messages.confirm_delete', { name: productName }));
    if (!confirmed) return;

    try {
        const collectionName = getCollectionName(product.collection);
        await deleteDoc(doc(db, collectionName, product.id));
        showInlineMessage('modal-message', translate('admin.messages.product_deleted'), 'success');
        await refreshDashboard();
    } catch (error) {
        console.error('Error deleting product', error);
        alert(translate('admin.messages.delete_failed_alert'));
    }
}

function setTableLoadingState(isLoading) {
    if (!isLoading) return;
    COLLECTIONS.forEach(category => {
        const tableBody = document.getElementById(`products-table-body-${category}`);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">Loading products…</td></tr>`;
        }
    });
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

async function handleBulkUpload() {
    const fileInput = document.getElementById('json-file');
    const file = fileInput?.files?.[0];

    if (!file) {
        showInlineMessage('upload-message', 'Please select a JSON file.', 'error');
        return;
    }

    if (!file.name.endsWith('.json')) {
        showInlineMessage('upload-message', 'Only JSON files are supported.', 'error');
        return;
    }

    try {
        const fileContent = await file.text();
        const payload = JSON.parse(fileContent);
        if (!Array.isArray(payload) || !payload.length) {
            throw new Error('JSON must be an array of products.');
        }

        showInlineMessage('upload-message', 'Uploading products…', 'success');

        for (let i = 0; i < payload.length; i += 1) {
            const record = normalizeBulkProduct(payload[i]);
            const targetCollection = getCollectionName(record.category);
            await addDoc(collection(db, targetCollection), {
                ...record,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            setUploadProgress(Math.round(((i + 1) / payload.length) * 100));
        }

        showInlineMessage('upload-message', `Uploaded ${payload.length} products successfully.`, 'success');
        await refreshDashboard();
    } catch (error) {
        console.error('Bulk upload error', error);
        showInlineMessage('upload-message', error.message || 'Failed to upload JSON.', 'error');
    } finally {
        setTimeout(() => setUploadProgress(0), 1500);
    }
}

function normalizeBulkProduct(product) {
    const category = (product.category || product.collection || '').trim().toLowerCase();
    if (!category) {
        throw new Error('Each product must include a category.');
    }

    const priceAfter = Number(product.price_after ?? product.priceAfter ?? product.price);
    if (Number.isNaN(priceAfter)) {
        throw new Error(`Product "${product.name || 'Unnamed'}" is missing a valid price.`);
    }

    return {
        name: product.name || product.name_en || 'Unnamed Product',
        name_ar: product.name_ar || null,
        name_he: product.name_he || null,
        category,
        gender: (product.gender || 'unisex').toLowerCase(),
        price_before: product.price_before ?? product.priceBefore ?? null,
        price_after: priceAfter,
        image: product.image || product.image_url || '', // Prioritize image field
        image_url: product.image || product.image_url || '', // Keep for backward compatibility
        description: product.description || null
    };
}

function setUploadProgress(percent) {
    const progressBar = document.getElementById('upload-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
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

// ===== INSTALLMENT ORDERS MANAGEMENT =====

// Initialize installment orders section
function initializeInstallmentOrders() {
    // Load orders when orders panel scrolls into view or when clicked
    const ordersPanel = document.getElementById('orders-panel');
    if (!ordersPanel) return;
    
    // Use IntersectionObserver to load orders when section scrolls into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadInstallmentOrders();
                // Unobserve after first load to avoid reloading unnecessarily
                observer.unobserve(ordersPanel);
            }
        });
    }, {
        threshold: 0.1 // Load when 10% of section is visible
    });
    
    observer.observe(ordersPanel);
    
    // Also load on section link click (handled in setupSidebarNavigation)
    // This ensures orders load immediately when clicked, even if not yet in viewport
}

// Load recent orders from Firestore (all orders, not filtered by installment/payment type)
async function loadInstallmentOrders() {
    const container = document.getElementById('installment-orders-container');
    if (!container) return;
    
    try {
        container.innerHTML = `<p style="color: var(--text-secondary);" data-translate="orders.dashboard.empty">${translate('orders.dashboard.empty')}</p>`;
        applyAdminTranslations();
        
        const { getDocs } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js');
        const ordersRef = collection(db, 'orders');
        
        // Fetch all orders (no filtering by payment status or installment type)
        const querySnapshot = await getDocs(ordersRef);
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        if (orders.length === 0) {
            container.innerHTML = `<p style="color: var(--text-secondary);" data-translate="orders.dashboard.empty">${translate('orders.dashboard.empty')}</p>`;
            // Hide "View All Orders" button when no orders
            const viewAllContainer = document.getElementById('installment-orders-view-all');
            if (viewAllContainer) {
                viewAllContainer.style.display = 'none';
            }
            // Apply translations to empty message
            applyAdminTranslations();
            return;
        }
        
        // Sort by order date (newest first)
        orders.sort((a, b) => {
            const dateA = a.orderDate ? new Date(a.orderDate).getTime() : (a.createdAt?.toDate?.()?.getTime() || (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            const dateB = b.orderDate ? new Date(b.orderDate).getTime() : (b.createdAt?.toDate?.()?.getTime() || (b.createdAt ? new Date(b.createdAt).getTime() : 0));
            return dateB - dateA;
        });
        
        // Show only latest 5 orders (regardless of status)
        const latestOrders = orders.slice(0, 5);
        
        renderInstallmentOrders(latestOrders, container);
        
        // Show "View All Orders" button if there are orders
        const viewAllContainer = document.getElementById('installment-orders-view-all');
        if (viewAllContainer) {
            viewAllContainer.style.display = 'block';
            applyAdminTranslations();
        }
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        container.innerHTML = `<p style="color: #ff4444;">${translate('admin.orders.messages.status_update_failed')}</p>`;
        applyAdminTranslations();
    }
}

// Render installment orders
function renderInstallmentOrders(orders, container) {
    const ordersHTML = orders.map(order => {
        const customerName = order.customerInfo?.fullName || order.customerInfo?.firstName + ' ' + order.customerInfo?.lastName || 'Guest';
        const customerPhone = order.customerInfo?.phone || 'N/A';
        const orderTotal = order.total || 0;
        const orderId = order.orderId || order.id;
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A';
        
        // Format items list
        const itemsList = order.items?.map(item => {
            const qty = item.quantity || 1;
            const name = item.name || 'Product';
            return `${qty}x ${name}`;
        }).join(', ') || 'No items';
        
        return `
            <div class="installment-order-card" data-order-id="${order.id}" style="
                background: var(--bg-secondary);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="color: var(--gold); margin-bottom: 0.5rem;">Order: ${orderId}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Date: ${orderDate}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: var(--gold); font-size: 1.2rem; font-weight: 600;">₪${orderTotal.toFixed(2)}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <p style="color: var(--text-primary); margin-bottom: 0.25rem;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
                    <p style="color: var(--text-primary); margin-bottom: 0.25rem;"><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;"><strong>Items:</strong> ${escapeHtml(itemsList)}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem;">Payment Link:</label>
                    <input type="text" 
                           class="payment-link-input" 
                           data-order-id="${order.id}"
                           placeholder="Paste payment link here"
                           style="
                               width: 100%;
                               padding: 0.75rem;
                               background: var(--bg-primary);
                               border: 1px solid var(--border);
                               border-radius: 8px;
                               color: var(--text-primary);
                               font-size: 0.9rem;
                           ">
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button class="send-whatsapp-btn" 
                            data-order-id="${order.id}"
                            data-phone="${customerPhone}"
                            style="
                                flex: 1;
                                padding: 0.75rem;
                                background: #25D366;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                                transition: background 0.3s;
                            "
                            onmouseover="this.style.background='#20BA5A'"
                            onmouseout="this.style.background='#25D366'">
                        <i class="fab fa-whatsapp"></i> Send Payment Link via WhatsApp
                    </button>
                    <button class="mark-paid-btn" 
                            data-order-id="${order.id}"
                            style="
                                flex: 1;
                                padding: 0.75rem;
                                background: var(--gold);
                                color: var(--bg-primary);
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                                transition: background 0.3s;
                            "
                            onmouseover="this.style.background='var(--gold-light)'"
                            onmouseout="this.style.background='var(--gold)'">
                        Mark as Paid
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = ordersHTML;
    
    // Attach event listeners
    attachInstallmentOrderListeners();
}

// Attach event listeners for installment orders
function attachInstallmentOrderListeners() {
    // Send WhatsApp button
    document.querySelectorAll('.send-whatsapp-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            const phone = e.target.getAttribute('data-phone');
            await sendPaymentLinkViaWhatsApp(orderId, phone);
        });
    });
    
    // Mark as paid button
    document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            await markOrderAsPaid(orderId);
        });
    });
}

// Send payment link via WhatsApp
async function sendPaymentLinkViaWhatsApp(orderId, phone) {
    try {
        // Get payment link from input
        const orderCard = document.querySelector(`.installment-order-card[data-order-id="${orderId}"]`);
        if (!orderCard) {
            alert('Order card not found');
            return;
        }
        
        const paymentLinkInput = orderCard.querySelector('.payment-link-input');
        const paymentLink = paymentLinkInput?.value.trim();
        
        if (!paymentLink) {
            alert('Please enter a payment link first');
            paymentLinkInput?.focus();
            return;
        }
        
        // Validate phone number
        if (!phone || phone === 'N/A') {
            alert('Customer phone number is not available');
            return;
        }
        
        // Clean phone number (remove non-digits, ensure it starts with country code)
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('972')) {
            // If doesn't start with 972 (Israel), try to add it
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '972' + cleanPhone.substring(1);
            } else {
                cleanPhone = '972' + cleanPhone;
            }
        }
        
        // Create WhatsApp message
        const message = `Hello, this is your installment payment link for your order:\n${paymentLink}\n\nAfter payment, your order will be prepared immediately.\nThank you ❤️`;
        
        // Encode message
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        console.log('✅ WhatsApp link opened for order:', orderId);
        
    } catch (error) {
        console.error('❌ Error sending WhatsApp link:', error);
        alert('Error opening WhatsApp. Please try again.');
    }
}

// Mark order as paid
async function markOrderAsPaid(orderId) {
    try {
        if (!confirm('Are you sure you want to mark this order as paid?')) {
            return;
        }
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js');
        const orderRef = doc(db, 'orders', orderId);
        
        await updateDoc(orderRef, {
            paymentStatus: 'paid',
            updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Order marked as paid:', orderId);
        
        // Reload orders
        await loadInstallmentOrders();
        
        alert('Order marked as paid successfully!');
        
    } catch (error) {
        console.error('❌ Error marking order as paid:', error);
        alert('Error updating order. Please try again.');
    }
}

// Get auth token for API calls (same logic as admin_coupons.js)
async function getAuthToken() {
    try {
        const { auth } = await import('../../firebase-frontend-config.js');
        
        // Check if there's an authenticated user
        const user = auth.currentUser;
        if (!user) {
            console.warn('No authenticated user found');
            return null;
        }
        
        // Verify admin role
        const roleKeys = ['userRole', 'jwt_role'];
        const isAdmin = roleKeys.some(key => {
            const role = localStorage.getItem(key);
            return role && role.toLowerCase() === 'admin';
        });
        
        if (!isAdmin) {
            console.warn('User is not an admin');
            return null;
        }
        
        // Force a fresh token by passing true to getIdToken
        const token = await user.getIdToken(true);
        
        if (!token) {
            console.warn('Failed to retrieve token');
            return null;
        }
        
        return token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

// Load and display coupons on dashboard
async function loadDashboardCoupons() {
    const container = document.getElementById('dashboard-coupons-container');
    const viewAllBtn = document.getElementById('dashboard-coupons-view-all');
    if (!container) return;
    
    try {
        container.innerHTML = `<p style="color: var(--text-secondary);">${translate('admin.coupons.loading')}</p>`;
        
        // Get a fresh, valid Firebase ID token
        const token = await getAuthToken();
        if (!token) {
            container.innerHTML = `<p style="color: var(--text-secondary);" data-translate="admin.coupons.auth_required">Authentication required</p>`;
            applyAdminTranslations();
            return;
        }
        
        const response = await fetch('https://morjan-backend.onrender.com/admin/coupons', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const coupons = await response.json();
        renderDashboardCoupons(coupons);
        
    } catch (error) {
        console.error('Error loading dashboard coupons:', error);
        if (container) {
            container.innerHTML = `<p style="color: #ff3b3b;" data-translate="admin.coupons.load_error">${translate('admin.coupons.load_error')}: ${error.message}</p>`;
            applyAdminTranslations();
        }
    }
}

// Render coupons on dashboard (latest 3-5 coupons)
function renderDashboardCoupons(coupons) {
    const container = document.getElementById('dashboard-coupons-container');
    const viewAllBtn = document.getElementById('dashboard-coupons-view-all');
    if (!container) return;

    if (!coupons || coupons.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary);" data-translate="admin.coupons.empty">${translate('admin.coupons.empty')}</p>`;
        if (viewAllBtn) viewAllBtn.style.display = 'none';
        applyAdminTranslations();
        return;
    }

    // Get latest 3-5 coupons (sorted by created_at if available, otherwise take first 5)
    const latestCoupons = coupons
        .sort((a, b) => {
            // Sort by created_at if available, otherwise keep original order
            if (a.created_at && b.created_at) {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB - dateA;
            }
            return 0;
        })
        .slice(0, 5);

    // Create cards for each coupon
    const couponsHTML = latestCoupons.map(coupon => {
        // Format discount value
        const discountValue = coupon.type === 'percent' 
            ? `${coupon.value}%`
            : `₪${coupon.value}`;
        
        // Status badge
        const statusBadge = coupon.active 
            ? `<span style="color: #4caf50; font-weight: 600;" data-translate="admin.coupons.status.active">${translate('admin.coupons.status.active')}</span>`
            : `<span style="color: #888;" data-translate="admin.coupons.status.inactive">${translate('admin.coupons.status.inactive')}</span>`;
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
        
        return `
            <div class="dashboard-coupon-card">
                <div class="dashboard-coupon-header">
                    <i class="fa fa-ticket-alt" style="color: var(--gold); font-size: 1.25rem;"></i>
                    <strong class="dashboard-coupon-code">${escapeHtml(coupon.code)}</strong>
                </div>
                <div class="dashboard-coupon-discount">
                    <span class="dashboard-coupon-discount-value">${discountValue}</span>
                    <span style="color: var(--text-secondary); margin-left: 0.5rem;" data-translate="coupon.discount_label">${translate('coupon.discount_label')}</span>
                </div>
                <div class="dashboard-coupon-status">
                    <span class="dashboard-coupon-status-label" data-translate="admin.coupons.status.label">${translate('admin.coupons.status.label')}:</span>
                    ${statusBadge}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = couponsHTML;
    
    // Show "View all coupons" button
    if (viewAllBtn) {
        viewAllBtn.style.display = 'block';
    }
    
    // Apply translations to dynamically rendered content
    applyAdminTranslations();
}

// Setup "View all coupons" button navigation
function setupViewAllCouponsButton() {
    const viewAllBtn = document.getElementById('view-all-coupons-btn');
    if (!viewAllBtn) return;
    
    viewAllBtn.addEventListener('click', () => {
        // Navigate to dashboard coupons section
        const couponsSection = document.getElementById('dashboard-coupons-section');
        if (couponsSection) {
            // Update URL hash without reloading
            window.location.hash = 'dashboard-coupons-section';
            
            // Scroll to the section smoothly
            couponsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update sidebar active state
            const sidebarLinks = document.querySelectorAll('.admin-nav a');
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                const sectionId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
                if (sectionId === 'dashboard-coupons-section') {
                    link.classList.add('active');
                }
            });
            
            // Reload dashboard coupons to ensure fresh data
            setTimeout(() => {
                if (typeof loadDashboardCoupons === 'function') {
                    loadDashboardCoupons();
                }
            }, 100);
        } else {
            // Fallback: navigate to the page with hash
            window.location.href = 'admin.html#dashboard-coupons-section';
        }
    });
}

