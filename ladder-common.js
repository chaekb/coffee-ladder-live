export const LADDER_ROWS = 8;

export function generateLadder(count) {
  const bridges = [];
  const probability = 0.58;

  for (let row = 0; row < LADDER_ROWS; row++) {
    for (let col = 0; col < count - 1; col++) {
      if (Math.random() < probability) {
        bridges.push({ row, from: col, to: col + 1 });
        col++; // 같은 높이에서 연속 가로줄 방지
      }
    }
  }

  // 너무 단순한 사다리를 피함
  const minimum = Math.max(3, count);
  let guard = 0;
  while (bridges.length < minimum && guard < 50) {
    const row = Math.floor(Math.random() * LADDER_ROWS);
    const col = Math.floor(Math.random() * Math.max(1, count - 1));
    const exists = bridges.some(b => b.row === row && (b.from === col || b.to === col));
    const adjacent = bridges.some(b => b.row === row && (b.from === col + 1 || b.to === col + 1));
    if (!exists && !adjacent && count >= 2) bridges.push({ row, from: col, to: col + 1 });
    guard++;
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

function geometry(canvas, users) {
  const w = canvas.width;
  const h = canvas.height;
  const side = Math.max(65, Math.min(95, w * 0.10));
  const top = 78;
  const bottom = h - 72;
  const gap = (w - side * 2) / (users.length - 1);
  const rowGap = (bottom - top) / (LADDER_ROWS + 1);
  return { w, h, side, top, bottom, gap, rowGap };
}

function point(g, index, y) {
  return { x: g.side + index * g.gap, y };
}

export function drawLadder(canvas, bridges, users, highlightStart = null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!users || users.length < 2) {
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#6f4e37";
    ctx.fillText("참가자 2명 이상이 필요합니다.", w / 2, h / 2);
    return;
  }

  const g = geometry(canvas, users);
  ctx.lineCap = "round";
  ctx.textAlign = "center";
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#3b2a22";
  users.forEach((name, i) => ctx.fillText(name, g.side + i * g.gap, 35));

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#c9b3a3";
  for (let i = 0; i < users.length; i++) {
    const x = g.side + i * g.gap;
    ctx.beginPath(); ctx.moveTo(x, g.top); ctx.lineTo(x, g.bottom); ctx.stroke();
  }

  ctx.strokeStyle = "#7a4f37";
  bridges.forEach(b => {
    const y = g.top + (b.row + 1) * g.rowGap;
    const x1 = g.side + b.from * g.gap;
    const x2 = g.side + b.to * g.gap;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  });

  if (highlightStart !== null && highlightStart >= 0) {
    const p = point(g, highlightStart, g.top);
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#3b2a22"; ctx.fill();
  }
}

// 실제 사다리를 따라 움직이는 애니메이션
export function animateLadder(canvas, bridges, users, startIndex, onComplete) {
  if (!canvas || !users || users.length < 2) return;

  const ctx = canvas.getContext("2d");
  const g = geometry(canvas, users);
  let current = { index: startIndex, y: g.top };
  let segment = 0;
  let segmentStart = null;
  let finished = false;
  const speed = 320; // px/sec

  const segments = [];
  for (let row = 0; row < LADDER_ROWS; row++) {
    const y = g.top + (row + 1) * g.rowGap;
    const b = bridges.find(x => x.row === row && (x.from === current.index || x.to === current.index));
    const nextIndex = b ? (b.from === current.index ? b.to : b.from) : current.index;
    segments.push({ from: { index: current.index, y: row === 0 ? g.top : g.top + row * g.rowGap }, to: { index: current.index, y } });
    if (b) segments.push({ from: { index: current.index, y }, to: { index: nextIndex, y }, bridge: true });
    current.index = nextIndex;
  }
  segments.push({ from: { index: current.index, y: g.top + LADDER_ROWS * g.rowGap }, to: { index: current.index, y: g.bottom } });

  function redrawBase() {
    drawLadder(canvas, bridges, users);
  }

  function animate(now) {
    if (segment >= segments.length) {
      redrawBase();
      const finalIndex = current.index;
      const finalPoint = point(g, finalIndex, g.bottom);
      ctx.beginPath(); ctx.arc(finalPoint.x, finalPoint.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = "#3b2a22"; ctx.fill();
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#3b2a22";
      ctx.fillText(`${finalIndex + 1}번 도착!`, finalPoint.x, g.bottom + 45);
      if (!finished) { finished = true; if (onComplete) onComplete(finalIndex); }
      return;
    }

    if (segmentStart === null) segmentStart = now;
    const s = segments[segment];
    const from = point(g, s.from.index, s.from.y);
    const to = point(g, s.to.index, s.to.y);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const duration = Math.max(180, distance / speed * 1000);
    const t = Math.min(1, (now - segmentStart) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    redrawBase();

    // 지금까지 지나온 경로를 굵게 표시
    ctx.strokeStyle = "#3b2a22";
    ctx.lineWidth = 7;
    ctx.beginPath();
    let p = point(g, startIndex, g.top);
    ctx.moveTo(p.x, p.y);
    for (let i = 0; i < segment; i++) {
      const a = point(g, segments[i].from.index, segments[i].from.y);
      const b = point(g, segments[i].to.index, segments[i].to.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    // 이동하는 말
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#3b2a22"; ctx.fill();
    ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();

    if (t >= 1) {
      current.index = s.to.index;
      segment++;
      segmentStart = now;
    }
    requestAnimationFrame(animate);
  }

  redrawBase();
  requestAnimationFrame(animate);
}

export function formatRemaining(expireAt) {
  const r = Math.max(0, expireAt - Date.now());
  const m = Math.floor(r / 60000), s = Math.floor((r % 60000) / 1000);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
