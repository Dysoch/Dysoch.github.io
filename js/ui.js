
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
    document.getElementById("moneyDisplay").textContent = gameData.money

}