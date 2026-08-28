import { db } from "./firebase.js";
import { doc, setDoc } from "https://gstatic.com";

window.createRoom = async function() {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  const room = Math.floor(Math.random() * 9000 + 1000).toString(); // 4자리 방번호
  const host = Date.now().toString();

  sessionStorage.setItem("host", host);
  sessionStorage.setItem("nickname", nickname);

  // Firestore에 방 문서 생성
  try {
    await setDoc(doc(db, "rooms", room), {
      hostId: host,
      status: "waiting",
      participants: [{ id: host, nickname: nickname }],
      ladderData: null
    });
    
    location.href = `host-room.html?room=${room}&host=${host}`;
  } catch (error) {
    console.error("방 생성 실패:", error);
    alert("방 생성에 실패했습니다.");
  }
}
