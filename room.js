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



document
.getElementById("roomNumber")
.innerHTML =
"방 번호 : " + room;



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
☕ ${user.name}
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
