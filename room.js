
const params =
new URLSearchParams(location.search);


const room =
params.get("room");


document.getElementById("roomNumber")
.innerHTML =
"방 번호 : " + room;



let users=[];



function join(){


const name =
document.getElementById("nickname").value;



if(!name){

alert("이름 입력");

return;

}



users.push(name);


render();


}



function render(){


const area =
document.getElementById("users");


area.innerHTML="";


users.forEach(
u=>{

area.innerHTML +=
`
<p>
☕ ${u}
</p>
`

}

);


}
