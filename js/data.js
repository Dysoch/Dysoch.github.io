const version = 0.01

var gameData = {

    version: 0.00,
    money: 0,
    moneyPD: 0,
    moneyPY: 0,
    days: 1,
    years: 12,
    lifespan: 90,
    paused: false,

    unlocked:  {
        money: {
            [0]: 0, [1]: 0, [2]: 0, [4]: 0,
        },
    },

    generators: {
        money: {
            [0]: {amount: 0, cost: 10, money: 0.15, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [1]: {amount: 0, cost: 100, money: 1, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [2]: {amount: 0, cost: 1000, money: 5, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [3]: {amount: 0, cost: 10000, money: 25, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
            [4]: {amount: 0, cost: 100000, money: 100, mult1: 1, mult2: 1, mult3: 1, mult4: 1, mult5: 1, mult: 1},
        },
    },

    settings: {
        selectedTab: 'Money_0',
        selectedSubTab: 'Money_1',
    }
}