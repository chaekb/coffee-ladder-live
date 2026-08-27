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
"AIzaSyC7wrf_nfAoGtXX8dWQxkMzArXU2jDnmoc",


authDomain:
"coffee-ladder-live.firebaseapp.com",


databaseURL:
"https://coffee-ladder-live-default-rtdb.asia-southeast1.firebasedatabase.app",


projectId:
"coffee-ladder-live"

};



const app =
initializeApp(firebaseConfig);



export const db =
getDatabase(app);
