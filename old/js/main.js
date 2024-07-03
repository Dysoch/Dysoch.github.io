function saveGameData() {
    localStorage.setItem("gameDataSaveDyIdle", JSON.stringify(gameData))
}

function arrayLength(arr) {
    let count = 0;
    for (const element of arr) {
      count++;
    }
 
    return count; 
 }

function GameSpeed(number, pause, type) {
    if (gameData.debug === true) {
        gameData.layer[0].time.speed_base = 10
    } else {
        gameData.layer[0].time.speed_base = 1
    }

    if (type === "layer1") {
        gameData.layer[0].time.speed_layer_1 = gameData.layer[0].time.speed_layer_1 * number
    } else if (type === "layer2") {
        gameData.layer[0].time.speed_layer_2 = gameData.layer[0].time.speed_layer_2 * number
    } else if (type === "layer3") {
        gameData.layer[0].time.speed_layer_3 = gameData.layer[0].time.speed_layer_3 * number
    } else if (type === "layer4") {
        gameData.layer[0].time.speed_layer_4 = gameData.layer[0].time.speed_layer_4 * number
    } else if (type === "layer5") {
        gameData.layer[0].time.speed_layer_5 = gameData.layer[0].time.speed_layer_5 * number
    } else if (type === "upgrade") {
        gameData.layer[0].time.speed_upgrade = gameData.layer[0].time.speed_upgrade * number
    }

    gameData.layer[0].time.speed = ((((((gameData.layer[0].time.speed_base * gameData.layer[0].time.speed_upgrade) * gameData.layer[0].time.speed_layer_1) * gameData.layer[0].time.speed_layer_2) * gameData.layer[0].time.speed_layer_3) * gameData.layer[0].time.speed_layer_4) * gameData.layer[0].time.speed_layer_5)

    if (pause === true) {
        if (gameData.settings.paused == false) {
            gameData.settings.paused = true
            gameData.layer[0].time.speed_actual = 0
        } else {
            gameData.settings.paused = false
            gameData.layer[0].time.speed_actual = gameData.layer[0].time.speed
        }
    } else {
        gameData.layer[0].time.speed_actual = gameData.layer[0].time.speed
        gameData.settings.paused = false
    }
}

function Switch_Mode(button) {
    gameData.layer[0].mode = button
}

function UpdateLifespan() {
    gameData.layer[0].time.lifespan = gameData.layer[0].time.lifespan_start + gameData.layer[0].time.lifespan_prestige + gameData.layer[0].time.lifespan_upgrade + gameData.layer[0].time.lifespan_medicine
}

function GameData() {
    if ((gameData.layer[0].time.died == false || gameData.layer[0].time.lifespan_infinite === true) && gameData.settings.paused == false) { 
        if (gameData.layer[0].mode === 'learn') {
            // study
            Learn(gameData.layer[0].time.speed_actual, 'learn')
        } else if (gameData.layer[0].mode === 'medicine') {
            // study medicine
            Learn(gameData.layer[0].time.speed_actual, 'medicine')
        }

        // update money and generators
        updateGeneratorsMoney()
        updateGenerators(gameData.layer[0].time.speed_actual) 
        MoneyUnlocker() 
        UpdateLifespan()

        // autobuyers
        for (let i in gameData.layer[0].money.generators) {
            if ((gameData.layer[0].money.generators[i].auto_unlocked === true && gameData.layer[0].money.generators[i].autobuyer === true) || gameData.debug === true) {
                moneyBuyGen(i, 1)
            }
        }
        if (gameData.layer[0].study.medicine.amount >= 1 && gameData.layer[0].time.lifespan_infinite === false) {
            gameData.layer[0].time.lifespan_medicine = Math.floor(gameData.layer[0].study.medicine.amount / 100)
        }

        // if own medicine company, then increase medicine
        if (gameData.layer[0].money.generators[4].amount >= 1) {
            gameData.layer[0].study.medicine.amount += ((gameData.layer[0].money.generators[4].amount * 0.00001) * (1 + (gameData.layer[0].study.medicine.multi / 1000)))
        }

        // update the time, if lifespan aint infinite
        if (gameData.layer[0].time.lifespan_infinite === true) {
            
        } else {
            gameData.layer[0].time.days += Math.floor(gameData.layer[0].time.speed_actual)
            gameData.layer[0].time.age = ((gameData.layer[0].time.days / 365) + 12)
            gameData.layer[0].time.year = Math.floor((gameData.layer[0].time.days / 365) + gameData.layer[0].time.year_start)
            gameData.layer[0].time.age_lived = Math.floor(gameData.layer[0].time.age)
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
        
        if (gameData.layer[0].time.age >= 60) {
            if (document.getElementById('Table_TopBar_Prestige_1').style.display === "none") {
                document.getElementById('Table_TopBar_Prestige_1').style.display = "table-row"
            }
        } else {
            if (document.getElementById('Table_TopBar_Prestige_1').style.display === "table-row") {
                document.getElementById('Table_TopBar_Prestige_1').style.display = "none"
            }
        }
        
        if (gameData.layer[0].time.year >= 1e4) {
            if (document.getElementById('Table_TopBar_Prestige_2').style.display === "none") {
                document.getElementById('Table_TopBar_Prestige_2').style.display = "table-row"
            }
        } else {
            if (document.getElementById('Table_TopBar_Prestige_2').style.display === "table-row") {
                document.getElementById('Table_TopBar_Prestige_2').style.display = "none"
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

setInterval(function(){
    const pricesWs = new WebSocket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum,tether')
    pricesWs.onmessage = function (msg) {
        const DAT = JSON.parse(msg.data)
        if (DAT["bitcoin"]) {gameData.test.BTC = DAT["bitcoin"]} 
        if (DAT["ethereum"]) {gameData.test.ETH = DAT["ethereum"]} 
        if (DAT["tether"]) {gameData.test.USDT = DAT["tether"]} 
    }
    //console.log(gameData.test.data)
    //console.log(gameData.test.data["bitcoin"])
    //console.log(gameData.test.data["ethereum"])
    //gameData.test.BTC = pricesWs.data.bitcoin
    //gameData.test.ETH = pricesWs.data.ethereum
    
},5000)
//var saveloop = setInterval(saveGameData, 10000)
var gameloop = setInterval(GameData, 100)