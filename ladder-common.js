export const LADDER_ROWS=7;
export function generateLadder(count) {
  const bridges = [];

  // 참가자 수에 따라 최소 가로줄 수 설정
  const minBridges = Math.max(3, count);
  const maxBridges = Math.max(minBridges + 2, count * 2);

  let attempts = 0;

  while (
    bridges.length < minBridges &&
    attempts < 100
  ) {
    bridges.length = 0;

    for (let row = 0; row < LADDER_ROWS; row++) {
      for (let col = 0; col < count - 1; col++) {

        // 약 55% 확률로 가로줄 생성
        if (Math.random() < 0.55) {
          bridges.push({
            row,
            from: col,
            to: col + 1
          });

          // 같은 행에서 연속 가로줄 방지
          col++;
        }

        if (bridges.length >= maxBridges)
          break;
      }

      if (bridges.length >= maxBridges)
        break;
    }

    attempts++;
  }

  // 혹시 그래도 부족하면 강제로 추가
  if (bridges.length === 0 && count >= 2) {
    bridges.push({
      row: 2,
      from: 0,
      to: 1
    });
  }

  return bridges;
}
export function calculateResults(count,bridges){const results=[];for(let start=0;start<count;start++){let pos=start;for(let row=0;row<LADDER_ROWS;row++){const b=bridges.find(x=>x.row===row&&(x.from===pos||x.to===pos));if(b)pos=b.from===pos?b.to:b.from;}results.push(pos);}return results;}
export function getPath(start, bridges) {
  let pos = start;
  const path = [pos];

  for (let row = 0; row < LADDER_ROWS; row++) {
    const b = bridges.find(
      x => x.row === row && (x.from === pos || x.to === pos)
    );

    if (b) {
      pos = b.from === pos ? b.to : b.from;

      // 실제 좌우 이동이 발생했을 때만 기록
      path.push(pos);
    }
  }

  return path;
}
export function drawLadder(canvas,bridges,users,highlightStart=null){if(!canvas)return;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(!users||users.length<2){ctx.font="22px sans-serif";ctx.textAlign="center";ctx.fillStyle="#6f4e37";ctx.fillText("참가자 2명 이상이 필요합니다.",w/2,h/2);return;}const side=70,top=80,bottom=h-70,gap=(w-side*2)/(users.length-1),rowGap=(bottom-top)/(LADDER_ROWS+1);ctx.lineWidth=4;ctx.lineCap="round";ctx.font="18px sans-serif";ctx.textAlign="center";ctx.fillStyle="#3b2a22";users.forEach((name,i)=>ctx.fillText(name,side+i*gap,35));ctx.strokeStyle="#c9b3a3";for(let i=0;i<users.length;i++){const x=side+i*gap;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();}ctx.strokeStyle="#7a4f37";bridges.forEach(b=>{const y=top+(b.row+1)*rowGap,x1=side+b.from*gap,x2=side+b.to*gap;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();});if(highlightStart!==null&&highlightStart>=0){const x=side+highlightStart*gap;ctx.beginPath();ctx.arc(x,top-12,9,0,Math.PI*2);ctx.fillStyle="#3b2a22";ctx.fill();}}
export function formatRemaining(expireAt){const r=Math.max(0,expireAt-Date.now());const m=Math.floor(r/60000),s=Math.floor((r%60000)/1000);return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
