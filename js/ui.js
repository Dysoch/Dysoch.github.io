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
    renderMoney()
}

function renderSideBar() {
    document.getElementById("AgeDisplay").textContent = NumberFormat(gameData.layer[0].time.age, "engi", true, true);
    document.getElementById("AgeDisplayNext").textContent = NumberFormat(12, "engi", true, true);
    document.getElementById("YearDisplay").textContent = NumberFormat(gameData.layer[0].time.year)
    document.getElementById("YearDisplayNext").textContent = NumberFormat(gameData.layer[0].time.year_start)
    document.getElementById("VersionsDisplay").textContent = gameData.version
    document.getElementById("moneyDisplay").textContent = NumberFormat(gameData.layer[0].money.amount, "engi", true);
    document.getElementById("moneyDisplayNext").textContent = NumberFormat((((Math.cbrt(Math.cbrt(gameData.stats.money.current))) + gameData.layer[1].points ) * 10), "engi", true);
    document.getElementById("learnDisplay").textContent = NumberFormat(gameData.layer[0].study.learning.amount, "engi", true);
    document.getElementById("learnDisplayNext").textContent = NumberFormat(0);
    document.getElementById("medicineDisplay").textContent = NumberFormat(gameData.layer[0].study.medicine.amount, "engi", true);
    document.getElementById("medicineDisplayNext").textContent = NumberFormat(0);
    document.getElementById("lifespanDisplay").textContent = NumberFormat(gameData.layer[0].time.lifespan, "engi", true);
    document.getElementById("lifespanDisplayNext").textContent = NumberFormat(Math.floor(90 + ((gameData.layer[1].points / 10) + (gameData.stats.money.current / 1e9))), "engi", true);
    document.getElementById("Prestige_1_Points_Display").textContent = NumberFormat(gameData.layer[1].points, "engi", true);
    document.getElementById("Prestige_1_Points_DisplayNext").textContent = NumberFormat(Math.floor(1 + (Math.cbrt(Math.cbrt(gameData.stats.money.current)))), "engi", true);
}

function renderMoney() {
    document.getElementById("moneyPDDisplay").textContent = NumberFormat(gameData.layer[0].money.amount_pd, "engi", true)
    document.getElementById("moneyPYDisplay").textContent = NumberFormat(gameData.layer[0].money.amount_py, "engi", true)
    //document.getElementById("moneyLifeDisplay").textContent = NumberFormat(gameData.moneyLife)

    for (let i = 0; i < 15; i++) {
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
    document.getElementById("stats_money_current").textContent = NumberFormat(gameData.stats.money.current, "engi", true)
    document.getElementById("stats_money_total").textContent = NumberFormat(gameData.stats.money.total, "engi", true)

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

function deleteRow(id)
{
    document.getElementById(id).remove()
}

function childrenRow(Index) {

    for (let i = 0; i < 15; i++) {
        var table = document.getElementById("Money_Generator_Table");
        // GET TOTAL NUMBER OF ROWS 
        var x =table.rows.length;
        var id = "money_gen_"+i;
        var row = table.insertRow(x);
        row.id=id;
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);
        cell1.outerHTML = '<tr id="money_gen_'+i+'" style="display: none"> </tr> ';
        cell2.innerHTML = ' <td>'+gameData.layer[0].money.generators[i].name+'</td> ';
        cell3.innerHTML = ' <td>'+gameData.layer[0].money.generators[i].description+'</td> ';
        cell4.innerHTML = ' <td><span id="money_gen_c_'+i+'"></span>$</td> ';
        cell5.innerHTML = ' <td><span id="money_gen_m_'+i+'"></span>$</td> ';
        cell6.innerHTML = ' <td><span id="money_gen_a_'+i+'"></span>x</td> '; 
        cell7.innerHTML = ' <td class="btn-group" role="group" aria-label="Basic example"> <button type="button" class="btn btn-secondary" onClick="moneyBuyGen('+i+', 1)">1x</button> <button type="button" class="btn btn-secondary" onClick="moneyBuyGen('+i+', 5)">5x</button> <button type="button" class="btn btn-secondary" onClick="moneyBuyGen('+i+', 10)">10x</button> <button type="button" class="btn btn-secondary" onClick="moneyBuyGen('+i+', 50)">50x</button> <button type="button" class="btn btn-secondary" onClick="moneyBuyGen('+i+', 100)">100x</button> </td> '; 
        cell8.innerHTML = ' <th> <input type="checkbox" class="btn-check" id="btncheck'+i+'" autocomplete="off" onClick="Toggle_AutoBuyer('+i+')"> <label class="btn btn-outline-primary" for="btncheck'+i+'">Off / On</label> </th> '; 
        document.getElementById('money_gen_'+i).style.display = "none"
    }
}
childrenRow()