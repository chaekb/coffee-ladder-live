import { db } from "./firebase.js";
import { ref, get, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { drawLadder, animateLadder, formatRemaining } from "./ladder-common.js";

const params = new URLSearchParams(location.search);
const room = params.get("room");
const nickname = (params.get("nickname") || sessionStorage.getItem("nickname") || "").trim();
const roomNumberEl = document.getElementById("roomNumber");
const joinStatus = document.getElementById("joinStatus");
const usersEl = document.getElementById("users");
const userCountEl = document.getElementById("userCount");
const statusEl = document.getElementById("ladderStatus");
const canvas = document.getElementById("ladderCanvas");
const resultArea = document.getElementById("resultArea");
const timerEl = document.getElementById("roomTimer");
let currentRoomData = null;
let registeredKey = sessionStorage.getItem("userKey:" + room);
let animating = false;

roomNumberEl.textContent = room ?? "-";

if (!room || !nickname) {
  alert("방 번호 또는 이름이 없습니다.");
  location.href = "./join-room.html";
} else {
  init();
}

async function init() {
  const roomRef = ref(db, "rooms/" + room);
  const s = await get(roomRef);
  if (!s.exists()) {
    alert("존재하지 않는 방입니다.");
    location.href = "./join-room.html";
    return;
  }

  const d = s.val();
  if (d.expireAt && Date.now() >= d.expireAt) {
    alert("이미 종료된 방입니다.");
    location.href = "./join-room.html";
    return;
  }

  if (!registeredKey) {
    const dup = Object.values(d.users || {}).some(u => u.name === nickname);
    if (dup) {
      alert("같은 이름이 이미 있습니다. 다른 이름을 사용해 주세요.");
      location.href = "./join-room.html";
      return;
    }
    const userRef = push(ref(db, "rooms/" + room + "/users"));
    registeredKey = userRef.key;
    await set(userRef, { name: nickname, role: "guest", joinedAt: Date.now() });
    sessionStorage.setItem("userKey:" + room, registeredKey);
    sessionStorage.setItem("joinedRoom", room);
    sessionStorage.setItem("nickname", nickname);
  }

  joinStatus.textContent = "✅ " + nickname + "님 참가 완료";

  onValue(roomRef, snap => {
    if (!snap.exists()) {
      alert("방이 종료되었습니다.");
      location.href = "./index.html";
      return;
    }
    currentRoomData = snap.val();
    renderUsers(currentRoomData.users || {});
    renderLadder(currentRoomData.ladder || null);
    if (currentRoomData.expireAt) timerEl.textContent = formatRemaining(currentRoomData.expireAt);
  });

  startTimer();
}

function renderUsers(obj) {
  const users = Object.values(obj).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  userCountEl.textContent = users.length + "명";

  usersEl.innerHTML = users.map((u, i) => {
    const me = u.name === nickname;
    return `<button type="button" class="user-chip ${me ? "me" : ""}" data-index="${i}" data-name="${escapeHtml(u.name)}">
      <span>${i + 1}</span><strong>${escapeHtml(u.name)}</strong>${me ? "<em>내 경로 보기</em>" : ""}
    </button>`;
  }).join("");

  // innerHTML로 다시 그린 뒤 매번 이벤트를 다시 연결
  usersEl.querySelectorAll(".user-chip.me").forEach(btn => {
    btn.addEventListener("click", () => showMyPath());
  });
}

function renderLadder(l) {
  if (!l) {
    statusEl.textContent = "방장이 사다리를 생성할 때까지 기다려 주세요.";
    drawLadder(canvas, [], []);
    resultArea.innerHTML = "";
    return;
  }
  if (!animating) drawLadder(canvas, l.bridges || [], l.users || []);
  statusEl.textContent = "🎲 사다리가 생성되었습니다. 내 이름을 눌러 사다리를 내려가 보세요!";
}

function showMyPath() {
  if (animating) return;
  const l = currentRoomData?.ladder;
  if (!l) {
    alert("아직 사다리가 생성되지 않았습니다.");
    return;
  }

  const idx = l.users.indexOf(nickname);
  if (idx < 0) {
    alert("현재 사다리에서 참가자를 찾을 수 없습니다.");
    return;
  }

  animating = true;
  statusEl.textContent = `🏃 ${nickname}님의 사다리 이동을 시작합니다!`;
  resultArea.innerHTML = `<div class="result-card"><strong>${escapeHtml(nickname)}</strong>님의 말이 사다리를 내려가고 있습니다...</div>`;

  animateLadder(canvas, l.bridges || [], l.users || [], idx, finalIndex => {
    animating = false;
    statusEl.textContent = `🎉 ${nickname}님의 이동 완료!`;
    resultArea.innerHTML = `<div class="result-card result-final"><strong>${escapeHtml(nickname)}</strong><span>🎉 ${finalIndex + 1}번에 도착!</span><small>다시 누르면 처음부터 다시 볼 수 있습니다.</small></div>`;
  });
}

function startTimer() {
  const id = setInterval(async () => {
    if (!currentRoomData?.expireAt) return;
    timerEl.textContent = formatRemaining(currentRoomData.expireAt);
    if (Date.now() >= currentRoomData.expireAt) {
      clearInterval(id);
      try { await remove(ref(db, "rooms/" + room)); } catch (e) { console.error(e); }
      alert("방 생성 후 5분이 지나 자동 종료되었습니다.");
      location.href = "./index.html";
    }
  }, 1000);
}

function escapeHtml(v) {
  return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
