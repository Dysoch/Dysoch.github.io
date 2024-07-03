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
    renderCrypto()
}

function renderCrypto() {
    // Price
    document.getElementById("Crypto_Price_bitcoin").textContent = gameData.crypto["bitcoin"]
    document.getElementById("Crypto_Price_ethereum").textContent = gameData.crypto["ethereum"]
    document.getElementById("Crypto_Price_tether").textContent = gameData.crypto["tether"]
    document.getElementById("Crypto_Price_binance").textContent = gameData.crypto["binance"]
    document.getElementById("Crypto_Price_solana").textContent = gameData.crypto["solana"]
    document.getElementById("Crypto_Price_xrp").textContent = gameData.crypto["xrp"]
    document.getElementById("Crypto_Price_dogecoin").textContent = gameData.crypto["dogecoin"]
    document.getElementById("Crypto_Price_cardano").textContent = gameData.crypto["cardano"]
    document.getElementById("Crypto_Price_polkadot").textContent = gameData.crypto["polkadot"]
    document.getElementById("Crypto_Price_litecoin").textContent = gameData.crypto["litecoin"]

    // Amount
    document.getElementById("Crypto_Amount_bitcoin").textContent = gameData.layer[0].crypto["bitcoin"]
    document.getElementById("Crypto_Amount_ethereum").textContent = gameData.layer[0].crypto["ethereum"]
    document.getElementById("Crypto_Amount_tether").textContent = gameData.layer[0].crypto["tether"]
    document.getElementById("Crypto_Amount_binance").textContent = gameData.layer[0].crypto["binance"]
    document.getElementById("Crypto_Amount_solana").textContent = gameData.layer[0].crypto["solana"]
    document.getElementById("Crypto_Amount_xrp").textContent = gameData.layer[0].crypto["xrp"]
    document.getElementById("Crypto_Amount_dogecoin").textContent = gameData.layer[0].crypto["dogecoin"]
    document.getElementById("Crypto_Amount_cardano").textContent = gameData.layer[0].crypto["cardano"]
    document.getElementById("Crypto_Amount_polkadot").textContent = gameData.layer[0].crypto["polkadot"]
    document.getElementById("Crypto_Amount_litecoin").textContent = gameData.layer[0].crypto["litecoin"]

    // Amount Price
    document.getElementById("Crypto_Price_Portofolio_bitcoin").textContent = (gameData.layer[0].crypto["bitcoin"] * gameData.crypto["bitcoin"])
    document.getElementById("Crypto_Price_Portofolio_ethereum").textContent = (gameData.layer[0].crypto["ethereum"] * gameData.crypto["ethereum"])
    document.getElementById("Crypto_Price_Portofolio_tether").textContent = (gameData.layer[0].crypto["tether"] * gameData.crypto["tether"])
    document.getElementById("Crypto_Price_Portofolio_binance").textContent = (gameData.layer[0].crypto["binance"] * gameData.crypto["binance"])
    document.getElementById("Crypto_Price_Portofolio_solana").textContent = (gameData.layer[0].crypto["solana"] * gameData.crypto["solana"])
    document.getElementById("Crypto_Price_Portofolio_xrp").textContent = (gameData.layer[0].crypto["xrp"] * gameData.crypto["xrp"])
    document.getElementById("Crypto_Price_Portofolio_dogecoin").textContent = (gameData.layer[0].crypto["dogecoin"] * gameData.crypto["dogecoin"])
    document.getElementById("Crypto_Price_Portofolio_cardano").textContent = (gameData.layer[0].crypto["cardano"] * gameData.crypto["cardano"])
    document.getElementById("Crypto_Price_Portofolio_polkadot").textContent = (gameData.layer[0].crypto["polkadot"] * gameData.crypto["polkadot"])
    document.getElementById("Crypto_Price_Portofolio_litecoin").textContent = (gameData.layer[0].crypto["litecoin"] * gameData.crypto["litecoin"])
}