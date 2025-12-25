/**
 * Migration Script: Add isSale field to all products
 * 
 * This script adds isSale: false to all existing products in Firestore
 * that don't already have this field.
 * 
 * Usage:
 * 1. Open any admin page (e.g., admin.html)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Or import it: import('./migrate_add_isSale.js')
 * 
 * Safety:
 * - Only adds isSale if it doesn't exist
 * - Does NOT overwrite existing isSale values
 * - Processes all categories: watches, perfumes, bags, accessories
 */

import { db } from './firebase-frontend-config.js';
import { collection, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js';

// Collections to process
const collections = ['watches', 'perfumes', 'bags', 'accessories'];

async function addIsSaleToProducts() {
  console.log('🔄 Starting migration: Adding isSale field to all products...\n');
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  for (const collectionName of collections) {
    console.log(`📦 Processing collection: ${collectionName}`);
    
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`   Found ${querySnapshot.size} products`);
      
      let collectionUpdated = 0;
      let collectionSkipped = 0;
      
      for (const docSnapshot of querySnapshot.docs) {
        totalProcessed++;
        const productData = docSnapshot.data();
        const productId = docSnapshot.id;
        
        // Check if isSale field already exists
        if (productData.hasOwnProperty('isSale')) {
          // Field exists, skip (don't overwrite)
          collectionSkipped++;
          totalSkipped++;
          continue;
        }
        
        // Add isSale: false
        try {
          await updateDoc(doc(db, collectionName, productId), {
            isSale: false
          });
          collectionUpdated++;
          totalUpdated++;
          console.log(`   ✅ Updated: ${productId}`);
        } catch (error) {
          console.error(`   ❌ Error updating ${productId}:`, error.message);
        }
      }
      
      console.log(`   ✅ Collection ${collectionName}: ${collectionUpdated} updated, ${collectionSkipped} skipped\n`);
    } catch (error) {
      console.error(`   ❌ Error processing collection ${collectionName}:`, error.message);
    }
  }
  
  console.log('📊 Migration Summary:');
  console.log(`   Total products processed: ${totalProcessed}`);
  console.log(`   Products updated: ${totalUpdated}`);
  console.log(`   Products skipped (already had isSale): ${totalSkipped}`);
  console.log('\n✅ Migration completed!');
  
  return {
    totalProcessed,
    totalUpdated,
    totalSkipped
  };
}

// Export function for use
window.addIsSaleToProducts = addIsSaleToProducts;

// Auto-run if imported directly (optional)
// Uncomment the line below if you want it to run automatically when imported
// addIsSaleToProducts().catch(error => console.error('❌ Migration failed:', error));
