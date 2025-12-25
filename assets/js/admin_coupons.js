import { db } from '../../firebase-frontend-config.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAdminTranslation, getStoredAdminLang, applyAdminTranslations } from './translations_admin.js';

let couponsCache = [];
let currentEditCoupon = null;

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

// Get auth token for API calls
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
        // This ensures we always get a valid, non-expired token
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

// Track current language to detect changes
let currentLang = getStoredAdminLang();

// Initialize coupons management
document.addEventListener('DOMContentLoaded', async () => {
    initializeCouponInterface();
    await loadCoupons();
    
    // Listen for language changes and reload coupons table
    // Use MutationObserver to detect when lang attribute changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                const newLang = document.documentElement.lang;
                if (newLang !== currentLang) {
                    currentLang = newLang;
                    // Re-render coupons table with new language
                    if (couponsCache.length > 0) {
                        renderCouponsTable(couponsCache, null);
                    }
                }
            }
        });
    });
    
    // Observe the document for lang attribute changes
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
});

function initializeCouponInterface() {
    // Modal controls - handle both dashboard and panel buttons
    const openModalBtn = document.getElementById('open-coupon-modal');
    const openModalBtns = document.querySelectorAll('.open-coupon-modal-btn');
    const closeModalBtn = document.getElementById('close-coupon-modal');
    const cancelModalBtn = document.getElementById('cancel-coupon-modal');
    const modal = document.getElementById('coupon-modal');
    const form = document.getElementById('coupon-form');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => openCouponModal());
    }
    
    // Handle all buttons with the class (for panel and any other instances)
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', () => openCouponModal());
    });

    [closeModalBtn, cancelModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeCouponModal);
    });

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeCouponModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', handleCouponFormSubmit);
        
        // Add real-time validation listeners to form fields
        const codeInput = document.getElementById('coupon-code');
        const typeSelect = document.getElementById('coupon-type');
        const valueInput = document.getElementById('coupon-value');
        
        if (codeInput) {
            codeInput.addEventListener('input', validateCouponForm);
            codeInput.addEventListener('change', validateCouponForm);
        }
        
        if (typeSelect) {
            typeSelect.addEventListener('change', validateCouponForm);
        }
        
        if (valueInput) {
            valueInput.addEventListener('input', validateCouponForm);
            valueInput.addEventListener('change', validateCouponForm);
        }
    }
}

function openCouponModal() {
    currentEditCoupon = null;
    clearCouponModal();
    const modal = document.getElementById('coupon-modal');
    const modalTitle = document.getElementById('coupon-modal-title');
    const submitBtn = document.getElementById('coupon-form-submit');
    const messageEl = document.getElementById('coupon-modal-message');
    
    if (modalTitle) {
        modalTitle.setAttribute('data-translate', 'admin.coupons.create');
        modalTitle.textContent = translate('admin.coupons.create');
    }
    if (submitBtn) {
        const span = submitBtn.querySelector('span');
        if (span) span.textContent = translate('admin.action.save');
        
        // Initially disable button since form is empty
        submitBtn.disabled = true;
    }
    if (messageEl) messageEl.classList.remove('show', 'success', 'error');
    if (modal) modal.classList.add('active');
    
    // Apply translations to modal content
    applyAdminTranslations();
    
    // Validate form after a short delay to ensure DOM is ready
    setTimeout(() => {
        validateCouponForm();
    }, 100);
}

function closeCouponModal() {
    const modal = document.getElementById('coupon-modal');
    if (modal) modal.classList.remove('active');
    clearCouponModal();
}

