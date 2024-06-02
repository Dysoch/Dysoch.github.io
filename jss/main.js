
function money() {
    gameData.money += 1;
    gameData.days += 1;

    if (gameData.days >= 365) {
        gameData.days = 1;
        gameData.years += 1;
    }

    updateUI()
}


updateUI()