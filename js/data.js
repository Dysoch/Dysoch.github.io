const version = 0.02

var gameData = {

    version: 0.00,
    money: 0,
    moneyPD: 0,
    moneyPY: 0,
    days: 1,
    years: 12,
    yearslived: 0,
    lifespan: 90,
    died: false,
    paused: false,
    speed: 100,

    unlocked:  {
        money: {
            [0]: 0, [1]: 0, [2]: 0, [3]: 0, [4]: 0,
        },
    },
    
    multiplier: {
        prestige1: 1,
    },

    generators: {
        money: {
            [0]: {amount: 0, basecost: 10, cost: 10, money: 0.15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [1]: {amount: 0, basecost: 100, cost: 100, money: 1, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [2]: {amount: 0, basecost: 1000, cost: 1000, money: 5, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [3]: {amount: 0, basecost: 10000, cost: 10000, money: 25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [4]: {amount: 0, basecost: 100000, cost: 100000, money: 100, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
        },
    },

    settings: {
        selectedTab: 'Money_0',
        selectedSubTab: 'Money_1',
    }
}