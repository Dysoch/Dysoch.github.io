function saveGameData() {
    localStorage.setItem("gameDataSaveDyIdle", JSON.stringify(gameData))
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
    if (gameData.years <= gameData.lifespan) { 
        gameData.days += 1;
        if (gameData.days > 365) {
            gameData.days = 1;
            gameData.years += 1;
        }
        MoneyUnlocker()
        updateGenerators()  
        updateUI()    
    }
},1000)
var saveloop = setInterval(saveGameData, 10000)