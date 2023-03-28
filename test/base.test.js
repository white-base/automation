const fs        = require("fs");
const path      = require("path");
const AutoTask  = require("../src/auto-task").AutoTask;
const dirname   = path.join(__dirname, "/base/mod1");
let autoTask    = null;


describe("task :: clear", () => {
    it("[ new >> do_clear(1) ]", () => {
        autoTask = AutoTask.create(dirname);
        autoTask.isLog = false;
        autoTask.do_dist();
    });
    // it("- 파일 유무 : src/one.html(X)", () => {
    //     const fullPath = dirname + "/src/one.html";
    //     expect(fs.existsSync(fullPath)).toBeFalsy();
        
    // });
});