function clearCouponModal() {
    const form = document.getElementById('coupon-form');
    if (form) form.reset();
    currentEditCoupon = null;
    
    const messageEl = document.getElementById('coupon-modal-message');
    if (messageEl) {
        messageEl.classList.remove('show', 'success', 'error');
        messageEl.textContent = '';
    }
    
    // Reset button state - disabled when form is empty
    const submitBtn = document.getElementById('coupon-form-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

/**
 * Validate coupon form and enable/disable submit button
 * Button is always visible but disabled when form is invalid
 */
function validateCouponForm() {
    const submitBtn = document.getElementById('coupon-form-submit');
    if (!submitBtn) return;
    
    // Get form field values
    const codeInput = document.getElementById('coupon-code');
    const typeSelect = document.getElementById('coupon-type');
    const valueInput = document.getElementById('coupon-value');
    
    // Validate required fields
    const code = codeInput ? codeInput.value.trim() : '';
    const type = typeSelect ? typeSelect.value : '';
    const value = valueInput ? parseFloat(valueInput.value) : NaN;
    
    // Check if form is valid
    let isValid = true;
    
    // Code is required and must not be empty
    if (!code || code.length === 0) {
        isValid = false;
    }
    
    // Type is required
    if (!type || (type !== 'percent' && type !== 'fixed')) {
        isValid = false;
    }
    
    // Value is required and must be a positive number
    if (isNaN(value) || value <= 0) {
        isValid = false;
    }
    
    // If type is percent, value must be <= 100
    if (type === 'percent' && value > 100) {
        isValid = false;
    }
    
    // Enable or disable button based on validation
    submitBtn.disabled = !isValid;
    
    return isValid;
}

function startEditCoupon(coupon) {
    currentEditCoupon = { id: coupon.id };
    const formFields = {
        'coupon-code': coupon.code || '',
        'coupon-type': coupon.type || 'percent',
        'coupon-value': coupon.value || 0,
        'coupon-expiry': coupon.expiry || '',
        'coupon-first-order': coupon.firstOrderOnly === true,
        'coupon-active': coupon.active !== false
    };

    Object.entries(formFields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value === true;
            } else {
                field.value = value;
            }
        }
    });

    const modalTitle = document.getElementById('coupon-modal-title');
    const submitBtn = document.getElementById('coupon-form-submit');
    
    if (modalTitle) {
        modalTitle.setAttribute('data-translate', 'admin.coupons.edit_title');
        modalTitle.textContent = translate('admin.coupons.edit_title');
    }
    if (submitBtn) {
        const span = submitBtn.querySelector('span');
        if (span) span.textContent = translate('admin.action.update');
    }

    const modal = document.getElementById('coupon-modal');
    if (modal) modal.classList.add('active');
    
    // Apply translations to modal content
    applyAdminTranslations();
    
    // Validate form after a short delay to ensure values are set
    setTimeout(() => {
        validateCouponForm();
    }, 100);
}

