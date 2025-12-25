/**
 * Brand normalization utilities for image filename generation.
 */

/**
 * Normalize brand name for use in filenames.
 * - Convert to lowercase
 * - Remove spaces
 * - Remove special characters (keep only alphanumeric)
 * 
 * @param {string} brand - Brand name string
 * @returns {string} Normalized brand name (e.g., "Hugo Boss" -> "hugoboss")
 */
function normalizeBrand(brand) {
  if (!brand) {
    return "";
  }
  
  // Convert to string and lowercase
  let normalized = String(brand).toLowerCase();
  
  // Remove all non-alphanumeric characters (spaces, symbols, etc.)
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  return normalized;
}

/**
 * Generate image filename based on category, brand, and gender.
 * 
 * @param {string} category - Product category (accessories, watches, bags, perfumes)
 * @param {string} brand - Brand name (will be normalized)
 * @param {string} gender - Gender (men, women, unisex)
 * @returns {string|null} Generated filename (e.g., "accessory_925silver_unisex.jpg")
 */
function generateImageFilename(category, brand, gender) {
  const normalizedBrand = normalizeBrand(brand);
  
  if (!normalizedBrand) {
    return null;
  }
  
  // Normalize gender
  let genderLower = String(gender).toLowerCase().trim();
  if (!['men', 'women', 'unisex'].includes(genderLower)) {
    // Default to unisex if invalid
    genderLower = 'unisex';
  }
  
  // Generate filename based on category
  if (category === "accessories") {
    return `accessory_${normalizedBrand}_unisex.jpg`;
  } else if (category === "watches") {
    return `watch_${normalizedBrand}_${genderLower}.jpg`;
  } else if (category === "bags") {
    return `bag_${normalizedBrand}_${genderLower}.jpg`;
  } else if (category === "perfumes") {
    return `perfume_${normalizedBrand}_${genderLower}.jpg`;
  } else {
    return null;
  }
}

export { normalizeBrand, generateImageFilename };

