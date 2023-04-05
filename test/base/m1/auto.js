/**
 * ES6, CJS
 */
const { Automation }    = require('../../../src/automation');
const M1_1              = require('../m1_1/auto');

class Auto extends Automation {
    constructor() {
        super(__dirname);
        
        let m1_1 = new M1_1();
        
        this.mod.super('a1_1', m1_1);
    }
}

module.exports = Auto;