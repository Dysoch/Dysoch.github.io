
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
    renderMoney()
}

function renderSideBar() {
    document.getElementById("daysDisplay").textContent = gameData.days
    document.getElementById("yearsDisplay").textContent = gameData.years
}

function renderMoney() {
    document.getElementById("moneyDisplay").textContent = gameData.money.toFixed(2)
    document.getElementById("moneyPDDisplay").textContent = gameData.moneyPD.toFixed(2)
    document.getElementById("moneyPYDisplay").textContent = gameData.moneyPY.toFixed(2)
    document.getElementById("money_gen_0_a").textContent = gameData.generators.money[0].amount
    document.getElementById("money_gen_0_m").textContent = gameData.generators.money[0].money
    document.getElementById("money_gen_0_c").textContent = gameData.generators.money[0].cost
    document.getElementById("money_gen_1_a").textContent = gameData.generators.money[1].amount
    document.getElementById("money_gen_1_m").textContent = gameData.generators.money[1].money
    document.getElementById("money_gen_1_c").textContent = gameData.generators.money[1].cost
    document.getElementById("money_gen_2_a").textContent = gameData.generators.money[2].amount
    document.getElementById("money_gen_2_m").textContent = gameData.generators.money[2].money
    document.getElementById("money_gen_2_c").textContent = gameData.generators.money[2].cost
    document.getElementById("money_gen_3_a").textContent = gameData.generators.money[3].amount
    document.getElementById("money_gen_3_m").textContent = gameData.generators.money[3].money
    document.getElementById("money_gen_3_c").textContent = gameData.generators.money[3].cost
    document.getElementById("money_gen_4_a").textContent = gameData.generators.money[4].amount
    document.getElementById("money_gen_4_m").textContent = gameData.generators.money[4].money
    document.getElementById("money_gen_4_c").textContent = gameData.generators.money[4].cost
}

function renderAge() {
    document.getElementById("lifespanDisplay").textContent = gameData.lifespan
}

document.getElementById("defaultOpen").click();

function openTab(evt, openTab, subTab) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");

    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    if(subTab) {
      var parent = evt.currentTarget.closest('.tabcontent');
      parent.style.display = "block";
      parent.className += " active";
    }
    document.getElementById(openTab).style.display = "block";
    evt.currentTarget.className += " active";
    gameData.settings.selectedTab = openTab
    gameData.settings.selectedSubTab = subTab
}