async function loadCoupons() {
    const container = document.getElementById('coupons-container');
    if (!container) return;
    
    try {
        container.innerHTML = `<p style="color: var(--text-secondary);">${translate('admin.coupons.loading')}</p>`;
        
        // Get a fresh, valid Firebase ID token
        const token = await getAuthToken();
        if (!token) {
            // Check if user is authenticated at all
            const { auth } = await import('../../firebase-frontend-config.js');
            let errorMessage = translate('admin.coupons.auth_required') || 'Authentication required';
            
            if (!auth.currentUser) {
                errorMessage = translate('admin.coupons.auth_required') || 'You must be logged in to view coupons. Please log in and try again.';
            } else {
                // Check admin role
                const roleKeys = ['userRole', 'jwt_role'];
                const isAdmin = roleKeys.some(key => {
                    const role = localStorage.getItem(key);
                    return role && role.toLowerCase() === 'admin';
                });
                
                if (!isAdmin) {
                    errorMessage = translate('admin.coupons.admin_required') || 'You must be an administrator to view coupons.';
                } else {
                    errorMessage = translate('admin.coupons.token_error') || 'Failed to retrieve authentication token. Please try again.';
                }
            }
            
            container.innerHTML = `<p style="color: #ff3b3b;">${errorMessage}</p>`;
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
        couponsCache = coupons;
        renderCouponsTable(coupons, null);
        
    } catch (error) {
        console.error('Error loading coupons:', error);
        const container = document.getElementById('coupons-container');
        if (container) {
            container.innerHTML = `<p style="color: #ff3b3b;" data-translate="admin.coupons.load_error">${translate('admin.coupons.load_error')}: ${error.message}</p>`;
            applyAdminTranslations();
        }
    }
}

function renderCouponsTable(coupons, error = null) {
    const container = document.getElementById('coupons-container');
    if (!container) return;

    if (error) {
        container.innerHTML = `<p style="color: #ff3b3b;" data-translate="admin.coupons.load_error">${translate('admin.coupons.load_error')}: ${error.message}</p>`;
        applyAdminTranslations();
        return;
    }

    if (!coupons || coupons.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary);" data-translate="admin.coupons.empty">${translate('admin.coupons.empty')}</p>`;
        // Remove existing view all button if present
        const existingViewAllBtn = container.parentElement?.querySelector('.coupons-view-all-btn-container');
        if (existingViewAllBtn) {
            existingViewAllBtn.remove();
        }
        applyAdminTranslations();
        return;
    }

    const tableHTML = `
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.code">Code</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.type">Type</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.value">Value</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.first_order">First Order</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.expiry">Expiry</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.status">Status</th>
                    <th style="padding: 1rem; text-align: left; color: var(--gold);" data-translate="admin.coupons.table.actions">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${coupons.map(coupon => {
                    // Improved formatting: show discount label
                    const discountLabel = translate('coupon.discount_label');
                    const typeLabel = coupon.type === 'percent' 
                        ? `${coupon.value}% ${discountLabel}` 
                        : `₪${coupon.value} ${discountLabel}`;
                    const statusBadge = coupon.active 
                        ? `<span style="color: #4caf50; font-weight: 600;">${translate('admin.coupons.status.active')}</span>`
                        : `<span style="color: #888;">${translate('admin.coupons.status.inactive')}</span>`;
                    const expiryText = coupon.expiry 
                        ? new Date(coupon.expiry).toLocaleDateString()
                        : translate('admin.coupons.no_expiry');
                    const firstOrderText = coupon.firstOrderOnly ? translate('admin.coupons.yes') : translate('admin.coupons.no');
                    const typeText = coupon.type === 'percent' ? translate('admin.coupons.type_percentage') : translate('admin.coupons.type_fixed_amount');
                    
                    return `
                        <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
                            <td style="padding: 1rem;"><strong>${escapeHtml(coupon.code)}</strong></td>
                            <td style="padding: 1rem;">${typeText}</td>
                            <td style="padding: 1rem; color: var(--gold); font-weight: 600;">${typeLabel}</td>
                            <td style="padding: 1rem;">${firstOrderText}</td>
                            <td style="padding: 1rem;">${expiryText}</td>
                            <td style="padding: 1rem;">${statusBadge}</td>
                            <td style="padding: 1rem;">
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn-gold" data-action="edit" data-id="${escapeHtml(coupon.id)}" style="padding: 0.5rem 1rem; background: var(--gold); color: var(--bg-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                        <i class="fa fa-edit"></i> ${translate('admin.action.edit')}
                                    </button>
                                    <button class="btn-danger" data-action="delete" data-id="${escapeHtml(coupon.id)}" style="padding: 0.5rem 1rem; background: #ff3b3b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                        <i class="fa fa-trash"></i> ${translate('admin.action.delete')}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    
    // Apply translations to dynamically rendered content
    applyAdminTranslations();
    
    // Add "View All Coupons" button below the table (only if it doesn't exist)
    const existingViewAllBtn = container.parentElement?.querySelector('.coupons-view-all-btn-container');
    if (existingViewAllBtn) {
        existingViewAllBtn.remove();
    }
    if (container.parentElement) {
        const viewAllBtnContainer = document.createElement('div');
        viewAllBtnContainer.className = 'coupons-view-all-btn-container';
        viewAllBtnContainer.style.cssText = 'margin-top: 1.5rem; text-align: center;';
        viewAllBtnContainer.innerHTML = `
            <button class="admin-view-all-btn" data-translate="coupon.view_all" onclick="window.location.href='admin.html#dashboard-coupons-section'" style="padding: 0.75rem 1.5rem; background: var(--gold); color: var(--bg-primary); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                <i class="fa fa-list"></i> <span data-translate="coupon.view_all">View all coupons</span>
            </button>
        `;
        container.parentElement.appendChild(viewAllBtnContainer);
        // Apply translations to the button
        applyAdminTranslations();
    }
    
    // Attach event listeners
    container.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const couponId = e.target.closest('button').getAttribute('data-id');
            const coupon = couponsCache.find(c => c.id === couponId);
            if (coupon) {
                startEditCoupon(coupon);
            }
        });
    });
    
    container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const couponId = e.target.closest('button').getAttribute('data-id');
            const coupon = couponsCache.find(c => c.id === couponId);
            if (coupon) {
                confirmAndDeleteCoupon(coupon);
            }
        });
    });
}

