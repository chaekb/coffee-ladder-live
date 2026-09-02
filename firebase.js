import { initializeApp } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyC7wrf_nfAoGtXX8dWQxkMzArXU2jDnmoc",
  authDomain: "coffee-ladder-live.firebaseapp.com",
  projectId: "coffee-ladder-live",
  databaseURL: "https://coffee-ladder-live-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
