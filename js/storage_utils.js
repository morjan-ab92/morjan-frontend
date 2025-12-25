/**
 * Firebase Storage utilities for image uploads
 * Brand normalization and image filename generation
 */

import { storage } from '../../firebase-frontend-config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";

/**
 * Normalize brand name for use in filenames.
 * - Convert to lowercase
 * - Remove spaces
 * - Remove special characters (keep only alphanumeric)
 * 
 * @param {string} brand - Brand name string
 * @returns {string} Normalized brand name (e.g., "Hugo Boss" -> "hugoboss")
 */
export function normalizeBrand(brand) {
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
export function generateImageFilename(category, brand, gender) {
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

/**
 * Upload image file to Firebase Storage
 * 
 * @param {File} file - The image file to upload
 * @param {string} folderPath - Storage folder path (e.g., "products/watches")
 * @returns {Promise<string>} Download URL of the uploaded image
 * @throws {Error} If upload fails
 */
export async function uploadImageToStorage(file, folderPath) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, JPEG, and PNG images are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  try {
    // Create storage reference
    const storageRef = ref(storage, `${folderPath}/${file.name}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload product image with brand-based filename
 * 
 * @param {File} file - The image file to upload
 * @param {string} category - Product category
 * @param {string} brand - Brand name (will be normalized)
 * @param {string} gender - Gender (men, women, unisex)
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export async function uploadProductImage(file, category, brand, gender) {
  // Generate filename using brand normalization
  const filename = generateImageFilename(category, brand, gender);
  
  if (!filename) {
    throw new Error('Could not generate filename. Please provide a valid brand name.');
  }

  // Preserve original file extension
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const normalizedFilename = filename.replace('.jpg', `.${fileExtension}`);
  
  // Upload to products/{category}/ folder with generated filename
  const folderPath = `products/${category}`;
  const storageRef = ref(storage, `${folderPath}/${normalizedFilename}`);
  
  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading product image to Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

