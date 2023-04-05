const fs        = require("fs");
const path      = require("path");
const AutoTask  = require("../src/auto-task").AutoTask;

let dirname     = path.join(__dirname, "/base/e1");
let autoTask    = null;


describe("< base : super, sub, 중복 검사 >", () => {
    beforeAll(() => {
        jest.resetModules();
    });

    // it("- autoTask 생성 ", () => {
    //     dirname = path.join(__dirname, "/base/e1");
    //     autoTask = AutoTask.create(dirname);
    //     autoTask.isLog = false;

    // });
    // it("- task : do_depend() ", () => {
    //     autoTask.do_depend();
    // });

    it("[ new >> do_clear(1) ]", () => {
        autoTask = AutoTask.create(path.join(__dirname, "/base/mod1"));
        autoTask.isLog = false;
        autoTask.do_dist();
    });

    // it("- 파일 유무 : src/one.html(X)", () => {
    //     const fullPath = dirname + "/src/one.html";
    //     expect(fs.existsSync(fullPath)).toBeFalsy();
        
    // });
        // it("- 파일 유무 : src/one.html(X)", () => {
    //     const fullPath = dirname + "/src/one.html";
    //     expect(fs.existsSync(fullPath)).toBeFalsy();
        
    // });
});