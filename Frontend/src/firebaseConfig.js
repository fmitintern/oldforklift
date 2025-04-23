// firebaseConfig.js ✅ Ensure correct Firebase setup
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-cHlUrBU5xtqJHVxKcNPw4wBVT7f6dsQ",
  authDomain: "forklift-1c6cf.firebaseapp.com",
  projectId: "forklift-1c6cf",
  storageBucket: "forklift-1c6cf.appspot.com",
  messagingSenderId: "105019758908",
  appId: "1:105019758908:web:your_app_id" // ⚠️ Replace with actual App ID from Firebase
};

// ✅ Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
