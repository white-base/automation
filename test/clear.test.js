const fs        = require('fs');
const path      = require('path');
let dirname     = path.join(__dirname, 'base');
let autoTask    = null;

describe("task :: clear", () => {
    beforeAll(() => {
        jest.resetModules();
    });
    it("[ base 생성 및 do_clear(1) ]", () => {
        const AutoTask  = require('../src/auto-task').AutoTask;
        autoTask = AutoTask.create(path.join(dirname, 'e1'));
        autoTask.do_clear();
    });
    // it("[ pageGroup 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname2);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
    // it("[ import 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname3);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
    // it("[ import 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname4);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
    // it("[ import 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname5);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
    // it("[ import 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname6);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
    // it("[ import 생성 및 do_clear(1) ]", () => {
    //     autoTask = AutoTask.create(dirname7);
    //     autoTask.isLog = false;
    //     autoTask.do_clear(1);   // 강제 클리어
    // });
});