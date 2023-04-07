const path              = require('path');
const mm                = require('micromatch');
const { TargetSource }  = require('./target-source');
const at                = require('./auto-task');

/**
 * 인스톨맵 클래스
 */
class InstallMap {
    
    /*_______________________________________               */        
    // public
    isOverlap = false;

    /*_______________________________________*/        
    // protected
    _auto = null;
    // _task = at.AutoTask.getInstance();
    // _task = AutoTask.getInstance();
    _parent = null;
    _child = [];
    _setup = [];
    _merge = [];
    _rename = [];
    _except = [];
    _list = [];

    /*_______________________________________*/      
    // property  
    get targets() {
        let arr = [];

        for (let i = 0; i < this._child.length; i++) {
            arr = arr.concat(this._child[i].targets);
        }
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].isSave === true) arr.push(this._list[i]);
        }
        return arr;
    }    

    constructor(auto, json) {
        this._auto = auto;
        this._task = at.AutoTask.getInstance();
        // this._task = AutoTask.getInstance();
        if (json) this.#load(json);
    }

    /*_______________________________________*/        
    // public method

    // 객체 얻기
    getObject() {
        var obj = {};
        
        for (var prop in this) {
            if (['_setup', '_merge', '_except', '_global', '_rename', 'isOverlap'].indexOf(prop) > -1) {
                obj[prop.replace('_', '')] = this[prop];            
            }
        }
        return obj; 
    }

    /**
     * 타겟소스 추가
     * @param {TargetSource} target 
     */
    add(target) {
        this._list.push(target);
    }
    
    /**
     * 인스톨맵 초기화 : _parent, _child 설정
     */
    init() {
        const auto = this._auto;

        if (auto._owner && auto._owner.install instanceof InstallMap) {
            this._parent = auto._owner.install;     // 부모 InstallMap 연결
            auto._owner.install._child.push(this);  // 자식 InstallMap 등록
        }
    }

    /**
     * 인트롤맵 처리 : 세팅 >> 이름변경 >> 병합 >> 제외
     */
    execute() {
        if (this._setup.length > 0) this.#execSetup();
        if (this._rename.length > 0) this.#execRename();
        if (this._merge.length > 0) this.#execMerge();
        if (this._except.length > 0) this.#execExcept();
    }

    /*_______________________________________*/        
    // private method

    /**
     * json 객체를 통해 객체 가져오기 (생성시)
     * @param {JSON} json 
     */
    #load(json) {
        let obj;

        // setup obj
        if (json.setup && Array.isArray(json.setup)) {
            for (let i = 0; i < json.setup.length; i++) {
                if (typeof json.setup[i] === 'object' && typeof json.setup[i].glob === 'string') {
                    this._setup.push(json.setup[i]);
                }
            }
        }
        // merge obj
        if (json.merge && Array.isArray(json.merge)) {
            for (let i = 0; i < json.merge.length; i++) {
                if (typeof json.merge[i] === 'object' && Array.isArray(json.merge[i].paths) && typeof json.merge[i].path === 'string') {
                    this._merge.push(json.merge[i]);
                }
            }
        }
        // rename obj
        if (json.rename && Array.isArray(json.rename)) {
            for (let i = 0; i < json.rename.length; i++) {
                if (typeof json.rename[i] === 'object' && typeof json.rename[i].glob === 'string' && (typeof json.rename[i].path === 'string' || typeof json.rename[i].dir === 'string')) {
                    this._rename.push(json.rename[i]);
                }
            }
        }
        // except obj
        if (json.except && Array.isArray(json.except)) {
            for (let i = 0; i < json.except.length; i++) {
                if (typeof json.except[i] === 'string') this._except.push(json.except[i]);
            }
        }
    }

    /**
     * setup 실행
     */
    #execSetup() {
        let obj, tars = [], arr = [];

        for (let i = 0; i < this._setup.length; i++) {
            
            obj = this._setup[i];
            
            if (typeof obj.glob === 'string' && obj.glob.length > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), obj.glob);
            }
            if (arr.length > 0) {
                tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                
                if (obj.isExcept && typeof obj.isExcept === 'boolean') {
                    tars.map( (o) => { o.isExcept =  obj.isExcept; });
                }

                if (obj.referType && typeof obj.referType === 'number') {
                    tars.map( (o) => { o.referType =  obj.referType; });
                }

                if (obj.refedType && typeof obj.refedType === 'number') {
                    tars.map( (o) => { o.refedType =  obj.refedType; });
                }
            }
        }
    }

    /**
     * 이름변경 실행 
     *  - 단일 파일명 변경
     *  - 복수 경로 변경 (폴더)
     */
    #execRename() {
        let arr = [], obj, tars = [];
        let entry = this._task.entry;
        const batch = this._task.batch;
        let fullPath, subPath;

        for (let i = 0; i < this._rename.length; i++) {
            obj = this._rename[i];
            // 동시에 존재시 경고 후 처리 무시
            if (typeof obj.path === 'string' && typeof obj.dir === 'string') {
                console.warn('install.rename 객체에 path, dir 동시에 존재합니다. 하나만 사용하세요.');
                continue;
            }
            
            if (typeof obj.glob === 'string' && obj.glob.length > 0 && (obj.path || obj.dir)) {
                arr = mm.match(this.targets.map((o) => { return o.subPath }), obj.glob);
                // arr = mm.match( this.targetPaths, obj.glob);
            }
            
            if (arr.length > 0) {
                
                // tars = this._getTarget(arr);
                tars = this.targets.filter((o) => { return arr.indexOf(o.subPath) > -1 })
                
                // glob, path 처리
                if (typeof obj.path === 'string' && obj.path.length > 0) {
                    if (arr.length !== 1) {
                        console.warn('install.rename 객체에 path 는 glob 하나마 매칭되어야 합니다.' + arr);
                        continue;                    
                    }
                    // static 검사
                    if (tars[0]._original.isStatic === true) {
                        console.warn('static 파일은 이름은 변경할 수 없습니다.' + tars[0]._original.fullPath);
                        continue;                    
                    }
                    subPath = obj.path;
                    fullPath = tars[0].dir + path.sep + tars[0].location + path.sep + subPath;
                    // 중복검사
                    if (!batch.validPath(fullPath)) {
                        subPath = path.dirname(subPath) + path.sep + batch.newFileName(fullPath);
                        console.warn('[중복파일 이름재정의] ' + fullPath + ' >> ' + subPath)
                    }
                    tars[0].subPath = subPath;

                // glob, dir 처리
                } else if (typeof obj.dir === 'string' && obj.dir.length > 0) {

                    for (let i = 0; i < tars.length; i++) {
                        // static 검사
                        if (tars[i]._original.isStatic === true) {
                            console.warn('static 파일은 이름은 변경할 수 없습니다.' + tars[i]._original.fullPath);
                            continue;                    
                        }
                        if (tars[i].type === 10) {      // VirtualFolder
                            tars[i].subPath = obj.dir;
                        } else if (tars[i].type === 20 ||  tars[i].type === 30) {   // TextFile & NonTextFile
                            
                            subPath = obj.dir + path.sep + tars[i].name;
                            fullPath = tars[i].dir + path.sep + tars[i].location + path.sep + subPath;
                            // 중복검사
                            if (!batch.validPath(fullPath)) {
                                subPath = path.dirname(subPath) + path.sep + batch.newFileName(fullPath);
                                console.warn('[중복파일 이름재정의] ' + fullPath + ' >> ' + subPath)
                            }
                            tars[i].subPath = subPath;
                        }
                    }
                }
            }
        }
    }

    /**
     * 파일 머지는 특수한 경우이다. 타겟소스의 타입이 텍스트의 경우만 유효하다.
     */
    #execMerge() {
        let obj, arr = [], tars = [], newTar;
        const entry = this._task.entry;
        const batch = this._task.batch;

        for (let i = 0; i < this._merge.length; i++) {
            
            obj = this._merge[i];

            // 유효성 검사
            if (typeof Array.isArray(obj.paths) && obj.paths.length > 0 && typeof obj.path === 'string' && obj.path.length > 0) {
                obj.paths.forEach(v => {
                    if (typeof v === 'string' && v.length > 0) arr.push(v);
                });
            }
            if (arr.length > 0) {

                arr.forEach(v => {
                    let find = this.targets.find(vv => { return vv.subPath === v });
                    if (find) tars.push(find);
                });

                if (tars.length > 0) {
                    newTar = new TargetSource(entry.LOC.INS, null);
                    newTar.dir = entry.dir;
                    newTar.type = 30;
                    newTar.subPath = obj.path;
                    newTar.data  = '';
                    newTar.isMerge = true;

                    tars.forEach(v => {
                        if (v.type === 30) {
                            newTar.data += v._original.data + '\n'; // TODO:: 삭제해야함 isMerge = true
                            v.owner = newTar;
                            v.isSave = false;    
                        }
                    });
                    batch.add(newTar);
                }                
            }
        }
    }

    /**
     * install 시 제외 파일 설정
     */
    #execExcept() {
        let str, tars = [], arr = [];

        for (let i = 0; i < this._except.length; i++) {
            str = this._except[i];
            if (typeof str === 'string' && str.length  > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), str);

                if (arr.length > 0) {
                    tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                    tars.map( (o) => { o.isExcept = true; });
                }
            }
        }
    }
}


exports.InstallMap = InstallMap;
