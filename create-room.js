import { db } from "./firebase.js";
import { doc, setDoc } from "https://gstatic.com";

window.createRoom = async function() {
  const nicknameInput = document.getElementById("nickname");
  const nickname = nicknameInput ? nicknameInput.value.trim() : "";
  
  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  // 1000 ~ 9999 사이의 4자리 방 번호 생성
  const room = Math.floor(Math.random() * 9000 + 1000).toString();
  const host = Date.now().toString();

  // 데이터 연속 이동을 위한 데이터 저장
  sessionStorage.setItem("host", host);
  sessionStorage.setItem("nickname", nickname);

  try {
    // Firestore에 실시간 동기화용 기본 문서 바인딩
    await setDoc(doc(db, "rooms", room), {
      hostId: host,
      status: "waiting", // waiting -> generated
      participants: [{ id: host, nickname: nickname }],
      ladderData: null
    });
    
    location.href = `host-room.html?room=${room}&host=${host}`;
  } catch (error) {
    console.error("방 생성 중 오류 발생:", error);
    alert("방 생성에 실패했습니다. Firebase 설정을 확인하세요.");
  }
}
