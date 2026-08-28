function joinRoom(){

const room =
document.getElementById("room").value;

const nickname =
document.getElementById("nickname").value;

location.href =
"guest-room.html?room="+room+
"&nickname="+nickname;

}
