﻿const version = 0.05
const debug = true

var gameData = {

    version: version,
    debug: debug,
    speed: 1,

    test: {
        BTC: 0,
        ETH: 0,
        USDT: 0,
        data: {},
    },

    settings: {
        selectedTab: 'Money_0',
        selectedSubTab: 'Money_1',
        paused: false,
    },

    stats: {
        prestige_1: {current: 0, total: 0},
        years: {current: 0, total: 0},
        money: {
            current: 0, 
            total: 0,
            generators: {
                [0]: {current: 0, total: 0},
                [1]: {current: 0, total: 0},
                [2]: {current: 0, total: 0},
                [3]: {current: 0, total: 0},
                [4]: {current: 0, total: 0},
                [5]: {current: 0, total: 0},
                [6]: {current: 0, total: 0},
                [7]: {current: 0, total: 0},
                [8]: {current: 0, total: 0},
                [9]: {current: 0, total: 0},
                [10]: {current: 0, total: 0},
                [11]: {current: 0, total: 0},
                [12]: {current: 0, total: 0},
                [13]: {current: 0, total: 0},
                [14]: {current: 0, total: 0},
            },
        },
    },

    layer: {
        [0]: {
            study: {
                learning: {amount: 0, multi: 1},
                medicine: {amount: 0, multi: 1},
            },
            money: {
                amount: 0,
                amount_earned: 0,
                amount_total: 0,
                amount_pd: 0,
                amount_py: 0,
                generators: {
                    [0]: {amount: 0, basecost: 1e1, cost: 1e1, basemoney: 0.15, money: 0.15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e1, age: 12, year: 0, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Scrounge", description: "Scrounge for coins", amount_total: 0},
                    [1]: {amount: 0, basecost: 1e2, cost: 1e2, basemoney: 1, money: 1, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e2, age: 13, year: 0, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Market Stall", description: "Start a newspaper route", amount_total: 0},
                    [2]: {amount: 0, basecost: 1e3, cost: 1e3, basemoney: 5, money: 5, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e3, age: 16, year: 10, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Car Wash", description: "Start a Car Wash", amount_total: 0},
                    [3]: {amount: 0, basecost: 1e4, cost: 1e4, basemoney: 25, money: 25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e4, age: 21, year: 30, study: 50, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Car Dealer", description: "Open a dealership", amount_total: 0},
                    [4]: {amount: 0, basecost: 1e5, cost: 1e5, basemoney: 1e2, money: 1e2, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e5, age: 25, year: 90, study: 250, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Pharma Company", description: "Own a Medicine Company", amount_total: 0},
                    [5]: {amount: 0, basecost: 1e6, cost: 1e6, basemoney: 1e4, money: 1e4, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e7, age: 30, year: 200, study: 600, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Mining Company", description: "Start a Mining Company", amount_total: 0},
                    [6]: {amount: 0, basecost: 1e9, cost: 1e9, basemoney: 1e6, money: 1e6, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e9, age: 40, year: 350, study: 1e4, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [7]: {amount: 0, basecost: 1e10, cost: 1e10, basemoney: 1e8, money: 1e8, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e10, age: 50, year: 600, study: 5e4, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [8]: {amount: 0, basecost: 1e12, cost: 1e12, basemoney: 1e10, money: 1e10, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e12, age: 60, year: 1000, study: 1e6, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [9]: {amount: 0, basecost: 1e14, cost: 1e14, basemoney: 1e12, money: 1e12, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e14, age: 75, year: 1500, study: 5e6, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [10]: {amount: 0, basecost: 1e17, cost: 1e17, basemoney: 1e15, money: 1e15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e17, age: 100, year: 1900, study: 1e8, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [11]: {amount: 0, basecost: 1e20, cost: 1e20, basemoney: 1e18, money: 1e18, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e20, age: 150, year: 2000, study: 5e8, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [12]: {amount: 0, basecost: 1e23, cost: 1e23, basemoney: 1e21, money: 1e21, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e23, age: 250, year: 2100, study: 1e10, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Space Hotel", description: "Start a orbital Hotel", amount_total: 0},
                    [13]: {amount: 0, basecost: 1e27, cost: 1e27, basemoney: 1e25, money: 1e25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e27, age: 450, year: 2350, study: 5e10, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                    [14]: {amount: 0, basecost: 1e31, cost: 1e31, basemoney: 1e29, money: 1e29, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e31, age: 500, year: 2500, study: 1e15, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD", amount_total: 0},
                },
                upgrades: {
                    [0]: {name: "Boost Morale", description: "Boost employee morale (10% money increase)", cost: 100, multi: 0.1, bought: false, type: 1},
                    [1]: {name: "Take a course", description: "Learn business skills (25% money increase)", cost: 1e4, multi: 0.25, bought: false, type: 1},
                    [2]: {name: "Tax Evasion", description: "Evade the IRS (50% money increase)", cost: 1e5, multi: 0.5, bought: false, type: 1},
                    [3]: {name: "Clock of Time", description: "Buy a expensive watch (2x speed increase)", cost: 1e6, multi: 2, bought: false, type: 2},
                    [4]: {name: "Vaccine", description: "Get a vaccine (+5 Lifespan)", cost: 1e7, multi: 5, bought: false, type: 3},
                    [5]: {name: "IRS Bribe", description: "Bribe the IRS (100% money increase)", cost: 1e8, multi: 1, bought: false, type: 1},
                    [6]: {name: "IRS Bribe again", description: "Bribe the IRS (150% money increase)", cost: 1e9, multi: 1.5, bought: false, type: 1},
                    [7]: {name: "Clock of Time 2", description: "Buy a expensive watch (2x speed increase)", cost: 1e9, multi: 2, bought: false, type: 2},
                    [8]: {name: "Vaccine 2", description: "Get a vaccine again (+25 Lifespan)", cost: 1e9, multi: 25, bought: false, type: 3},
                    [9]: {name: "IRS Bribe again", description: "Bribe the IRS (150% money increase)", cost: 1e11, multi: 1.5, bought: false, type: 1},
                    [10]: {name: "Clock of Time 2", description: "Buy a expensive watch (2x speed increase)", cost: 1e11, multi: 2, bought: false, type: 2},
                    [11]: {name: "Vaccine 3", description: "Get a vaccine again (+50 Lifespan)", cost: 1e11, multi: 50, bought: false, type: 3},
                }
            },
            time: {
                days: 0,
                age: 12,
                age_lived: 0,
                base_start: 12,
                lifespan: 90,
                lifespan_prestige: 0,
                lifespan_upgrade: 0,
                lifespan_medicine: 0,
                lifespan_start: 90,
                year: 0,
                year_start: 0,
                died: false,
                lifespan_infinite: false,
                speed: 1,
                speed_actual: 1,
                speed_base: 1,
                speed_upgrade: 1,
                speed_layer_1: 1,
                speed_layer_2: 1,
                speed_layer_3: 1,
                speed_layer_4: 1,
                speed_layer_5: 1,
            },
            mode: 'learn',
        },
        [1]: {
            points: 0,
            prestiged: 0,
            name: "Reincarnation",
            multiplier: 1,
            upgrades: {
                keep_money: false,
                keep_shops: false,
                keep_upgrades: false,
                auto_prestige: false,
            },
            upgrades2: {
                [0]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 0, cost: 1, bought: false},
                [1]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 1, cost: 3, bought: false},
                [2]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 2, cost: 5, bought: false},
                [3]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 3, cost: 8, bought: false},
                [4]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 4, cost: 10, bought: false},
                [5]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 5, cost: 15, bought: false},
                [6]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 6, cost: 20, bought: false},
                [7]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 7, cost: 28, bought: false},
                [8]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 8, cost: 40, bought: false},
                [9]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 9, cost: 55, bought: false},
                [10]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 10, cost: 75, bought: false},
                [11]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 11, cost: 100, bought: false},
                [12]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 12, cost: 140, bought: false},
                [13]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 13, cost: 200, bought: false},
                [14]: {name: "Autobuyer", description: "Autobuyer for ", type: 1, id: 14, cost: 300, bought: false},
            },
        },
        [2]: {
            points: 0,
            prestiged: 0,
            name: "Colonisation",
            multiplier: 1,
            upgrades: {
                
            },
            upgrades2: {
                
            },
        },
    },
}