async function handleCouponFormSubmit(event) {
    event.preventDefault();
    const messageEl = document.getElementById('coupon-modal-message');
    const submitBtn = document.getElementById('coupon-form-submit');

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            const originalText = submitBtn.querySelector('span')?.textContent || translate('admin.action.save');
            submitBtn.querySelector('span').textContent = translate('admin.coupons.saving');
        }

        const formData = {
            code: document.getElementById('coupon-code').value.trim(),
            type: document.getElementById('coupon-type').value,
            value: parseFloat(document.getElementById('coupon-value').value),
            firstOrderOnly: document.getElementById('coupon-first-order').checked,
            active: document.getElementById('coupon-active').checked,
            expiry: document.getElementById('coupon-expiry').value || null
        };

        // Validation
        if (!formData.code) {
            throw new Error(translate('admin.coupons.code_required'));
        }
        if (formData.value <= 0) {
            throw new Error(translate('admin.coupons.value_required'));
        }
        if (formData.type === 'percent' && formData.value > 100) {
            throw new Error(translate('admin.coupons.percent_max'));
        }

        // Get a fresh, valid Firebase ID token
        const token = await getAuthToken();
        if (!token) {
            // Check if user is authenticated at all
            const { auth } = await import('../../firebase-frontend-config.js');
            if (!auth.currentUser) {
                throw new Error(translate('admin.coupons.auth_required') || 'You must be logged in to perform this action. Please log in and try again.');
            }
            
            // Check admin role
            const roleKeys = ['userRole', 'jwt_role'];
            const isAdmin = roleKeys.some(key => {
                const role = localStorage.getItem(key);
                return role && role.toLowerCase() === 'admin';
            });
            
            if (!isAdmin) {
                throw new Error(translate('admin.coupons.admin_required') || 'You must be an administrator to perform this action.');
            }
            
            // If we have a user and admin role but no token, it's a token retrieval error
            throw new Error(translate('admin.coupons.token_error') || 'Failed to retrieve authentication token. Please try again.');
        }

        let response;
        if (currentEditCoupon) {
            // Update existing coupon
            response = await fetch(`https://morjan-backend.onrender.com/admin/coupons/${currentEditCoupon.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new coupon
            response = await fetch('https://morjan-backend.onrender.com/admin/coupons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        showInlineMessage('coupon-modal-message', currentEditCoupon ? translate('admin.coupons.updated_success') : translate('admin.coupons.created_success'), 'success');
        
        closeCouponModal();
        await loadCoupons();
        
    } catch (error) {
        console.error('Error saving coupon:', error);
        showInlineMessage('coupon-modal-message', error.message || translate('admin.coupons.save_failed'), 'error');
    } finally {
        if (submitBtn) {
            // Restore button text
            const actionText = currentEditCoupon ? translate('admin.action.update') : translate('admin.action.save');
            if (submitBtn.querySelector('span')) {
                submitBtn.querySelector('span').textContent = actionText;
            }
            
            // Re-validate form to set correct disabled state
            // This ensures button is disabled if form is invalid, enabled if valid
            validateCouponForm();
        }
    }
}

async function confirmAndDeleteCoupon(coupon) {
    const confirmed = confirm(translate('admin.coupons.delete_confirm', { code: coupon.code }));
    if (!confirmed) return;

    try {
        // Get a fresh, valid Firebase ID token
        const token = await getAuthToken();
        if (!token) {
            // Check if user is authenticated at all
            const { auth } = await import('../../firebase-frontend-config.js');
            let errorMessage = translate('admin.coupons.auth_required') || 'Authentication required';
            
            if (!auth.currentUser) {
                errorMessage = translate('admin.coupons.auth_required') || 'You must be logged in to delete coupons. Please log in and try again.';
            } else {
                // Check admin role
                const roleKeys = ['userRole', 'jwt_role'];
                const isAdmin = roleKeys.some(key => {
                    const role = localStorage.getItem(key);
                    return role && role.toLowerCase() === 'admin';
                });
                
                if (!isAdmin) {
                    errorMessage = translate('admin.coupons.admin_required') || 'You must be an administrator to delete coupons.';
                } else {
                    errorMessage = translate('admin.coupons.token_error') || 'Failed to retrieve authentication token. Please try again.';
                }
            }
            
            alert(errorMessage);
            return;
        }

        const response = await fetch(`https://morjan-backend.onrender.com/admin/coupons/${coupon.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || translate('admin.coupons.delete_failed'));
        }

        alert(translate('admin.coupons.deleted_success'));
        await loadCoupons();
        
    } catch (error) {
        console.error('Error deleting coupon:', error);
        alert(error.message || translate('admin.coupons.delete_failed'));
    }
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

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
