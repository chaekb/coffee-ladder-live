import {db}

from "./firebase.js";


import {

ref,

set,

push,

onValue,

get

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



const params =
new URLSearchParams(location.search);


const room =
params.get("room");

const host =
params.get("host");


const isHost =
sessionStorage.getItem("host")
=== host;


document
.getElementById("roomNumber")
.innerHTML =
"방 번호 : " + room;

if(!isHost){

document
.getElementById(
"createLadderBtn"
)
.style.display="none";

}


const usersRef =
ref(
db,
"rooms/"
+ room
+ "/users"
);



function join(){


const name =
document
.getElementById("nickname")
.value;



if(!name){

alert("이름 입력");

return;

}



const userRef =
push(usersRef);



set(
userRef,
{

name:name,

time:
Date.now()

}

);


}



window.join=join;




onValue(
usersRef,

(snapshot)=>{


const area =
document
.getElementById("users");


area.innerHTML="";



snapshot.forEach(
(item)=>{


const user =
item.val();



area.innerHTML +=

`

<p>

<button onclick="startGame('${item.key}')">

☕ ${user.name}

</button>

</p>

`;



});


});


async function createLadder(){


const usersSnapshot =
await get(usersRef);


const users=[];


usersSnapshot.forEach(
(item)=>{

users.push(item.val().name);

});


if(users.length < 2){

alert("참가자가 부족합니다.");

return;

}



const ladder =
generateLadder(users.length);



const result =
calculateResult(
users.length,
ladder
);



const ladderRef =
ref(
db,
"rooms/"
+room+
"/ladder"
);



await set(
ladderRef,
{

users:users,

ladder:ladder,

result:result,

created:
Date.now()

}

);



document
.getElementById("ladderStatus")
.innerHTML=
"🎲 사다리 생성 완료";


}



window.createLadder=createLadder;


function generateLadder(count){


const rows=5;


let bridges=[];



for(let r=0;r<rows;r++){


for(let c=0;c<count-1;c++){


if(Math.random()<0.4){


bridges.push({

row:r,

from:c,

to:c+1

});


c++;

}


}

}


return bridges;

}


function calculateResult(
count,
bridges
){


let results=[];


for(let i=0;i<count;i++){


let pos=i;


for(let r=0;r<5;r++){


bridges
.filter(
b=>b.row===r
)
.forEach(
b=>{


if(b.from===pos)
pos=b.to;


else if(b.to===pos)
pos=b.from;


});


}


results.push(pos);

}


return results;

}


const ladderRef =
ref(
db,
"rooms/"
+room+
"/ladder"
);



onValue(
ladderRef,

(snapshot)=>{


const data =
snapshot.val();


  console.log(
"ladder data:",
data
);


if(data){

  window.currentLadder = data.ladder;
window.currentUsers = data.users;

drawLadder(
data.ladder,
Object.keys(data.users).length
);


}

});


function drawLadder(
bridges,
count
){


const canvas =
document.getElementById(
"ladderCanvas"
);

  if(!canvas){

console.log("Canvas 없음");

return;

}



const ctx =
canvas.getContext("2d");



ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);



const startX=50;

const gap=100;


const top=50;

const bottom=450;



// 세로줄

for(
let i=0;
i<count;
i++
){

let x=
startX+i*gap;


ctx.beginPath();

ctx.moveTo(
x,
top
);

ctx.lineTo(
x,
bottom
);

ctx.stroke();

}



// 가로줄

bridges.forEach(
b=>{


let y =
top+
(b.row+1)*70;


let x1 =
startX+
b.from*gap;


let x2 =
startX+
b.to*gap;



ctx.beginPath();

ctx.moveTo(
x1,
y
);

ctx.lineTo(
x2,
y
);

ctx.stroke();



});


}


function startGame(userKey){


const userIndex =
Object.keys(window.currentUsers)
.indexOf(userKey);



animateLadder(
userIndex
);


}


window.startGame=startGame;


function getPath(
start,
bridges
){


let pos=start;

let path=[];


for(let r=0;r<5;r++){


path.push(pos);



bridges
.filter(
b=>b.row===r
)
.forEach(
b=>{


if(b.from===pos){

pos=b.to;

}
else if(b.to===pos){

pos=b.from;

}


});


}


path.push(pos);


return path;

}

function animateLadder(start){


const path =
getPath(
start,
window.currentLadder
);


console.log(
"path",
path
);


document
.getElementById("resultArea")
.innerHTML=

`
이동 경로:
${path.join(" → ")}
`;

}
