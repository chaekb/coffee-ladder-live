function createRoom(){

const room = Math.floor(Math.random()*90+10);

const host = Date.now().toString();

sessionStorage.setItem("host", host);
sessionStorage.setItem("nickname",
document.getElementById("nickname").value);

location.href =
"host-room.html?room="+room+"&host="+host;

}
