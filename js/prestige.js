



function Prestige_1() {
    if (gameData.died == true || gameData.years > 12) {
        for (let i = 0; i < 15; i++) {
            const element = gameData.generators.money[i];
            element.amount = 0
            element.cost = element.basecost
        }
        gameData.multiplier.prestige1 = gameData.multiplier.prestige1 + (0.1 + (gameData.yearslived / 100))
        gameData.died = false
        gameData.money = 0
        gameData.days = 1
        gameData.years = 12
        gameData.yearslived = 0

        gameData.stats.prestige_1.total += 1
        gameData.stats.years.total += gameData.stats.years.current
        gameData.stats.money.total += gameData.stats.money.current

        gameData.stats.years.current = 0
        gameData.stats.money.current = 0

        for (let i = 0; i < 15; i++) {
            gameData.stats.money.generators[i].total += gameData.stats.money.generators[i].current
            gameData.stats.money.generators[i].current = 0
            gameData.unlocked.money[i] = 0
        }
        
        gameData.money = gameData.stats.prestige_1.total
        updateMultiplierMoney()
        updateGeneratorsMoney()
    }
}
