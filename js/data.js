const version = 0.03

var gameData = {

    version: version,
    money: 0,
    moneyPD: 0,
    moneyPY: 0,
    moneyLife: 0,
    days: 1,
    years: 12,
    yearslived: 0,
    lifespan: 90,
    died: false,
    paused: false,
    speed: 100,

    unlocked:  {
        money: {
            [0]: 0, [1]: 0, [2]: 0, [3]: 0, [4]: 0, [5]: 0, [6]: 0, [7]: 0, [8]: 0, [9]: 0, [10]: 0, [11]: 0, [12]: 0, [13]: 0, [14]: 0,
        },
    },
    
    multiplier: {
        prestige1: 1,
    },

    generators: {
        money: {
            [0]: {amount: 0, basecost: 1e1, cost: 1e1, basemoney: 0.15, money: 0.15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e1},
            [1]: {amount: 0, basecost: 1e2, cost: 1e2, basemoney: 1, money: 1, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e2},
            [2]: {amount: 0, basecost: 1e3, cost: 1e3, basemoney: 5, money: 5, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e3},
            [3]: {amount: 0, basecost: 1e4, cost: 1e4, basemoney: 25, money: 25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e4},
            [4]: {amount: 0, basecost: 1e5, cost: 1e5, basemoney: 1e2, money: 1e2, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e5},
            [5]: {amount: 0, basecost: 1e6, cost: 1e6, basemoney: 1e4, money: 1e4, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e7},
            [6]: {amount: 0, basecost: 1e9, cost: 1e9, basemoney: 1e6, money: 1e6, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e9},
            [7]: {amount: 0, basecost: 1e10, cost: 1e10, basemoney: 1e8, money: 1e8, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e10},
            [8]: {amount: 0, basecost: 1e12, cost: 1e12, basemoney: 1e10, money: 1e10, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e12},
            [9]: {amount: 0, basecost: 1e14, cost: 1e14, basemoney: 1e12, money: 1e12, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e14},
            [10]: {amount: 0, basecost: 1e17, cost: 1e17, basemoney: 1e15, money: 1e15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e17},
            [11]: {amount: 0, basecost: 1e20, cost: 1e20, basemoney: 1e18, money: 1e18, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e20},
            [12]: {amount: 0, basecost: 1e23, cost: 1e23, basemoney: 1e21, money: 1e21, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e23},
            [13]: {amount: 0, basecost: 1e27, cost: 1e27, basemoney: 1e25, money: 1e25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e27},
            [14]: {amount: 0, basecost: 1e31, cost: 1e31, basemoney: 1e29, money: 1e29, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1, unlock: 1.5e31},
        },
    },

    settings: {
        selectedTab: 'Money_0',
        selectedSubTab: 'Money_1',
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
}