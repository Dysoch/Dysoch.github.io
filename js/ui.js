
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
    document.getElementById("moneyDisplay").textContent = gameData.money.toFixed(0)

}

function setTab(selectedTab) {
    const tabElement = document.getElementById(selectedTab)

    if (tabElement == null) {
        setTab(Tab.JOBS)
        return
    }

    gameData.settings.selectedTab = selectedTab

    // Update the UI when switching tabs to prevent flikering.
    updateUI()

    const element = document.getElementById(selectedTab + "TabButton")

    const tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"))
    tabs.forEach(function(tab) {
        tab.style.display = "none"
    })
    tabElement.style.display = "flex"

    const tabButtons = document.getElementsByClassName("tabButton")
    for (tabButton of tabButtons) {
        tabButton.classList.remove("w3-blue-gray")
    }
    element.classList.add("w3-blue-gray")
}