const path              = require('path');
const fs                = require('fs');
const { TextFile }      = require('./original-path');
const { TargetSource }  = require('./target-source');

/**
 * 소스배치 클래스
 */
class SourceBatch {
    /*_______________________________________*/        
    // public
    // pathType = 0;       // (0:자동, 1:절대, 2:상대)
    dupType = 1;        // (0:하위참조, 1:중복제거, 2:중복허용)
    isAlias = false;    // 설치시 별칭 포함 여부
    isRoot = true;
    
    /*_______________________________________*/        
    // protected
    static _instance = null;
    _batchFile = [];
    //_filter = [];
    _task = null;
    //_map = [];
    
    /*_______________________________________*/        
    // private
    _list = [];
    #pathType = {
        type: 0,    // 0: 자동, 1: 절대, 2: 상대
        root: 1,    // 0=최상위(절대경로), 1=엔트리, 2=로컬
        dep: { type: 2 },
        dist: { type: 2 },
        install: { root: 2 },
        publish: {},  // 사용유무?
    };

    /*_______________________________________*/        
    // property
    get pathType() {    // (0:자동, 1:절대, 2:상대)
        const entry = this._task.entry;
        return {
            // 기본경로
            type: entry.pathType.type || this.#pathType.type,
            root: entry.pathType.root || this.#pathType.root || entry.dir,
            // 폴더별 경로
            dep: {
                type: entry.pathType.dep?.type || this.#pathType.dep?.type,
                root: entry.pathType.dep?.root || this.#pathType.dep?.root,
            },
            dist: {
                type: entry.pathType.dist?.type || this.#pathType.dist?.type,
                root: entry.pathType.dist?.root || this.#pathType.dist?.root,
            },
            install: {
                type: entry.pathType.install?.type || this.#pathType.install?.type,
                root: entry.pathType.install?.root || this.#pathType.install?.root,
            },
            publish: {
                type: entry.pathType.publish?.type || this.#pathType.publish?.type,
                root: entry.pathType.publish?.root || this.#pathType.publish?.root,
            }
        };
    }
    set pathType(val) {
        if (typeof val === 'number') return this.#pathType.type = val;
        if (typeof val.type === 'number') this.#pathType.type = val;
        if (typeof val.root === 'string') this.#pathType.root = val.root;
        
        if (typeof val.dep === 'object') {
            if (typeof val.dep.type === 'number') this.#pathType.dep.type = val;
            if (typeof val.dep.root === 'string') this.#pathType.dep.root = val.dep.root;
        } else if (typeof val.dep === 'number') this.#pathType.dep.type = val.dep;
        
        if (typeof val.dist === 'object') {
            if (typeof val.dist.type === 'number') this.#pathType.dist.type = val;
            if (typeof val.dist.root === 'string') this.#pathType.dist.root = val.dist.root;
        } else if (typeof val.dist === 'number') this.#pathType.dist.type = val.dist;
        
        if (typeof val.install === 'object') {
            if (typeof val.dinstallep.type === 'number') this.#pathType.install.type = val;
            if (typeof val.install.root === 'string') this.#pathType.install.root = val.install.root;
        } else if (typeof val.install === 'number') this.#pathType.install.type = val.install;
        
        if (typeof val.publish === 'object') {
            if (typeof val.publish.type === 'number') this.#pathType.publish.type = val;
            if (typeof val.publish.root === 'string') this.#pathType.publish.root = val.publish.root;
        } else if (typeof val.publish === 'number') this.#pathType.publish.type = val.publish;
    }

    /*_______________________________________*/        
    // public method

    constructor() {
    }


    /**
     * TODO:: 제거 검토
     * @returns {this}
     */
    static getInstance() {  
        if (this._instance === null) {
            this._instance = new this();
        }
        return this._instance;
    }

    /**
     * 배치할 소스 추가 (컬렉션)
     * @param {*} collection SourceCollection 
     * @param {*} location 배치 위치 
     * @param {*} isSave 저장 유무
     */
    addCollection(collection, location) {

        let ori, tar;        
        // TODO:: 타입 검사
        for(let i = 0; i < collection.count; i++) {
            ori = collection[i];
            tar = new TargetSource(location, ori);
            ori._setTarget(tar);    // _target 설정
            this._list.push(tar);
        }
    }
    
    /**
     * 배칠할 소스 추가  (단일)
     * @param {*} tar 
     */
    add(tar) {
        if (tar instanceof TargetSource) this._list.push(tar);
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {
        let autos;

        function getMergeData(tar, isRoot) {
            let data = '';
            // 자식 순환 조회
            for (let i = 0; i < tar._owned.length; i++) {
                if (tar._owned[i].isMerge === true) data += getMergeData(tar._owned[i], isRoot) + '\n';
                data += tar._owned[i].setData(isRoot) + '\n';
            }
            return data;
        }

        // 이벤트 발생
        this._task._onSave();
        // install map 처리
        autos = this._task.entry._getAllList(true);
        
        if (this._task.cursor === 'INSTALL') {
            // 중복제거 처리
            this.#deduplication(this.dupType);
            // 단일오토 별칭 경로 제거
            if (this.isAlias === false) this.#removeAlias();
            // 맨 하위부터 처리한다.
            for (let i = 0; i < autos.length; i++) {
                // 초기화 : parent, child
                autos[i].install.init();
                // 인스톨 설정 처리
                // autos[i].install.execute();
            }

            for (let i = 0; i < autos.length; i++) {
                // 초기화 : parent, child
                // autos[i].install.init();
                // 인스톨 설정 처리
                autos[i].install.execute();
            }
        }

        for (let i = 0; i < this._list.length; i++) {
            // TextFile 일 경우 콘텐츠 설정
            if (this._list[i]._original instanceof TextFile) {
                this._list[i].setData(this.isRoot);
            }
            // 병합 파일 처리
            if (this._list[i].isMerge === true)  {
                this._list[i].data = getMergeData(this._list[i], this.isRoot);
            }
        }
        // 타겟 저장
        this.#saveFile();
        // 이벤트 발생
        this._task._onSaved();
    }

    /**
     * 배치파일저장소 파일 및 배치생성파일 삭제
     */
    clear() {
        const batchfile = this._task.entry.dir +path.sep+ '__SaveFile.json';
        let fullPath;

        for (let i = 0; i < this._batchFile.length; i++) {
            fullPath = this._batchFile[i];
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        if (fs.existsSync(batchfile)) fs.unlinkSync(batchfile);
        
        // 속성 초기화
        this.isRoot = true;
        this._batchFile = [];
        this._list = [];
    }

    /**
     * 배치파일 목록 얻기
     * @returns {array}
     */
    getBatchList() {
        let rArr = [];

        for (let i = 0; i < this._list.length; i++) {
            rArr.push(
                {
                    ori: this._list[i]._original.fullPath,
                    tar: this._list[i].fullPath
                }
            );
        }
        return rArr;
    }

    
    /**
     * 경로 검사
     * @param {string} fullPath 
     * @returns {*}
     */
    validPath(fullPath) {
        for(let i = 0; i < this._list.length; i++)  {
            if (this._list[i].fullPath === fullPath) return false;
        }
        return true;
    }

    /**
     * 파일경로 중복발생시 새파일이름,이름_숫자
     * @param {string} fullPath 
     * @returns {*}
     */
    newFileName(fullPath) {
        let obj, filename;
        let delimiter = '_'; 

        obj = path.parse(fullPath);

        for(let i = 1; i < 100; i++)  { // 100개로 제한
            filename = obj.name + delimiter + i + obj.ext;
            if (this.validPath(obj.dir + path.sep + filename)) return filename;
        }
        console.warn('[실패 newFileName()] ' + fullPath );
        return obj.name;    // 원래 이름 리턴
    }

    getPathInfo(location) {
        const entry = this._task.entry;
        let type, dir, root = '';

        root = this.pathType[location].root || this.pathType.root;
        type = this.pathType[location].type || this.pathType.type;
        if (root === 1) dir = entry.dir;
        else if (root === 2) dir = path.join(entry.dir, location);
        return {
            type: type,
            root: root,
            dir: dir
        };
    }

    /*_______________________________________*/        
    // private method

    /**
     * 배치파일 저장
     */
     #saveFile() {
        let isExists, dirname, fullPath, data, orignal, type, target;
        const _this = this;
        // TODO:: try 로 예외 처리함
        for (let i = 0; i < this._list.length; i++) {
            target = this._list[i];
            if (target.isSave === true && target.isExcept === false) {
                type = target.type;
                orignal = target._original;
                // 텍스트 파일의 경우
                if (type === 30) {
                    fullPath = target.fullPath;
                    data = target.data;
                    dirname = path.dirname(fullPath);   
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} );  // 디렉토리 만들기
                    }
                    fs.writeFileSync(fullPath, data, 'utf8');       
                    this.#addBatchFile(fullPath);  // 배치 로그 등록
                
                    // 비텍스트 파일의 경우
                } else if (type === 20) {
                    fullPath = target.fullPath;
                    dirname = path.dirname(fullPath);
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} ); // 디렉토리 만들기
                    }
                    // 복사
                    fs.copyFileSync(orignal.fullPath, fullPath)
                    this.#addBatchFile(fullPath);   

                // (가상) 폴더의 경우
                } else if (type === 30) {
                    fullPath = target.fullPath;
                    isExists = fs.existsSync(fullPath);
                    if(!isExists) {
                        fs.mkdirSync(fullPath, {recursive: true} ); // 디렉토리 만들기
                    }
                }
            }
        }
        // 배치 로그 저장
        this.#saveBatchFile();
    }

    /**
     * 배치파일저장소 저장
     */
    #saveBatchFile() {
        // batchFile
        let data = JSON.stringify(this._batchFile, null, '\t');
        fs.writeFileSync(this._task.entry.dir +path.sep+ '__SaveFile.json', data, 'utf8');   
    }

    /**
     * 배치파일저장소에 저장파일 로그 추가
     * @param {str} savePath 
     */
    #addBatchFile(savePath) {
        if (this._batchFile.indexOf(savePath) < 0) this._batchFile.push(savePath);
        if (this._task?.isLog) console.log('SAVE : ' + savePath);
    }

    /**
     * 중복된 타겟소스를 제거후 별칭 경로를 제거한다.
     * @param {number} depType 0 자동, 1 전체중복제거, 2 전체중복허용
     * 방법1. for 중복 오토를 찾은 후, for 대상타겟 갯수만큼, 비교해서 같으면 합침 [추천]
     * 방법2. for 유일한 파일 목록을 추출후, for 중복되는 타겟를 찾음
     */
     #deduplication(depType) {
        // TODO:: isStatic 처리는 어디서??
        const all = this._task.entry._getAllList(true);
        let list = [];
        let dupAuto = [];
        let dupTar;
        let newTar;
        let _this = this;
        // let arrTarget = [];

        if (depType === 1) {
            list = all;
        } else if (depType === 0) {
            all.forEach( v, i => { 
                if (v.install.isOverlap === false) list.push(v);
            });
        } else return;

        // 중복 auto 조회
        list.forEach((v, i) => {
            if (list.some((vv, ii) => {
                return i !== ii && v instanceof vv.constructor && !dupAuto.find( vvv => {
                    return vvv.name === v.name; // REVIEW:: 인스턴스타입으로 변경 필요 검토 ??
                });
            })) dupAuto.push(v);    // 중복된 auto 삽입
        });

        dupAuto.forEach(auto => {
            this._list.forEach(tar => {
                // 대상 찾기
                if (tar._original._auto === auto) {
                    dupTar = [];    // 초기화
                    this._list.forEach(dup => {
                        // 대상과 원본경로가 같은 소스 찾기
                        if (tar !== dup && dup._original.fullPath === tar._original.fullPath) {
                            // 텍스트가 아니거나 텍스트이면서 data 가 같은 경우 
                            if (tar.type !== 30 || (tar.type === 30 && tar.data === dup.data)) {
                                dupTar.push(dup);
                            }
                        }
                    });

                    // 중복이 있는 경우
                    if (dupTar.length > 0) {
                        newTar = tar.clone();
                        newTar.subPath = auto.modName + path.sep + tar._original.subPath;    // set 에 설정
                        _this.add(newTar);
                        // 부모 변경
                        tar.owner = newTar;
                        tar.isSave = false;
                        dupTar.forEach(val => { 
                            val.owner = newTar;
                            val.isSave = false;
                        });
                    }
                }
            });
        });
    }

    /**
     * 경로 및 파일 중복 제거시, 모듈명 + 별칭 >> 모듈명으로 변경
     */
    #removeAlias() {
        const all = this._task.entry._getAllList(false); // entry 는 별칭이 없으므로
        let dupAuto = [], singleAuto = [];
        let sigleTar = [];
        
        // 중복 오토 조회
        all.forEach((v, i) => {
            if (all.some((vv, ii) => {
                return i !== ii && v instanceof vv.constructor && !dupAuto.find( vvv => {
                    return vvv.name === v.name;
                });
            })) dupAuto.push(v);        // 중복된 auto 삽입
        });
        
        // 단일 오토 조회
        all.forEach( v => {
            if (dupAuto.some( vv => {
                return !(v instanceof vv.constructor);
            })) singleAuto.push(v);    // 단일 auto 삽입
        });

        singleAuto.forEach(auto => {
            this._list.forEach(tar => {
                // 대상 찾기
                if (tar._original._auto === auto) {
                    tar.subPath  = auto.modName + path.sep + tar._original.subPath;
                }
            });
        });
        // console.log(1)
    }
}

exports.SourceBatch = SourceBatch;