export const LADDER_ROWS = 8;

export function generateLadder(count) {
  if (count < 2) return [];

  const bridges = [];
  const minBridges = Math.max(4, count);
  const maxBridges = Math.max(minBridges + 2, count * 2);

  // 각 행에 무작위 가로줄을 만들되, 같은 행에서 겹치지 않게 생성
  for (let row = 0; row < LADDER_ROWS; row++) {
    for (let col = 0; col < count - 1; col++) {
      if (Math.random() < 0.48 && bridges.length < maxBridges) {
        bridges.push({ row, from: col, to: col + 1 });
        col++; // 같은 행에서 바로 옆 가로줄이 붙지 않도록 함
      }
    }
  }

  // 너무 적게 생성된 경우 추가로 채움
  if (bridges.length < minBridges) {
    const candidates = [];
    for (let row = 0; row < LADDER_ROWS; row++) {
      for (let col = 0; col < count - 1; col++) {
        candidates.push({ row, from: col, to: col + 1 });
      }
    }

    candidates.sort(() => Math.random() - 0.5);
    for (const candidate of candidates) {
      if (bridges.length >= minBridges) break;
      const conflict = bridges.some(
        b => b.row === candidate.row &&
          (b.from === candidate.from || b.from === candidate.to ||
           b.to === candidate.from || b.to === candidate.to)
      );
      if (!conflict) bridges.push(candidate);
    }
  }

  return bridges.sort((a, b) => a.row - b.row || a.from - b.from);
}

export function calculateResults(count, bridges) {
  const results = [];
  for (let start = 0; start < count; start++) {
    let pos = start;
    for (let row = 0; row < LADDER_ROWS; row++) {
      const b = bridges.find(x => x.row === row && (x.from === pos || x.to === pos));
      if (b) pos = b.from === pos ? b.to : b.from;
    }
    results.push(pos);
  }
  return results;
}

// 실제 애니메이션에 사용할 좌표를 반환한다.
export function getPathPoints(start, bridges, count, canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const side = Math.max(60, Math.min(90, w * 0.10));
  const top = 72;
  const bottom = h - 58;
  const gap = (w - side * 2) / (count - 1);
  const rowGap = (bottom - top) / (LADDER_ROWS + 1);

  let pos = start;
  const points = [{ x: side + pos * gap, y: top }];

  for (let row = 0; row < LADDER_ROWS; row++) {
    const y = top + (row + 1) * rowGap;
    points.push({ x: side + pos * gap, y });

    const b = bridges.find(x => x.row === row && (x.from === pos || x.to === pos));
    if (b) {
      pos = b.from === pos ? b.to : b.from;
      points.push({ x: side + pos * gap, y });
    }
  }

  points.push({ x: side + pos * gap, y: bottom });
  return { points, finalIndex: pos };
}

export function getPath(start, bridges) {
  let pos = start;
  const path = [pos];
  for (let row = 0; row < LADDER_ROWS; row++) {
    const b = bridges.find(x => x.row === row && (x.from === pos || x.to === pos));
    if (b) {
      pos = b.from === pos ? b.to : b.from;
      path.push(pos);
    }
  }
  return path;
}

function getLayout(canvas, count) {
  const w = canvas.width;
  const h = canvas.height;
  const side = Math.max(60, Math.min(90, w * 0.10));
  const top = 72;
  const bottom = h - 58;
  const gap = (w - side * 2) / (count - 1);
  const rowGap = (bottom - top) / (LADDER_ROWS + 1);
  return { w, h, side, top, bottom, gap, rowGap };
}

export function drawLadder(canvas, bridges, users, highlightStart = null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { w, h, side, top, bottom, gap, rowGap } = getLayout(canvas, users?.length || 2);
  ctx.clearRect(0, 0, w, h);

  if (!users || users.length < 2) {
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#6f4e37";
    ctx.fillText("참가자 2명 이상이 필요합니다.", w / 2, h / 2);
    return;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#3b2a22";

  users.forEach((name, i) => {
    ctx.fillText(name, side + i * gap, 34);
  });

  // 세로줄
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#c9b3a3";
  for (let i = 0; i < users.length; i++) {
    const x = side + i * gap;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  // 가로줄
  ctx.strokeStyle = "#7a4f37";
  bridges.forEach(b => {
    const y = top + (b.row + 1) * rowGap;
    const x1 = side + b.from * gap;
    const x2 = side + b.to * gap;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  });

  if (highlightStart !== null && highlightStart >= 0) {
    const x = side + highlightStart * gap;
    ctx.beginPath();
    ctx.arc(x, top - 13, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#6f4e37";
    ctx.fill();
  }
}

export function animateLadder(canvas, bridges, users, start, onComplete) {
  if (!canvas || !users || users.length < 2) return;

  const { points, finalIndex } = getPathPoints(start, bridges, users.length, canvas);
  const durationPerSegment = 320;
  const totalDuration = Math.max(1600, (points.length - 1) * durationPerSegment);
  const startedAt = performance.now();

  function drawFrame(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / totalDuration);
    const scaled = progress * (points.length - 1);
    const segment = Math.min(points.length - 2, Math.floor(scaled));
    const local = Math.min(1, scaled - segment);

    drawLadder(canvas, bridges, users, start);

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#b34848";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i <= segment; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    const p1 = points[segment];
    const p2 = points[segment + 1];
    const currentX = p1.x + (p2.x - p1.x) * local;
    const currentY = p1.y + (p2.y - p1.y) * local;
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // 움직이는 말
    ctx.beginPath();
    ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#b34848";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    if (progress < 1) {
      requestAnimationFrame(drawFrame);
    } else {
      // 도착점 강조
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(end.x, end.y + 10, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#b34848";
      ctx.fill();
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(String(finalIndex + 1), end.x, end.y + 16);
      if (onComplete) onComplete(finalIndex);
    }
  }

  requestAnimationFrame(drawFrame);
}

export function formatRemaining(expireAt) {
  const r = Math.max(0, expireAt - Date.now());
  const m = Math.floor(r / 60000);
  const s = Math.floor((r % 60000) / 1000);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
