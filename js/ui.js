function NumberFormat(number) {
    return new Intl.NumberFormat("en-GB", {
        notation: "compact",
        compactDisplay: "short",
      }).format(number)
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
    if (gameData.settings.selectedTab == 'Age') {renderAge()}
    if (gameData.settings.selectedTab == 'Stats') {renderStats()}
    renderMoney()
}

function renderSideBar() {
    document.getElementById("daysDisplay").textContent = gameData.days
    document.getElementById("yearsDisplay").textContent = NumberFormat(gameData.years)
    document.getElementById("VersionsDisplay").textContent = gameData.version
}

function renderMoney() {
    document.getElementById("moneyDisplay").textContent = NumberFormat(gameData.money);
    document.getElementById("moneyPDDisplay").textContent = NumberFormat(gameData.moneyPD)
    document.getElementById("moneyPYDisplay").textContent = NumberFormat(gameData.moneyPY)
    document.getElementById("moneyLifeDisplay").textContent = NumberFormat(gameData.moneyLife)

    for (let i = 0; i < 15; i++) {
        document.getElementById("money_gen_a_"+i).textContent = NumberFormat(gameData.generators.money[i].amount)
        document.getElementById("money_gen_m_"+i).textContent = NumberFormat(gameData.generators.money[i].money)
        document.getElementById("money_gen_c_"+i).textContent = NumberFormat(gameData.generators.money[i].cost)
    }
}

function renderAge() {
    document.getElementById("lifespanDisplay").textContent = NumberFormat(gameData.lifespan)
}

function renderStats() {
    document.getElementById("stats_prestige_1_current").textContent = NumberFormat(gameData.stats.prestige_1.current)
    document.getElementById("stats_prestige_1_total").textContent = NumberFormat(gameData.stats.prestige_1.total)
    document.getElementById("stats_years_current").textContent = NumberFormat(gameData.stats.years.current)
    document.getElementById("stats_years_total").textContent = NumberFormat(gameData.stats.years.total)
    document.getElementById("stats_money_current").textContent = NumberFormat(gameData.stats.money.current)
    document.getElementById("stats_money_total").textContent = NumberFormat(gameData.stats.money.total)

    for (let i = 0; i < 15; i++) {
        document.getElementById("stats_generators_"+i+"_current").textContent = NumberFormat(gameData.stats.money.generators[i].current)
        document.getElementById("stats_generators_"+i+"_total").textContent = NumberFormat(gameData.stats.money.generators[i].total)
    }
}

document.getElementById("defaultOpen").click();

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
    
    if(subTab) {
      var parent = evt.currentTarget.closest('.tabcontent');
      parent.style.display = "block";
      if(parent.className.includes("active") === false)
      {

        parent.className += " active";
      }
      
    }
    document.getElementById(openTab).style.display = "block";
    evt.currentTarget.className += " active";
    gameData.settings.selectedTab = openTab
    gameData.settings.selectedSubTab = subTab
}