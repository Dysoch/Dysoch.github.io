
function updateUI() {
    /*
        NOTE: To ensure that performance does not decrease,
        please only call the render function when the user can actually see the content.
        If they can always see the content put the function call at the top of this function.

        NOTE2: Do NOT render anything to the screen outside of this function.
    */

    // Always render the sidebar.
    renderSideBar()
}

function renderSideBar() {
    document.getElementById("daysDisplay").textContent = gameData.days
    document.getElementById("yearsDisplay").textContent = gameData.years
    document.getElementById("lifespanDisplay").textContent = gameData.lifespan
    document.getElementById("moneyDisplay").textContent = gameData.money.toFixed(0)
    document.getElementById("moneyPDDisplay").textContent = gameData.moneyPD.toFixed(2)
    document.getElementById("moneyPYDisplay").textContent = gameData.moneyPY.toFixed(2)

}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }