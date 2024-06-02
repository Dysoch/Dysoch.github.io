
function money() {
    gameData.money += 1;

    updateUI()
    Unlocker()
}

function Unlocker() {
    if (gameData.money > 100, gameData.unlocked.lemonade = 0) { gameData.unlocked.lemonade = 1 }
}

updateUI()

setInterval(function(){
    if (gameData.years <= gameData.lifespan) { 
        gameData.days += 1;
        if (gameData.days > 365) {
            gameData.days = 1;
            gameData.years += 1;
        }        
    }
},1000);