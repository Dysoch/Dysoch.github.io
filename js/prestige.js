



function Prestige_1() {
    if (gameData.died == true || gameData.years > 12) {
        for (let i = 0; i < 5; i++) {
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
        
        updateMultiplierMoney()
        updateGeneratorsMoney()
    }
}
