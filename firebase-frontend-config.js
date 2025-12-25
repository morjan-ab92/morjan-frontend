import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js"; // 👈 ضروري جداً
import { getStorage } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfnWtoDZmP5EJ6nnDwVIQ3WcGZ3gZpmco",
  authDomain: "ja-jewerlly.firebaseapp.com",
  projectId: "ja-jewerlly",
  storageBucket: "ja-jewerlly.appspot.com", 
  messagingSenderId: "561650456249",
  appId: "1:561650456249:web:9e845a35e4f577e00bad68"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); 
