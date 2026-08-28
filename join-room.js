import { db } from "./firebase.js";
import { doc, updateDoc, arrayUnion, getDoc } from "https://gstatic.com";

window.joinRoom = async function() {
  const room = document.getElementById("room").value.trim();
  const nickname = document.getElementById("nickname").value.trim();

  if (!room || !nickname) {
    alert("방 번호와 닉네임을 모두 입력해주세요.");
    return;
  }

  const roomRef = doc(db, "rooms", room);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("존재하지 않는 방 번호입니다.");
    return;
  }

  const myId = Date.now().toString();
  sessionStorage.setItem("myId", myId);
  sessionStorage.setItem("nickname", nickname);

  // 참가자 목록에 추가
  await updateDoc(roomRef, {
    participants: arrayUnion({ id: myId, nickname: nickname })
  });

  location.href = `guest-room.html?room=${room}&nickname=${nickname}`;
}
