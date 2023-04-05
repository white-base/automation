const fs        = require('fs');
const path      = require('path');
let dirname     = path.join(__dirname, 'base/e1');
let autoTask    = null;
/**
 * 대상의 전체 하위 경로 배열로 가져오기
 * TODO: 공통으로 이동 검토
 * @param {string} dir 
 * @returns {array}
 */
const getAllFiles = dir => {
    if (fs.existsSync(dir)) return fs.readdirSync(dir).reduce((files, file) => {
        const name = path.join(dir, file);
        const isDirectory = fs.statSync(name).isDirectory();
        return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
    }, []);
    else return [];
};

describe('< base : super() >', () => {
    beforeAll(() => {
        jest.resetModules();
    });

    describe('< e1.super(m1), m1.super(m1_1) : 상위 가져옴 검사  >', () => {
        beforeAll(() => {
            const AutoTask  = require('../src/auto-task').AutoTask;
            autoTask = AutoTask.create(path.join(__dirname, 'base/e1'));
            autoTask.batch.pathType = 2; // 전체 상대경로 변경
            dirname = path.join(__dirname, 'base/e1');
        });
        it('- 폴더 초기화 및 구조 검사 ', () => {
            autoTask.do_clear();

            const dirDep = getAllFiles(path.join(dirname,'dep'));
            const dirDis = getAllFiles(path.join(dirname,'dist'));
            const dirIns = getAllFiles(path.join(dirname,'install'));
            const dirPub = getAllFiles(path.join(dirname,'publish'));
            
            expect(dirDep).toEqual([]);
            expect(dirDis).toEqual([]);
            expect(dirIns).toEqual([]);
            expect(dirPub).toEqual([]);
        });
        describe('< task : depend >', () => {
            beforeAll(() => {
                autoTask.do_depend();
            });
            it('- 폴더 파일들 검사 ', () => {
                const dirDep = getAllFiles(path.join(dirname,'dep'));
                const dirDis = getAllFiles(path.join(dirname,'dist'));
                const dirIns = getAllFiles(path.join(dirname,'install'));
                const dirPub = getAllFiles(path.join(dirname,'publish'));

                expect(dirDep).toContain(path.join(dirname, 'dep/a1/default.css'));
                expect(dirDep).toContain(path.join(dirname, 'dep/a1_1/inc/title.css'));
                expect(dirDep.length).toBe(2);
                expect(dirDis).toEqual([]);
                expect(dirIns).toEqual([]);
                expect(dirPub).toEqual([]);
            });
            it('- 파일 경로 검사 : dep/a1/default.css ', () => {
                const fullPath = path.join(dirname, 'dep/a1/default.css');
                const data = fs.readFileSync(fullPath, "utf-8");
                
                expect(data).toMatch('../../dep/a1_1/inc/title.css');
            });
        });

        describe('< task : do_dist >', () => {
            beforeAll(() => {
                autoTask.do_dist();
            });
            it('- 폴더 파일들 검사 ', () => {
                const dirDep = getAllFiles(path.join(dirname,'dep'));
                const dirDis = getAllFiles(path.join(dirname,'dist'));
                const dirIns = getAllFiles(path.join(dirname,'install'));
                const dirPub = getAllFiles(path.join(dirname,'publish'));

                // expect(dirDep).toContain(path.join(dirname, 'dep/a1/default.css'));
                // expect(dirDep).toContain(path.join(dirname, 'dep/a1_1/inc/title.css'));
                // expect(dirDep.length).toBe(2);
                // expect(dirDis).toEqual([]);
                // expect(dirIns).toEqual([]);
                // expect(dirPub).toEqual([]);
            });
            it('- 파일 경로 검사 : dep/a1/default.css ', () => {
                // const fullPath = path.join(dirname, 'dep/a1/default.css');
                // const data = fs.readFileSync(fullPath, "utf-8");
                
                // expect(data).toMatch('../../dep/a1_1/inc/title.css');
            });
        });
        
    });

});