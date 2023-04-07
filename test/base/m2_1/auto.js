/**
 * ES6, CJS
 */
const { Automation } = require('../../../src/automation');

class Auto extends Automation {
    constructor() {
        super(__dirname);
    }
}

module.exports = Auto;
