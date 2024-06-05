function money() {    
    if (gameData.died == false && gameData.paused == false) { 
        const moneytemp = Math.random()
        gameData.money += (moneytemp * gameData.multiplier.prestige1)
        gameData.stats.money.current += (moneytemp * gameData.multiplier.prestige1)
        //gameData.money += 100; //dev stuff
        updateUI()
    }
}

function updateMultiplierMoney() {
    // Multipliers

    for (let i = 0; i < 15; i++) {
        const element = gameData.generators.money[i];
        element.mult = ((((element.mult1 * element.mult2) * element.mult3) * element.mult4) * element.mult5) * gameData.multiplier.prestige1
        element.money = element.basemoney * element.mult
    }
}

function updateGeneratorsMoney() {
    gameData.moneyPD = 0

    //New money check
    for (let i = 0; i < 15; i++) {
        const money = gameData.generators.money
        if (gameData.unlocked.money[i] == 1 && money[i].amount >= 1) { gameData.moneyPD += (money[i].money * money[i].amount) }
    }
    gameData.moneyPY = gameData.moneyPD * 365
    //gameData.moneyLife = gameData.moneyPY * (gameData.lifespan - gameData.years) //maybe later
}

function updateGenerators() {
    for (let i = 0; i < 15; i++) {
        const money = gameData.generators.money
        if (money[i].amount >= 1) { 
            gameData.money += ((money[i].money * money[i].amount) * money[i].mult), 
            gameData.stats.money.current += ((money[i].money * money[i].amount) * money[i].mult)
        }
    }
}

function moneyBuyGen(index, amount) {
    const money = gameData.generators.money
    if (gameData.died == false && gameData.paused == false) { 
        for (let i = 0; i < (amount); i++) {
            if (gameData.unlocked.money[index] == 1 && gameData.money >= money[index].cost) 
            { 
                money[index].amount += 1, 
                gameData.money -= money[index].cost, 
                money[index].cost = money[index].cost * 1.15, 
                gameData.stats.money.generators[index].current += 1
            }
        }

        updateGeneratorsMoney()
        updateUI()
    }
}

function MoneyUnlocker(){
    for (let i = 0; i < 15; i++) {
        if (gameData.unlocked.money[i] == 1) {
            if (document.getElementById('money_gen_'+i).style.visibility === "hidden") {
                document.getElementById('money_gen_'+i).style.visibility = "visible";
            }
        } else if (gameData.unlocked.money[i] == 0) {
            if (gameData.money > gameData.generators.money[i].unlock) {
                gameData.unlocked.money[i] = 1
            } else {
                if (document.getElementById('money_gen_'+i).style.visibility === "visible") {
                    document.getElementById('money_gen_'+i).style.visibility = "hidden";
                }
            }
        }
    }
}