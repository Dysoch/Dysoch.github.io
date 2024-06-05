function saveGameData() {
    localStorage.setItem("gameDataSaveDyIdle", JSON.stringify(gameData))
}

function GameSpeed(speed, pause) {
    if (pause == true) {
        if (gameData.paused == false) {
            gameData.paused = true
            gameData.speed = 0
        } else {
            gameData.paused = false
            gameData.speed = 100
        }
    } else {
        gameData.speed = speed
        gameData.paused = false
    }
}

function GameData() {
    if (gameData.died == false && gameData.paused == false) { 
        gameData.days += 1;
        if (gameData.days > 365) {
            gameData.days = 1;
            gameData.years += 1;
            if (gameData.years > 12) {
                gameData.yearslived += 1;
            }
        }
        if (gameData.years == gameData.lifespan) {
            gameData.died = true
        }
        MoneyUnlocker()
        updateGenerators()  
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

loadGameData()

setInterval(function(){
    updateUI()
},gameData.speed)
var saveloop = setInterval(saveGameData, 10000)
var gameloop = setInterval(GameData, gameData.speed)