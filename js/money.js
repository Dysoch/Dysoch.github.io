function money() {
    gameData.money += Math.random();
    //gameData.money += 100; //dev stuff

    updateUI()
}

function updateMultiplierMoney() {
    // Multipliers

    for (let index = 0; index < gameData.generators.money.length; index++) {
        const element = gameData.generators.money[index];
        element.mult = element.mult1 * element.mult2 * element.mult3 * element.mult4 * element.mult5
    }
    
}

function updateGeneratorsMoney() {
    gameData.moneyPD = 0

    // Multipliers
    updateMultiplierMoney()

    //New money check
    const money = gameData.generators.money
    if (gameData.unlocked.money[0] = 1, money[0].amount >= 1) { gameData.moneyPD += ((money[0].money * money[0].amount) * money[0].mult) }

    gameData.moneyPY = gameData.moneyPD * 365
}

function updateGenerators() {
    const money = gameData.generators.money
    if (money[0].amount >= 1) { gameData.money += ((money[0].money * money[0].amount) * money[0].mult) }
}

function moneyBuyGen(index, amount) {
    const money = gameData.generators.money
    if (gameData.unlocked.money[index] = 1, gameData.money >= (money[0].cost*amount)) { money[0].amount += amount, gameData.money -= (money[0].cost*amount) }
    
    updateGeneratorsMoney()
    updateUI()
}

function MoneyUnlocker(){
    if (gameData.money > 15, gameData.unlocked.money[0] = 0) {gameData.unlocked.money[0] = 1}
    if (gameData.money > 150, gameData.unlocked.money[1] = 0) {gameData.unlocked.money[1] = 1}
    if (gameData.money > 1000, gameData.unlocked.money[2] = 0) {gameData.unlocked.money[2] = 1}
    if (gameData.money > 25000, gameData.unlocked.money[3] = 0) {gameData.unlocked.money[3] = 1}
    if (gameData.money > 100000, gameData.unlocked.money[4] = 0) {gameData.unlocked.money[4] = 1}
}