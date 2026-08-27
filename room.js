import {db}

from "./firebase.js";


import {

ref,

set,

push,

onValue

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
