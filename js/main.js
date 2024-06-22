function saveGameData() {
    localStorage.setItem("gameDataSaveDyIdle", JSON.stringify(gameData))
}

function GameSpeed(number, pause) {
    if (pause === true) {
        if (gameData.settings.paused == false) {
            gameData.settings.paused = true
            gameData.speed = 0
        } else {
            gameData.settings.paused = false
            gameData.speed = 1
        }
    } else {
        gameData.speed = gameData.speed * number
        gameData.settings.paused = false
    }
}

function Switch_Mode(button) {
    gameData.layer[0].mode = button
}

function GameData() {
    if ((gameData.layer[0].time.died == false || gameData.layer[0].time.lifespan_infinite === true) && gameData.settings.paused == false) { 
        if (gameData.layer[0].mode === 'learn') {
            // study
            Learn(gameData.speed, 'learn')
        } else if (gameData.layer[0].mode === 'medicine') {
            // study medicine
            Learn(gameData.speed, 'medicine')
        }

        // update money and generators
        updateGeneratorsMoney()
        updateGenerators(gameData.speed) 
        MoneyUnlocker() 

        // autobuyers
        for (let i = 0; i < 15; i++) {
            if (gameData.layer[0].money.generators[i].auto_unlocked === true && gameData.layer[0].money.generators[i].autobuyer === true) {
                moneyBuyGen(i, 1)
            }
        }
        if (gameData.layer[0].study.medicine.amount >= 1 && gameData.layer[0].time.lifespan_infinite === false) {
            gameData.layer[0].time.lifespan = Math.floor(gameData.layer[0].time.lifespan_prestige + (gameData.layer[0].study.medicine.amount / 100))
        }

        // if own medicine company, then increase medicine
        if (gameData.layer[0].money.generators[4].amount >= 1) {
            gameData.layer[0].study.medicine.amount += ((gameData.layer[0].money.generators[4].amount * 0.00001) * (1 + (gameData.layer[0].study.medicine.multi / 1000)))
        }

        // update the time, if lifespan aint infinite
        if (gameData.layer[0].time.lifespan_infinite === true) {
            
        } else {
            gameData.layer[0].time.days += Math.floor(gameData.speed)
            gameData.layer[0].time.age = ((gameData.layer[0].time.days / 365) + 12)
            gameData.layer[0].time.year = Math.floor((gameData.layer[0].time.days / 365) + gameData.layer[0].time.year_start)
            gameData.stats.years.current = Math.floor(gameData.layer[0].time.days / 365)

            // Checking max age and die if you need to
            if (gameData.layer[0].time.age >= gameData.layer[0].time.lifespan) {
                gameData.layer[0].time.died = true
            }
        
            // auto prestige if dead and unlocked
            if (gameData.layer[0].time.died === true && gameData.layer[1].upgrades.auto_prestige === true) {
                Prestige_1()
            }
        }
        
        if (gameData.layer[0].time.age > 60) {
            gameData.layer[0].time.age_lived = Math.floor(gameData.layer[0].time.age - 60)
        } 
        
        if (gameData.layer[0].time.age > 60) {
            if (document.getElementById('prestige_1_button').style.display === "none") {
                document.getElementById('prestige_1_button').style.display = "inline"
            }
        } else {
            if (document.getElementById('prestige_1_button').style.display === "inline") {
                document.getElementById('prestige_1_button').style.display = "none"
            }
        }
    }
}

function loadGameData() {
    try {
        const gameDataSave = JSON.parse(localStorage.getItem("gameDataSaveDyIdle"))
        if (gameDataSave !== null) {
            gameData = gameDataSave
        }
    } catch (error) {
        console.error(error)
        console.log(localStorage.getItem("gameDataSaveDyIdle"))
        alert("It looks like you tried to load a corrupted save... If this issue persists, feel free to contact the developers!")
    }
    if (gameData.version !== version) (localStorage.clear()) 
}

function resetGameData() {
    localStorage.clear()
    location.reload()
}

//loadGameData()

setInterval(function(){
    updateUI()
},100)
//var saveloop = setInterval(saveGameData, 10000)
var gameloop = setInterval(GameData, 100)