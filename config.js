// Firebase 초기화 및 모듈 내보내기용 전역 변수 (www 고정 주소로 수정 완료)
import { initializeApp } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";


// TODO: 본인의 Firebase 프로젝트 설정값으로 대체하세요
const firebaseConfig = {
  apiKey: "AIzaSyC7wrf_nfAoGtXX8dWQxkMzArXU2jDnmoc",
  authDomain: "coffee-ladder-live.firebaseapp.com",
  databaseURL: "https://coffee-ladder-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "coffee-ladder-live",
  storageBucket: "coffee-ladder-live.firebasestorage.app",
  messagingSenderId: "112031075471",
  appId: "1:112031075471:web:6744be54ad11a3d6ad74fa"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

