function createRoom(){

    const room =
    Math.floor(
        100000 + Math.random()*900000
    );


    location.href =
    "room.html?room=" + room;

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
