import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase_config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  { name: "Dior Miss Dior", category: "perfumes", gender: "women", type: "original", price: 120, image_url: "" },
  { name: "Boss Bottled", category: "perfumes", gender: "men", type: "original", price: 100, image_url: "" },
  { name: "Gucci Bag", category: "bags", gender: "women", type: "original", price: 800, image_url: "" },
  { name: "Louis Vuitton Bag", category: "bags", gender: "women", type: "original", price: 1200, image_url: "" },
  { name: "Chanel Watch", category: "watches", gender: "women", type: "original", price: 1500, image_url: "" },
  { name: "GANT Watch", category: "watches", gender: "men", type: "original", price: 900, image_url: "" },
  { name: "Silver Necklace", category: "accessories", gender: "women", type: "original", price: 300, image_url: "" },
  { name: "Gold Bracelet", category: "accessories", gender: "women", type: "original", price: 350, image_url: "" }
];

async function addProducts() {
  try {
    console.log("🚀 Starting to add products to Firestore...");
    
    for (const product of products) {
      await addDoc(collection(db, "products"), product);
      console.log(`✅ Added: ${product.name}`);
    }
    
    console.log("🎉 All products added successfully!");
    alert("✅ All products added successfully to Firestore!");
  } catch (error) {
    console.error("❌ Error adding products:", error);
    alert("❌ Error adding products: " + error.message);
  }
}

addProducts();
