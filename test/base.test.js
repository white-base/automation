const fs        = require('fs');
const path      = require('path');
let dirname     = path.join(__dirname, 'base');
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
            autoTask = AutoTask.create(path.join(dirname, 'e1'));
            autoTask.batch.pathType = 2; // 전체 상대경로 변경
            // dirname = path.join(dirname, 'e1');
        });
        it('- clear : 폴더 초기화 및 구조 검사 ', () => {
            autoTask.do_clear();

            const dirMod = path.join(dirname, 'e1');
            const dirDep = getAllFiles(path.join(dirMod,'dep'));
            const dirDis = getAllFiles(path.join(dirMod,'dist'));
            const dirIns = getAllFiles(path.join(dirMod,'install'));
            const dirPub = getAllFiles(path.join(dirMod,'publish'));
            
            expect(dirDep).toEqual([]);
            expect(dirDis).toEqual([]);
            expect(dirIns).toEqual([]);
            expect(dirPub).toEqual([]);
        });
        describe('< task : depend >', () => {
            beforeAll(() => {
                autoTask.do_depend();
            });
            it('- 파일 유무 검사 : e1 ', () => {
                const dirMod = path.join(dirname, 'e1');
                const dirDep = getAllFiles(path.join(dirMod,'dep'));
                const dirDis = getAllFiles(path.join(dirMod,'dist'));
                const dirIns = getAllFiles(path.join(dirMod,'install'));
                const dirPub = getAllFiles(path.join(dirMod,'publish'));
                const file1 = path.join(dirMod, 'dep', 'a1', 'default.css');
                const file2 = path.join(dirMod, 'dep', 'a1_1', 'inc', 'title.css');
                
                expect(dirDep).toContain(file2);
                expect(dirDep.length).toBe(2);
                expect(dirDis).toEqual([]);
                expect(dirIns).toEqual([]);
                expect(dirPub).toEqual([]);
            });
            it('- 파일 내용 검사 : dep/a1/default.css ', () => {
                const fullPath = path.join(dirname, 'e1', 'dep','a1','default.css');
                const data = fs.readFileSync(fullPath, "utf-8");
                
                expect(data).toMatch('../../dep/a1_1/inc/title.css');
            });
            it('- super 모듈 파일 검사 : m1 ', () =>{
                const dirMod = path.join(dirname, 'm1');
                const dirDep = getAllFiles(path.join(dirMod,'dep'));
                const dirDis = getAllFiles(path.join(dirMod,'dist'));
                const dirIns = getAllFiles(path.join(dirMod,'install'));
                const dirPub = getAllFiles(path.join(dirMod,'publish'));

                expect(dirDep).toEqual([]);
                expect(dirDis).toEqual([]);
                expect(dirIns).toEqual([]);
                expect(dirPub).toEqual([]);
            });
            it('- super 모듈 파일 검사 : m1_1 ', () =>{
                const dirMod = path.join(dirname, 'm1_1');
                const dirDep = getAllFiles(path.join(dirMod,'dep'));
                const dirDis = getAllFiles(path.join(dirMod,'dist'));
                const dirIns = getAllFiles(path.join(dirMod,'install'));
                const dirPub = getAllFiles(path.join(dirMod,'publish'));

                expect(dirDep).toEqual([]);
                expect(dirDis).toEqual([]);
                expect(dirIns).toEqual([]);
                expect(dirPub).toEqual([]);
            });
        });

        describe('< task : do_dist >', () => {
            beforeAll(() => {
                autoTask.do_dist();
            });
            it('- 파일 유무 검사 : e1 ', () => {
                const dirDis = getAllFiles(path.join(dirname, 'e1', 'dist'));
                const file1 = path.join(dirname, 'e1', 'dist', 'css', 'index.css');
                const file2 = path.join(dirname, 'e1', 'dist', 'index.htm');
                const file3 = path.join(dirname, 'e1', 'dist', 'img.webp');
                
                expect(dirDis).toContain(file1);
                expect(dirDis).toContain(file2);
                expect(dirDis).toContain(file3);
                expect(dirDis.length).toBe(3);
            });
            it('- 파일 내용 검사 : dist/index.htm ', () => {
                const fullPath = path.join(dirname, 'e1', 'dist', 'index.htm');
                const data = fs.readFileSync(fullPath, 'utf-8');
                
                expect(data).toMatch('절대: /src/index.css');
                expect(data).toMatch('상대: css/index.css');
                expect(data).toMatch('절대 ../out/css/core.css');
                expect(data).toMatch('상대: ../out/css/core.css');
                expect(data).toMatch('절대: ../../m1/dist/e1.a1/default.css');
                expect(data).toMatch('상대: ../../m1/dist/e1.a1/default.css');
                expect(data).toMatch('절대: ../../m1_1/dist/m1.a1_1/inc/title.css');
                expect(data).toMatch('상대: ../../m1_1/dist/m1.a1_1/inc/title.css');
            });
            it('- 파일 내용 검사 : dist/css/index.css ', () => {
                const fullPath = path.join(dirname, 'e1', 'dist', 'css', 'index.css');
                const data = fs.readFileSync(fullPath, 'utf-8');

                expect(data).toMatch('url("../../out/css/core.css")');
            });
            describe('< 하위 dist 검사 >', () => {
                it('- 파일 유무 검사 : m1 ', () => {
                    const dirDis = getAllFiles(path.join(dirname, 'm1', 'dist'));
                    const file1 = path.join(dirname, 'm1', 'dist', 'e1.a1', 'default.css');
                    
                    expect(dirDis).toContain(file1);
                    expect(dirDis.length).toBe(1);
                });
                it('- 파일 내용 검사 : dist/e1-a1/default.css ', () => {
                    const fullPath = path.join(dirname, 'm1', 'dist', 'e1.a1', 'default.css');
                    const data = fs.readFileSync(fullPath, 'utf-8');
                    
                    expect(data).toMatch('url("../../../m1_1/dist/m1.a1_1/inc/title.css")');
                });
                it('- 파일 유무 검사 : m1_1 ', () => {
                    const dirDis = getAllFiles(path.join(dirname, 'm1_1', 'dist'));
                    const file1 = path.join(dirname, 'm1_1', 'dist', 'm1.a1_1', 'inc', 'title.css');
                    
                    expect(dirDis).toContain(file1);
                    expect(dirDis.length).toBe(1);
                });
            });

        });
        
    });

});