import {db} from "./firebase.js";

const params=new URLSearchParams(location.search);
const room=params.get("room");

document.getElementById("roomNumber").innerHTML="방 번호 : "+room;

console.log("host room", room);
