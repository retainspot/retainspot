// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAs3Z15yr8_aOXLHt1lAkS_8p3hHUHMOnU",
  authDomain: "retainspot.firebaseapp.com",
  projectId: "retainspot",
  storageBucket: "retainspot.firebasestorage.app",
  messagingSenderId: "111803469059",
  appId: "1:111803469059:web:eccd49ea5d9c9abfde2d36",
  measurementId: "G-2RRWCGHBC1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const analytics = getAnalytics(app);
export { app, auth, analytics };