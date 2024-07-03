
function Prestige_1() {
    if ((gameData.layer[0].time.age > 59) || (gameData.layer[0].time.lifespan_infinite == true && gameData.layer[0].time.age > 59)) {

        gameData.layer[1].prestiged += 1

        if (gameData.layer[1].upgrades.keep_shops === false) {
            for (let i in gameData.layer[0].money.generators) {
                const element = gameData.layer[0].money.generators[i]
                element.amount = 0
                element.cost = element.basecost
            }
        }
        if (gameData.layer[1].upgrades.keep_upgrades === false) {
            for (let i in gameData.layer[0].money.upgrades) {
                const element = gameData.layer[0].money.upgrades[i]
                element.bought = false
                document.getElementById('money_upgrade_'+i).style.display = "table-row"
            }
            gameData.layer[0].time.speed_upgrade = 1
            gameData.layer[0].time.lifespan_upgrade = 0
        }

        gameData.layer[1].points += Math.floor(1 + (Math.cbrt(Math.cbrt(gameData.layer[0].money.amount_earned))))
        gameData.layer[1].multiplier = (1 + (gameData.layer[0].time.year / 1000) + (gameData.layer[1].points / 1000))

        gameData.layer[0].study.learning.multi += (gameData.layer[0].study.learning.amount / 1e6)
        gameData.layer[0].study.learning.amount = Math.cbrt(Math.cbrt(gameData.layer[0].study.learning.amount))
        gameData.layer[0].study.medicine.multi += (gameData.layer[0].study.medicine.amount / 1e6)
        gameData.layer[0].study.medicine.amount = Math.cbrt(Math.cbrt(gameData.layer[0].study.medicine.amount))

        gameData.layer[0].time.lifespan_prestige = Math.floor((gameData.layer[0].time.age_lived / 50))
        gameData.layer[0].time.lifespan_medicine = 0
        UpdateLifespan()

        gameData.layer[0].mode = 'learn' 

        gameData.layer[0].time.died = false
        gameData.layer[0].time.days = 1
        gameData.layer[0].time.age = 12
        gameData.layer[0].time.age_lived = 0
        gameData.layer[0].time.year_start = gameData.layer[0].time.year

        gameData.stats.prestige_1.total += 1
        gameData.stats.years.total += gameData.stats.years.current
        gameData.stats.money.total += gameData.stats.money.current

        gameData.stats.years.current = 0


        for (let i in gameData.layer[0].money.generators) {
            gameData.layer[0].money.generators[i].amount_total += gameData.layer[0].money.generators[i].amount
            gameData.layer[0].money.generators[i].unlocked = false
            if (gameData.layer[1].upgrades.keep_upgrades === false) {
                gameData.layer[0].money.generators[i].mult1 = 1
            }
            gameData.layer[0].money.generators[i].mult2 = (gameData.layer[1].multiplier)
        }
        
        gameData.layer[0].money.amount_total += gameData.layer[0].money.amount_earned
        gameData.layer[0].money.amount_earned = 0
        if (gameData.layer[1].upgrades.keep_money === false) {
            gameData.layer[0].money.amount = (gameData.layer[1].points * 10)
        } else {
            gameData.layer[0].money.amount += (gameData.layer[1].points * 10)
        }
        gameData.layer[0].money.amount_earned += (gameData.layer[1].points * 10)
        gameData.stats.money.current = 0

        gameData.layer[0].time.speed = ((((((gameData.layer[0].time.speed_base * gameData.layer[0].time.speed_upgrade) * gameData.layer[0].time.speed_layer_1) * gameData.layer[0].time.speed_layer_2) * gameData.layer[0].time.speed_layer_3) * gameData.layer[0].time.speed_layer_4) * gameData.layer[0].time.speed_layer_5)
        gameData.layer[0].time.speed_actual = gameData.layer[0].time.speed

        updateMultiplierMoney()
        updateGeneratorsMoney()
    }
}

function Prestige_2() {

    gameData.layer[0].time.year = 0
    gameData.layer[1].prestiged = 0
    gameData.layer[2].prestiged += 1
    
    for (let i in gameData.layer[0].money.generators) {
        gameData.layer[0].money.generators[i].amount_total += gameData.layer[0].money.generators[i].amount
        gameData.layer[0].money.generators[i].unlocked = false
        gameData.layer[0].money.generators[i].mult1 = 1
        gameData.layer[0].money.generators[i].mult2 = 1
        gameData.layer[0].money.generators[i].mult3 = (1 + gameData.layer[2].prestiged)
    }
    updateMultiplierMoney()
    updateGeneratorsMoney()
}


function Prestige_1_Upgrades(name, id, price,  index) {
    if (gameData.layer[1].points >= price) {
        gameData.layer[1].points -= price
        document.getElementById(id).style.display = "none"
        if (name === 'keep_money') {
            gameData.layer[1].upgrades.keep_money = true
        } else if (name === 'autobuyer') {
            gameData.layer[0].money.generators[index].auto_unlocked = true
        } else if (name === 'auto_prestige') {
            gameData.layer[1].upgrades.auto_prestige = true
        } else if (name === 'keep_shops') {
            gameData.layer[1].upgrades.keep_shops = true
        } else if (name === 'keep_upgrades') {
            gameData.layer[1].upgrades.keep_upgrades = true
        } else if (name === 'speed') {
            GameSpeed(index, false, "layer1")
        } else {
            
        } 
    }
}