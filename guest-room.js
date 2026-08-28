import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://gstatic.com";

const params = new URLSearchParams(location.search);
const room = params.get("room");

document.getElementById("roomNumber").innerHTML = "방 번호 : " + room;

const canvas = document.getElementById("ladderCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const statusMessage = document.getElementById("statusMessage");

onSnapshot(doc(db, "rooms", room), (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  
  if (data.status === "waiting") {
    if (statusMessage) statusMessage.innerText = "☕ 방장님이 사다리를 생성 중입니다. 잠시만 기다려주세요...";
  } else if (data.status === "generated" && data.ladderData) {
    if (statusMessage) statusMessage.innerText = "👀 결과가 나왔습니다! 커피를 살 사람은 누구일까요?";
    drawLadder(data.ladderData, data.participants);
  }
});

function drawLadder(ladderData, participants) {
  if (!ctx) return;
  const { lines, results, numCols, numRows } = ladderData;
  
  const width = canvas.width;
  const height = canvas.height;
  const colWidth = width / (numCols + 1);
  const rowHeight = (height - 120) / (numRows + 1);

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#6f4e37";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";

  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, height - 60);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.fillText(participants[i]?.nickname || "", x, 40);
  }

  for (let r = 0; r < numRows; r++) {
    const y = 60 + rowHeight * (r + 1);
    for (let c = 0; c < numCols - 1; c++) {
      if (lines[r][c] === 1) {
        ctx.beginPath();
        ctx.moveTo(colWidth * (c + 1), y);
        ctx.lineTo(colWidth * (c + 2), y);
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < numCols; i++) {
    const x = colWidth * (i + 1);
    ctx.fillStyle = results[i].includes("당첨") ? "#d9534f" : "#5cb85c";
    ctx.fillText(results[i], x, height - 30);
  }
}
