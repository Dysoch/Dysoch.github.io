const version = 0.04

var gameData = {

    version: version,
    debug: true,
    speed: 1,

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
                amount_pd: 0,
                amount_py: 0,
                generators: {
                    [0]: {amount: 0, basecost: 1e1, cost: 1e1, basemoney: 0.15, money: 0.15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e1, age: 12, year: 1980, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Lemonade Stand", description: "Lets sell some lemonade"},
                    [1]: {amount: 0, basecost: 1e2, cost: 1e2, basemoney: 1, money: 1, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e2, age: 13, year: 1982, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Newspaper Route", description: "TBD"},
                    [2]: {amount: 0, basecost: 1e3, cost: 1e3, basemoney: 5, money: 5, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e3, age: 16, year: 1985, study: 0, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Car Wash", description: "TBD"},
                    [3]: {amount: 0, basecost: 1e4, cost: 1e4, basemoney: 25, money: 25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e4, age: 21, year: 1990, study: 50, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Car Dealer", description: "TBD"},
                    [4]: {amount: 0, basecost: 1e5, cost: 1e5, basemoney: 1e2, money: 1e2, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e5, age: 25, year: 1995, study: 250, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Pharma Company", description: "TBD"},
                    [5]: {amount: 0, basecost: 1e6, cost: 1e6, basemoney: 1e4, money: 1e4, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e7, age: 30, year: 2000, study: 600, unlocked: false, autobuyer: false, auto_unlocked: false, name: "Mining Company", description: "TBD"},
                    [6]: {amount: 0, basecost: 1e9, cost: 1e9, basemoney: 1e6, money: 1e6, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e9, age: 40, year: 2010, study: 1e4, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [7]: {amount: 0, basecost: 1e10, cost: 1e10, basemoney: 1e8, money: 1e8, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e10, age: 50, year: 2020, study: 5e4, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [8]: {amount: 0, basecost: 1e12, cost: 1e12, basemoney: 1e10, money: 1e10, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e12, age: 60, year: 2030, study: 1e6, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [9]: {amount: 0, basecost: 1e14, cost: 1e14, basemoney: 1e12, money: 1e12, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e14, age: 75, year: 2045, study: 5e6, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [10]: {amount: 0, basecost: 1e17, cost: 1e17, basemoney: 1e15, money: 1e15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e17, age: 100, year: 2070, study: 1e8, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [11]: {amount: 0, basecost: 1e20, cost: 1e20, basemoney: 1e18, money: 1e18, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e20, age: 150, year: 2120, study: 5e8, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [12]: {amount: 0, basecost: 1e23, cost: 1e23, basemoney: 1e21, money: 1e21, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e23, age: 250, year: 2200, study: 1e10, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [13]: {amount: 0, basecost: 1e27, cost: 1e27, basemoney: 1e25, money: 1e25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e27, age: 450, year: 2350, study: 5e10, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                    [14]: {amount: 0, basecost: 1e31, cost: 1e31, basemoney: 1e29, money: 1e29, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e31, age: 500, year: 2500, study: 1e15, unlocked: false, autobuyer: false, auto_unlocked: false, name: "TBD", description: "TBD"},
                },
            },
            time: {
                days: 0,
                age: 12,
                age_lived: 0,
                base_start: 12,
                lifespan: 90,
                lifespan_prestige: 90,
                lifespan_start: 90,
                year: 1980,
                year_start: 1980,
                died: false,
                lifespan_infinite: false,
            },
            mode: 'learn',
        },
        [1]: {
            points: 0,
            multiplier: 1,
            upgrades: {
                keep_money: false,
                keep_shops: false,
                keep_upgrades: false,
                auto_prestige: false,

            },
        },
    },
}