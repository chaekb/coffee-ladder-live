// TODO: 본인의 Firebase 프로젝트 설정값으로 대체하세요
const firebaseConfig = {
  apiKey: "AIzaSyC7wrf_nfAoGtXX8dWQxkMzArXU2jDnmoc",
  authDomain: "coffee-ladder-live.firebaseapp.com",
  projectId: "coffee-ladder-live",
  databaseURL: "https://coffee-ladder-live-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Firebase 초기화 및 모듈 내보내기용 전역 변수
import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, get, child, onValue, update, remove } from "https://gstatic.com";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child, onValue, update, remove };
