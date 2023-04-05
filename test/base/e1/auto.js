/**
 * ES6, CJS
 */
const { Automation }    = require('../../../src/automation');
const M1                = require('../m1/auto');

class Auto extends Automation {
    constructor() {
        super(__dirname);
        
        let m1 = new M1();
        
        this.mod.super('a1', m1, 'super 테스트');
    }
}

module.exports = Auto;
