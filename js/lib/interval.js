
// Savegame function
function saveGameData(NAME) {
    localStorage.setItem(NAME, JSON.stringify(gameData))
    //console.log("trying to save data")
}

// Load gameData
function loadGameData(NAME) {
    //console.log("trying to load data")
    try {
        const gameDataSave = JSON.parse(localStorage.getItem(NAME))
        if (gameDataSave !== null) {
            gameData = gameDataSave
        }
    } catch (error) {
        console.error(error)
        console.log(localStorage.getItem(NAME))
        alert("It looks like you tried to load a corrupted save... If this issue persists, feel free to contact the developers!")
    }
}

// Reset gameData if needed
function resetGameData() {
    localStorage.clear()
    location.reload()
}

// Load gameData once when the page loads
loadGameData("gameDataSaveDyIdle2")

setInterval(function(){
    updateUI()
},100)

// Get Crypto Price through API
setInterval(function(){
    const pricesWs = new WebSocket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum,tether,binance,solana,xrp,dogecoin,polkadot,cardano,litecoin')
    pricesWs.onmessage = function (msg) {
        const DAT = JSON.parse(msg.data)
        if (DAT["bitcoin"]) {gameData.crypto["bitcoin"] = DAT["bitcoin"]} 
        if (DAT["ethereum"]) {gameData.crypto["ethereum"] = DAT["ethereum"]} 
        if (DAT["tether"]) {gameData.crypto["tether"] = DAT["tether"]} 
        if (DAT["binance"]) {gameData.crypto["binance"] = DAT["binance"]} 
        if (DAT["solana"]) {gameData.crypto["solana"] = DAT["solana"]} 
        if (DAT["xrp"]) {gameData.crypto["xrp"] = DAT["xrp"]} 
        if (DAT["dogecoin"]) {gameData.crypto["dogecoin"] = DAT["dogecoin"]} 
        if (DAT["cardano"]) {gameData.crypto["cardano"] = DAT["cardano"]} 
        if (DAT["polkadot"]) {gameData.crypto["polkadot"] = DAT["polkadot"]} 
        if (DAT["litecoin"]) {gameData.crypto["litecoin"] = DAT["litecoin"]} 
    }
    saveGameData("gameDataSaveDyIdle2")
},10000)

// Save the gameData
setInterval(function(){
},10000)