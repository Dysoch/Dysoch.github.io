
function money() {
    gameData.money += 1;

    updateUI()
    Unlocker()
}

function Unlocker() {
    if (gameData.money > 100, gameData.unlocked.lemonade = 0) { gameData.unlocked.lemonade = 1 }
}

function updateGenerators() {
    if (gameData.unlocked.lemonade = 1, gameData.generators.money.lemonade >= 1) { gameData.money += 0.15 * gameData.generators.money.lemonade }
}

function moneyBuyGen(name) {
    if (name = 'lemonade', gameData.unlocked.lemonade = 1, gameData.money > 100) { gameData.generators.money.lemonade += 1, gameData.money -= 100 }
}

setInterval(function(){
    if (gameData.years <= gameData.lifespan) { 
        gameData.days += 1;
        if (gameData.days > 365) {
            gameData.days = 1;
            gameData.years += 1;
        }
        updateGenerators() 
        updateUI()      
    }
},1000);