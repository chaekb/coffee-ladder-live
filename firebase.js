import { initializeApp } 
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {

getDatabase

}
from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



const firebaseConfig = {


apiKey:
"여기에 Firebase 값 입력",


authDomain:
"여기에 입력",


databaseURL:
"여기에 입력",


projectId:
"여기에 입력"

};



const app =
initializeApp(firebaseConfig);



export const db =
getDatabase(app);
