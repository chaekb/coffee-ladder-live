import { db } from "./firebase.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://gstatic.com";

window.joinRoom = async function() {
  const room = document.getElementById("room").value.trim();
  const nickname = document.getElementById("nickname").value.trim();

  if (!room || !nickname) {
    alert("방 번호와 닉네임을 모두 정확히 입력해주세요.");
    return;
  }

  const roomRef = doc(db, "rooms", room);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("존재하지 않거나 만료된 방 번호입니다.");
    return;
  }

  const myId = Date.now().toString();
  sessionStorage.setItem("myId", myId);
  sessionStorage.setItem("nickname", nickname);

  try {
    // 원자적 배열 추가(arrayUnion)를 활용해 동시 접속 시 덮어쓰기 방지
    await updateDoc(roomRef, {
      participants: arrayUnion({ id: myId, nickname: nickname })
    });

    location.href = `guest-room.html?room=${room}&nickname=${nickname}`;
  } catch (error) {
    console.error("방 참가 중 오류 발생:", error);
    alert("방 참가에 실패했습니다.");
  }
}
