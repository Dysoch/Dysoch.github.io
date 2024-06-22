function Learn(multi, mode) {
    if (mode === 'learn') { 
        if (gameData.layer[0].time.died == false && gameData.settings.paused == false) { 
            gameData.layer[0].study.learning.amount += ((0.1 * multi) * gameData.layer[0].study.learning.multi)
            updateUI()
        }
    } else if (mode === 'medicine') {
        if (gameData.layer[0].time.died == false && gameData.settings.paused == false) { 
            gameData.layer[0].study.medicine.amount += ((((0.01 + (gameData.layer[0].study.learning.amount / 1e6)) * multi) * gameData.layer[0].study.medicine.multi) * gameData.layer[0].study.learning.multi)
            gameData.layer[0].study.learning.amount += ((0.001 * multi) * gameData.layer[0].study.learning.multi)
            updateUI()
        }
    }   
}