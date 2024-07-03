const version = 0.05
const debug = true

var gameData = {

    version: version,
    debug: debug,

    crypto: {
        ["bitcoin"]: 0,
        ["ethereum"]: 0,
        ["tether"]: 0,
        ["binance"]: 0,
        ["solana"]: 0,
        ["xrp"]: 0,
        ["dogecoin"]: 0,
        ["cardano"]: 0,
        ["polkadot"]: 0,
        ["litecoin"]: 0,
    },

    layer: {
        [0]: {
            money: 0,
            crypto: {
                ["bitcoin"]: 0,
                ["ethereum"]: 0,
                ["tether"]: 0,
                ["binance"]: 0,
                ["solana"]: 0,
                ["xrp"]: 0,
                ["dogecoin"]: 0,
                ["cardano"]: 0,
                ["polkadot"]: 0,
                ["litecoin"]: 0,
            },
        },
    },
}