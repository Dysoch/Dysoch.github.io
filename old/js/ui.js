function NumberFormat(number, type, bool, bool2) {
    if (bool === true) {
        if (number < 1000 && bool2 === true) {
            return number.toFixed(2)
        } else if ((number < 1000000000000000)) {
            return new Intl.NumberFormat("en-GB", {
                notation: "compact",
                compactDisplay: "short",
              }).format(number)
        } else {
            return new Intl.NumberFormat("en-US", {
                notation: "scientific",
              }).format(number)
        }
    } else {
        if (type === "million") {
            return new Intl.NumberFormat("en-GB", {
                notation: "compact",
                compactDisplay: "short",
              }).format(number)
        } else if (type === "engi") {
            return new Intl.NumberFormat("en-GB", {
                notation: "engineering",
              }).format(number)
        } else if (type === "scie") {
            return new Intl.NumberFormat("en-US", {
                notation: "scientific",
              }).format(number)
        } else {
            return number
        }
    }
}

function updateUI() {
    /*
        NOTE: To ensure that performance does not decrease,
        please only call the render function when the user can actually see the content.
        If they can always see the content put the function call at the top of this function.

        NOTE2: Do NOT render anything to the screen outside of this function.
    */

    // Always render the sidebar.
    renderSideBar()
    if (gameData.settings.selectedTab == 'Stats') {renderStats()}
    if (gameData.settings.selectedTab == 'Money_0') {renderMoney()}
    if (gameData.settings.selectedSubTab == 'Money_2') {renderMoneyShop()}
}

function renderSideBar() {
    document.getElementById("VersionsDisplay").textContent = gameData.version

    // Current Run
    document.getElementById("YearDisplay").textContent = NumberFormat(gameData.layer[0].time.year)
    document.getElementById("AgeDisplay").textContent = NumberFormat(gameData.layer[0].time.age, "engi", true, true);
    document.getElementById("lifespanDisplay").textContent = NumberFormat(gameData.layer[0].time.lifespan, "engi", true);
    document.getElementById("moneyDisplay").textContent = NumberFormat(gameData.layer[0].money.amount, "engi", true);
    document.getElementById("learnDisplay").textContent = NumberFormat(gameData.layer[0].study.learning.amount, "engi", true);
    document.getElementById("medicineDisplay").textContent = NumberFormat(gameData.layer[0].study.medicine.amount, "engi", true);
    document.getElementById("Display_TopBar_Speed_0").textContent = gameData.layer[0].time.speed_actual
    document.getElementById("Prestige_1_Points_Display").textContent = NumberFormat(gameData.layer[1].points, "engi", true);
    // TBD Tachiyon Particles
    document.getElementById("BTCTEST").textContent = gameData.test.BTC
    document.getElementById("ETHTEST").textContent = gameData.test.ETH
    document.getElementById("USDTTEST").textContent = gameData.test.USDT


    // Prestige 1
    document.getElementById("YearDisplayNext").textContent = NumberFormat(gameData.layer[0].time.year_start)
    document.getElementById("AgeDisplayNext").textContent = NumberFormat(12, "engi", true, true);
    document.getElementById("lifespanDisplayNext").textContent = NumberFormat(Math.floor(gameData.layer[0].time.lifespan_start + (gameData.layer[0].time.age_lived / 50)), "engi", true);
    if (gameData.layer[1].upgrades.keep_upgrades === false) {
        document.getElementById("moneyDisplayNext").textContent = NumberFormat((((Math.cbrt(Math.cbrt(gameData.stats.money.current))) + gameData.layer[1].points ) * 10), "engi", true);
    } else {
        document.getElementById("moneyDisplayNext").textContent = NumberFormat(((((Math.cbrt(Math.cbrt(gameData.stats.money.current))) + gameData.layer[1].points ) * 10) + gameData.layer[0].money.amount), "engi", true);
    }
    document.getElementById("learnDisplayNext").textContent = NumberFormat((Math.cbrt(Math.cbrt(gameData.layer[0].study.learning.amount))), "engi", true);
    document.getElementById("medicineDisplayNext").textContent = NumberFormat((Math.cbrt(Math.cbrt(gameData.layer[0].study.medicine.amount))), "engi", true);
    // TBD Speed
    document.getElementById("Prestige_1_Points_DisplayNext").textContent = NumberFormat(Math.floor(1 + (Math.cbrt(Math.cbrt(gameData.layer[0].money.amount_earned)))) + Math.floor(gameData.layer[1].points), "engi", true);
    // TBD Tachiyon Particles


    // Prestige 2
}

function renderMoney() {
    document.getElementById("moneyPDDisplay").textContent = NumberFormat(gameData.layer[0].money.amount_pd, "engi", true)
    document.getElementById("moneyPYDisplay").textContent = NumberFormat(gameData.layer[0].money.amount_py, "engi", true)
}

function renderMoneyShop() {
    for (let i in gameData.layer[0].money.generators) {
        document.getElementById("money_gen_a_"+i).textContent = NumberFormat(gameData.layer[0].money.generators[i].amount, "engi", true)
        document.getElementById("money_gen_m_"+i).textContent = NumberFormat(gameData.layer[0].money.generators[i].money, "engi", true)
        document.getElementById("money_gen_c_"+i).textContent = NumberFormat(gameData.layer[0].money.generators[i].cost, "engi", true)
    }
}

function renderStats() {
    document.getElementById("stats_prestige_1_current").textContent = NumberFormat(gameData.stats.prestige_1.current)
    document.getElementById("stats_prestige_1_total").textContent = NumberFormat(gameData.stats.prestige_1.total)
    document.getElementById("stats_years_current").textContent = NumberFormat(gameData.stats.years.current)
    document.getElementById("stats_years_total").textContent = NumberFormat(gameData.stats.years.total)
    document.getElementById("stats_money_current").textContent = NumberFormat(gameData.layer[0].money.amount_earned, "engi", true)
    document.getElementById("stats_money_total").textContent = NumberFormat(gameData.layer[0].money.amount_total, "engi", true)

    for (let i in gameData.layer[0].money.generators) {
        document.getElementById("stats_generators_"+i+"_current").textContent = NumberFormat(gameData.layer[0].money.generators[i].amount)
        document.getElementById("stats_generators_"+i+"_total").textContent = NumberFormat(gameData.layer[0].money.generators[i].amount_total)
    }
}

document.getElementById("Money_Tab").click();

function openTab(evt, openTab, subTab) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");

    if ( subTab === false)
    {
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
    }
    
    if (subTab) {
        var parent = evt.currentTarget.closest('.tabcontent');
        parent.style.display = "block";
        if(parent.className.includes("active") === false) {
            parent.className += " active";
        }
        gameData.settings.selectedSubTab = openTab
    } else {
        gameData.settings.selectedSubTab = 'none'
        gameData.settings.selectedTab = openTab
    }
    document.getElementById(openTab).style.display = "block";
    evt.currentTarget.className += " active";
}