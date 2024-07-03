

function Money_Generator_Table_UI() {

    for (let i in gameData.layer[0].money.generators) {
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
        cell7.innerHTML = ' <td class="btn-group" role="group" aria-label="Basic example'+i+'"> <button type="button" class="btn btn-secondary btn-sm" onClick="moneyBuyGen('+i+', 1)">1x</button> <button type="button" class="btn btn-secondary btn-sm" onClick="moneyBuyGen('+i+', 5)">5x</button> <button type="button" class="btn btn-secondary btn-sm" onClick="moneyBuyGen('+i+', 10)">10x</button> <button type="button" class="btn btn-secondary btn-sm" onClick="moneyBuyGen('+i+', 50)">50x</button> <button type="button" class="btn btn-secondary btn-sm" onClick="moneyBuyGen('+i+', 100)">100x</button> </td> '; 
        cell8.innerHTML = ' <th> <input type="checkbox" class="btn-check" id="MoneyGenButCheck'+i+'" autocomplete="off" onClick="Toggle_AutoBuyer('+i+')"> <label class="btn btn-outline-primary btn-sm" for="MoneyGenButCheck'+i+'">Off / On</label> </th> '; 
        document.getElementById('money_gen_'+i).style.display = "none"
    }
}

function Money_Upgrade_Table_UI() {

    for (let i in gameData.layer[0].money.upgrades) {
        var table = document.getElementById("Money_Upgrade_Table");
        // GET TOTAL NUMBER OF ROWS 
        var x =table.rows.length;
        var id = "money_upgrade_"+i;
        var row = table.insertRow(x);
        row.id=id;
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        cell1.outerHTML = '<tr id="money_upgrade_'+i+'" style="display: table-row"> </tr> ';
        cell2.innerHTML = ' <td>'+gameData.layer[0].money.upgrades[i].name+'</td> ';
        cell3.innerHTML = ' <td>'+gameData.layer[0].money.upgrades[i].description+'</td> ';
        cell4.innerHTML = ' <td>'+NumberFormat(gameData.layer[0].money.upgrades[i].cost, "engi", true)+'$</td> ';
        cell5.innerHTML = ' <td>  <button type="button" class="btn btn-secondary btn-sm" onClick="MoneyUpgrades('+i+', '+gameData.layer[0].money.upgrades[i].cost+', '+gameData.layer[0].money.upgrades[i].multi+', '+gameData.layer[0].money.upgrades[i].type+')">Buy</button> </td> '; 
        document.getElementById('money_upgrade_'+i).style.display = "table-row"
    }
}

// Run all UI functions
Money_Generator_Table_UI()
Money_Upgrade_Table_UI()