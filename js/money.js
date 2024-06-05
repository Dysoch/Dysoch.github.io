function money() {
    gameData.money += Math.random();
    //gameData.money += 100; //dev stuff

    updateUI()
}

function updateMultiplierMoney() {
    // Multipliers

    for (let i = 0; i < 5; i++) {
        const element = gameData.generators.money[i];
        element.mult = ((((element.mult1 * element.mult2) * element.mult3) * element.mult4) * element.mult5) * gameData.multiplier.prestige1
        var temp = element.money
        element.money = temp * element.mult
    }
    console.log(gameData.multiplier.prestige1)
}

function updateGeneratorsMoney() {
    gameData.moneyPD = 0

    //New money check
    const money = gameData.generators.money
    if (gameData.unlocked.money[0] == 1 && money[0].amount >= 1) { gameData.moneyPD += (money[0].money * money[0].amount) }
    if (gameData.unlocked.money[1] == 1 && money[1].amount >= 1) { gameData.moneyPD += (money[1].money * money[1].amount) }
    if (gameData.unlocked.money[2] == 1 && money[2].amount >= 1) { gameData.moneyPD += (money[2].money * money[2].amount) }
    if (gameData.unlocked.money[3] == 1 && money[3].amount >= 1) { gameData.moneyPD += (money[3].money * money[3].amount) }
    if (gameData.unlocked.money[4] == 1 && money[4].amount >= 1) { gameData.moneyPD += (money[4].money * money[4].amount) }

    gameData.moneyPY = gameData.moneyPD * 365
}

function updateGenerators() {
    const money = gameData.generators.money
    if (money[0].amount >= 1) { gameData.money += ((money[0].money * money[0].amount) * money[0].mult) }
    if (money[1].amount >= 1) { gameData.money += ((money[1].money * money[1].amount) * money[1].mult) }
    if (money[2].amount >= 1) { gameData.money += ((money[2].money * money[2].amount) * money[2].mult) }
    if (money[3].amount >= 1) { gameData.money += ((money[3].money * money[3].amount) * money[3].mult) }
    if (money[4].amount >= 1) { gameData.money += ((money[4].money * money[4].amount) * money[4].mult) }
}

function moneyBuyGen(index, amount) {
    const money = gameData.generators.money
    
    for (let i = 0; i < (amount+1); i++) {
        if (gameData.unlocked.money[index] == 1 && gameData.money >= money[index].cost) 
        { 
            money[index].amount += 1, 
            gameData.money -= money[index].cost, 
            money[index].cost = money[index].cost * 1.15 
        }
    }

    updateGeneratorsMoney()
    updateUI()
}

function MoneyUnlocker(){
    if (gameData.money > 15 && gameData.unlocked.money[0] == 0) {gameData.unlocked.money[0] = 1, document.getElementById('money_gen_0').style.visibility = "visible";}
    if (gameData.money > 150 && gameData.unlocked.money[1] == 0) {gameData.unlocked.money[1] = 1, document.getElementById('money_gen_1').style.visibility = "visible";}
    if (gameData.money > 1000 && gameData.unlocked.money[2] == 0) {gameData.unlocked.money[2] = 1, document.getElementById('money_gen_2').style.visibility = "visible";}
    if (gameData.money > 25000 && gameData.unlocked.money[3] == 0) {gameData.unlocked.money[3] = 1, document.getElementById('money_gen_3').style.visibility = "visible";}
    if (gameData.money > 100000 && gameData.unlocked.money[4] == 0) {gameData.unlocked.money[4] = 1, document.getElementById('money_gen_4').style.visibility = "visible";}
}