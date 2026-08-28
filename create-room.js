import { db } from "./firebase.js";
import { doc, setDoc } from "https://gstatic.com";

// 방 생성 핵심 로직 함수
async function createRoom() {
  const nicknameInput = document.getElementById("nickname");
  const nickname = nicknameInput ? nicknameInput.value.trim() : "";
  
  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  // 1000 ~ 9999 사이의 4자리 방 번호 생성
  const room = Math.floor(Math.random() * 9000 + 1000).toString();
  const host = Date.now().toString();

  // 세션 스토리지에 방장 정보 보관
  sessionStorage.setItem("host", host);
  sessionStorage.setItem("nickname", nickname);

  try {
    // Firestore 데이터베이스에 초기 방 문서 생성
    await setDoc(doc(db, "rooms", room), {
      hostId: host,
      status: "waiting",
      participants: [{ id: host, nickname: nickname }],
      ladderData: null
    });
    
    // 호스트 대기방으로 화면 이동
    location.href = `host-room.html?room=${room}&host=${host}`;
  } catch (error) {
    console.error("방 생성 중 오류 발생:", error);
    alert("방 생성에 실패했습니다. Firebase 설정 또는 인터넷 연결을 확인하세요.");
  }
}

// DOM이 완전히 로드된 후 버튼에 클릭 이벤트 바인딩 (type="module" 환경 안전화)
document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createBtn");
  if (createBtn) {
    createBtn.addEventListener("click", createRoom);
  }
});
