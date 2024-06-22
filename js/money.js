function money() {    
    if (gameData.layer[0].time.died == false && gameData.settings.paused == false) { 
        const moneytemp = Math.random()
        if (gameData.debug === true) {
            gameData.layer[0].money.amount += (1e9 * gameData.layer[1].multiplier) //dev stuff
            gameData.stats.money.current += (1e9 * gameData.layer[1].multiplier)
        } else {
            gameData.layer[0].money.amount += (moneytemp * gameData.layer[1].multiplier)
            gameData.stats.money.current += (moneytemp * gameData.layer[1].multiplier)
        }
        updateUI()
    }
}

function updateMultiplierMoney() {
    // Multipliers

    for (let i = 0; i < 15; i++) {
        const element = gameData.layer[0].money.generators[i]
        element.mult = (((((element.mult1 + (gameData.layer[0].study.learning.multi / 1000)) * element.mult2) * element.mult3) * element.mult4) * element.mult5)
        element.money = (element.basemoney * element.mult)
    }
}

function Toggle_AutoBuyer(i) {
    if (gameData.layer[0].money.generators[i].autobuyer === false) {
        gameData.layer[0].money.generators[i].autobuyer = true
    } else if (gameData.layer[0].money.generators[i].autobuyer === true) {
        gameData.layer[0].money.generators[i].autobuyer = false
    }
}

function updateGeneratorsMoney() {
    gameData.layer[0].money.amount_pd = 0

    //New money check
    for (let i = 0; i < 15; i++) {
        const money = gameData.layer[0].money.generators
        if (gameData.layer[0].money.generators[i].unlocked == true && money[i].amount >= 1) { gameData.layer[0].money.amount_pd += (money[i].money * money[i].amount) }
    }
    gameData.layer[0].money.amount_py = gameData.layer[0].money.amount_pd * 365
    //gameData.moneyLife = gameData.moneyPY * (gameData.lifespan - gameData.years) //maybe later
}

function updateGenerators(speed, year) {
    gameData.layer[0].money.amount += (gameData.layer[0].money.amount_pd) * speed, 
    gameData.stats.money.current += (gameData.layer[0].money.amount_pd) * speed
}

function moneyBuyGen(index, AMT) {
    if (gameData.layer[0].time.died == false && gameData.settings.paused == false) { 
        for (let i = 0; i < (AMT); i++) {
            if (gameData.layer[0].money.generators[index].unlocked === true && gameData.layer[0].money.amount >= gameData.layer[0].money.generators[index].cost) 
            { 
                gameData.layer[0].money.generators[index].amount += 1
                gameData.layer[0].money.amount -= gameData.layer[0].money.generators[index].cost
                gameData.layer[0].money.generators[index].cost = gameData.layer[0].money.generators[index].cost * 1.15
                gameData.stats.money.generators[index].current += 1
            }
        }

        updateGeneratorsMoney()
        updateUI()
    }
}

function MoneyUnlocker(){
    for (let i = 0; i < 15; i++) {
        if (gameData.layer[0].money.generators[i].unlocked == true) {
            if (document.getElementById('money_gen_'+i).style.display === "none") {
                document.getElementById('money_gen_'+i).style.display = "table-row"
            }
        } else if (gameData.layer[0].money.generators[i].unlocked == false) {
            if (gameData.layer[0].money.amount > gameData.layer[0].money.generators[i].unlock && (gameData.layer[0].time.age >= gameData.layer[0].money.generators[i].age || gameData.year >= gameData.layer[0].money.generators[i].year) && gameData.layer[0].study.learning.amount >= gameData.layer[0].money.generators[i].study) {
                gameData.layer[0].money.generators[i].unlocked = true
            } else {
                if (document.getElementById('money_gen_'+i).style.display === "table-row") {
                    document.getElementById('money_gen_'+i).style.display = "none"
                }
            }
        }
    }
}