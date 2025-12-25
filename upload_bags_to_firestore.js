// upload_bags_to_firestore.js (Node.js version)

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";
import { generateImageFilename } from "./brand_utils.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfnWtoDZmP5EJ6nnDwVIQ3WcGZ3gZpmco",
  authDomain: "ja-jewerlly.firebaseapp.com",
  projectId: "ja-jewerlly",
  storageBucket: "ja-jewerlly.appspot.com",
  messagingSenderId: "561650456249",
  appId: "1:561650456249:web:9e845a35e4f577e00bad68"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Load JSON files from local folder
function loadJSON(filename) {
  const raw = fs.readFileSync(filename);
  return JSON.parse(raw);
}

// ✅ Upload function
async function uploadBags() {
  const menBags = loadJSON("./men_bags.json");
  const womenBags = loadJSON("./women_bags.json");
  const travelBags = loadJSON("./travel_bags.json");

  const allBags = [...menBags, ...womenBags, ...travelBags];
  console.log(`🚀 Total bags: ${allBags.length}`);

  let success = 0;

  for (const bag of allBags) {
    try {
      // Generate image filename based on brand and gender
      const brand = bag.brand || "";
      const gender = bag.type || bag.gender || "unisex"; // Bags use "type" field for gender
      const imageFilename = generateImageFilename("bags", brand, gender);
      
      const bagData = {
        ...bag,
        category: "bags",
        currency: "₪",
        createdAt: new Date().toISOString()
      };
      
      // Add image field
      if (imageFilename) {
        bagData.image = `assets/images/bags/${imageFilename}`;
      } else {
        // Fallback: use image_url if available, otherwise placeholder
        if (bag.image_url) {
          bagData.image = bag.image_url;
        } else {
          bagData.image = "assets/images/products/placeholder.jpg";
        }
      }
      
      await addDoc(collection(db, "bags"), bagData);
      success++;
      console.log(`✅ Uploaded ${bag.id}`);
    } catch (err) {
      console.error(`❌ Failed ${bag.id}:`, err.message);
    }
  }

  console.log(`\n🎉 Done! Uploaded ${success} bags to Firestore collection 'bags'`);
}

// ✅ Run
uploadBags();
