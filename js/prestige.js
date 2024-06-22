
function Prestige_1() {
    if ((gameData.layer[0].time.age > 59) || (gameData.layer[0].time.lifespan_infinite == true && gameData.layer[0].time.age > 59)) {

        if (gameData.layer[1].upgrades.keep_shops === false) {
            for (let i = 0; i < 15; i++) {
                const element = gameData.layer[0].money.generators[i]
                element.amount = 0
                element.cost = element.basecost
            }
        }

        gameData.layer[1].multiplier += (0.1 + (gameData.layer[0].time.age_lived / 100))
        gameData.layer[1].points += Math.floor(1 + (Math.cbrt(Math.cbrt(gameData.stats.money.current))))

        gameData.layer[0].study.learning.multi += (gameData.layer[0].study.learning.amount / 1e4)
        gameData.layer[0].study.learning.amount = 0
        gameData.layer[0].study.medicine.multi += (gameData.layer[0].study.medicine.amount / 1e4)
        gameData.layer[0].study.medicine.amount = 0

        gameData.layer[0].mode = 'learn' 

        gameData.layer[0].time.died = false
        gameData.layer[0].time.days = 1
        gameData.layer[0].time.age = 12
        gameData.layer[0].time.age_lived = 0
        gameData.layer[0].time.year = gameData.layer[0].time.year_start

        gameData.stats.prestige_1.total += 1
        gameData.stats.years.total += gameData.stats.years.current
        gameData.stats.money.total += gameData.stats.money.current

        gameData.stats.years.current = 0

        gameData.layer[0].time.lifespan = Math.floor(gameData.layer[0].time.lifespan_start + ((gameData.layer[1].points / 10) + (gameData.stats.money.current / 1e9)))
        gameData.layer[0].time.lifespan_prestige = Math.floor(gameData.layer[0].time.lifespan_start + ((gameData.layer[1].points / 10) + (gameData.stats.money.current / 1e9)))

        for (let i = 0; i < 15; i++) {
            gameData.stats.money.generators[i].total += gameData.stats.money.generators[i].current
            gameData.stats.money.generators[i].current = 0
            gameData.layer[0].money.generators[i].unlocked = false
            if (gameData.layer[1].upgrades.keep_upgrades === false) {
                gameData.layer[0].money.generators[i].mult1 = 1
            }
            gameData.layer[0].money.generators[i].mult2 = gameData.layer[1].multiplier
        }
        
        if (gameData.layer[1].upgrades.keep_money === false) {
            gameData.layer[0].money.amount = (gameData.layer[1].points * 10)
        } else {
            gameData.layer[0].money.amount += (gameData.layer[1].points * 10)
        }
        gameData.stats.money.current = 0
        updateMultiplierMoney()
        updateGeneratorsMoney()
    }
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
            GameSpeed(index, false)
        } else {
            
        } 
    }
}