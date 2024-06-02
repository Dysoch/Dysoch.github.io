
function money() {
    gameData.money += 1;

    updateUI()
    Unlocker()
}

function updateGeneratorsMoneyPS() {
    gameData.moneyps = 0
    if (gameData.unlocked.lemonade = 1, gameData.generators.money.lemonade >= 1) { gameData.moneyps = (0.15 * gameData.generators.money.lemonade) }
}

function Unlocker() {
    if (gameData.money > 100, gameData.unlocked.lemonade = 0) { gameData.unlocked.lemonade = 1 }
}

function updateGenerators() {
    if (gameData.unlocked.lemonade = 1, gameData.generators.money.lemonade >= 1) { gameData.money += 0.15 * gameData.generators.money.lemonade }
}

function moneyBuyGen(name) {
    if (name = 'lemonade', gameData.unlocked.lemonade = 1, gameData.money > 100) { gameData.generators.money.lemonade += 1, gameData.money -= 100 }
    
    updateGeneratorsMoneyPS()
    updateUI()
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