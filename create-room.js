console.log("[CREATE ROOM] create-room.js 로드 시작");

import { db } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

console.log("[CREATE ROOM] Firebase 모듈 로드 완료");
console.log("[CREATE ROOM] db =", db);

const nicknameInput = document.getElementById("nickname");
const createBtn = document.getElementById("createBtn");
const errorMessage = document.getElementById("errorMessage");

console.log("[CREATE ROOM] DOM 확인", {
  nicknameInput,
  createBtn,
  errorMessage
});

if (!nicknameInput || !createBtn || !errorMessage) {
  console.error("[CREATE ROOM] 필요한 HTML 요소를 찾지 못했습니다.");
} else {
  createBtn.addEventListener("click", createRoom);

  nicknameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      createRoom();
    }
  });

  console.log("[CREATE ROOM] 이벤트 연결 완료");
}

async function createRoom() {
  console.log("[CREATE ROOM] 버튼 클릭");

  const nickname = nicknameInput.value.trim();

  console.log("[CREATE ROOM] 입력 이름 =", nickname);

  if (!nickname) {
    showError("방장 이름을 입력해 주세요.");
    return;
  }

  createBtn.disabled = true;
  createBtn.textContent = "방 생성 중...";

  try {
    console.log("[CREATE ROOM] 사용 가능한 방 번호 검색 시작");

    const room = await findAvailableRoom();

    console.log("[CREATE ROOM] 선택된 방 번호 =", room);

    const hostToken =
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random();

    const createdAt = Date.now();
    const expireAt = createdAt + 300000;

    const hostUserKey =
      "host_" +
      hostToken
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 16);

    const roomData = {
      hostToken,
      status: "waiting",
      createdAt,
      expireAt,
      users: {
        [hostUserKey]: {
          name: nickname,
          role: "host",
          joinedAt: createdAt
        }
      }
    };

    console.log("[CREATE ROOM] Firebase 저장 시작", roomData);

    await set(
      ref(db, "rooms/" + room),
      roomData
    );

    console.log("[CREATE ROOM] Firebase 저장 성공");

    sessionStorage.setItem("hostToken", hostToken);
    sessionStorage.setItem("hostRoom", room);
    sessionStorage.setItem("hostNickname", nickname);

    console.log("[CREATE ROOM] 세션 저장 완료");
    console.log("[CREATE ROOM] host-room.html 이동");

    location.href =
      "./host-room.html?room=" +
      encodeURIComponent(room);

  } catch (err) {
    console.error("[CREATE ROOM] 방 생성 실패", err);

    showError(
      "방 생성에 실패했습니다.\n" +
      (err?.message || "알 수 없는 오류")
    );

    createBtn.disabled = false;
    createBtn.textContent = "방 생성";
  }
}

async function findAvailableRoom() {
  const rooms = [
    "0", "1", "2", "3", "4",
    "5", "6", "7", "8", "9"
  ].sort(() => Math.random() - 0.5);

  console.log("[CREATE ROOM] 검색 순서 =", rooms);

  for (const room of rooms) {
    console.log("[CREATE ROOM] 방 확인 =", room);

    const snapshot = await get(
      ref(db, "rooms/" + room)
    );

    if (!snapshot.exists()) {
      console.log("[CREATE ROOM] 빈 방 발견 =", room);
      return room;
    }

    const data = snapshot.val();

    if (
      data?.expireAt &&
      Date.now() > data.expireAt
    ) {
      console.log(
        "[CREATE ROOM] 만료된 방 발견 =",
        room
      );

      return room;
    }
  }

  throw new Error(
    "사용 가능한 방 번호가 없습니다. 모든 방(0~9)이 사용 중입니다."
  );
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}
