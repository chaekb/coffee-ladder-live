function createRoom(){

    const room =
Math.floor(
Math.random()*10
).toString();


    const host =
Date.now().toString();


sessionStorage.setItem(
"host",
host
);


location.href =
"room.html?room="
+room
+"&host="
+host;


}



function joinRoom(){

    const room =
    prompt("방 번호 입력");


    if(room){

        location.href =
        "room.html?room=" + room;

    }

}


window.createRoom = createRoom;
window.joinRoom = joinRoom;
