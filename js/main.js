
function money() {
    gameData.money += 1;
    gameData.days += 1;

    if (gameData.days >= 365) {
        gameData.days = 1;
        gameData.years += 1;
    }

    updateUI()
    Unlocker()
}

function Unlocker() {
    if (gameData.money > 100, gameData.unlocked.lemonade = 0) { gameData.unlocked.lemonade = 1 }
}

updateUI()

setInterval(function(){
    date = new Date();
    seconds = date.getSeconds();
    menit = date.getMinutes();
    jam = date.getHours();
    hari = date.getDay();
    tanggal = date.getDate();
    bulan = date.getMonth();
    tahun = date.getFullYear();
    document.getElementById('date').innerHTML = tanggal+" "+((bulan+1)%12)+" "+tahun+"<br>"+jam+" : "+menit+" : "+seconds;
},1000);