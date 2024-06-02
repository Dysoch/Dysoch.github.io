
function money() {
    gameData.money += 1;

    updateUI()
    Unlocker()
}

function updateGeneratorsMoney() {
    gameData.moneyPD = 0
    if (gameData.unlocked.lemonade = 1, gameData.generators.money.lemonade >= 1) { gameData.moneyPD = (0.15 * gameData.generators.money.lemonade) }

    gameData.moneyPY = gameData.moneyPD * 365
}

function updateGenerators() {
    if (gameData.unlocked.lemonade = 1, gameData.generators.money.lemonade >= 1) { gameData.money += 0.15 * gameData.generators.money.lemonade }
}

function moneyBuyGen(name) {
    if (name = 'lemonade', gameData.unlocked.lemonade = 1, gameData.money > 100) { gameData.generators.money.lemonade += 1, gameData.money -= 100 }
    
    updateGeneratorsMoney()
    updateUI()
}