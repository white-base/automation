const { NonTextFile, TextFile, VirtualFolder, OriginalPath } = require('./original-path');
const path              = require('path');
const { SourceBatch }   = require('./source-batch');
const sb                = require('./source-batch');
/**
 * 대상소스 클래스
 */
class TargetSource {
        
    /*_______________________________________*/
    // public
    isSave      = true;     // 저장유무, 활성화 상태
    isExcept    = false;    // save 시점에 제외 여부
    isMerge     = false;    // 병합 여부
    referType   = 0;        // 참조하는 타입
    refedType   = 0;        // 참조되어지는 타입
    type        = 0;        // 소스타입
    data        = null;
    
    /*_______________________________________*/
    // protected
    _original   = null;
    _owner      = null;
    _owned      = [];
    _batch      = sb.SourceBatch.getInstance();

    /*_______________________________________*/
    // private
    #dir        = null;
    #location   = null;
    #fullPath   = null;

    /*_______________________________________*/
    // property
    get fullPath() {
        // return this.#fullPath;
        return this._owner === null ? this.#fullPath : this._owner.fullPath;
    }
    get dir() {
        // return this.#dir;
        return this._owner === null ? this.#dir : this._owner.dir;
    }
    set dir(val) {
        // this.#dir = val;
        if (this._owner === null) this.#dir = val;
        else this._owner.dir = val;
    }
    get location() {
        // return this.#location;
        return this._owner === null ? this.#location : this._owner.location;
    }
    get name() {
        return path.basename(this.fullPath);
    }
    get subDir() {
        return path.dirname(this.subPath);
    }
    get subPath() {
        return path.relative(this.dir + path.sep + this.location, this.fullPath);
    }
    set subPath(val) {
        // this.#fullPath = this.dir + path.sep + this.location + path.sep + val;
        if (this._owner === null) this.#fullPath = this.#dir + path.sep + this.#location + path.sep + val;
        else this._owner.subPath = val;
    }
    get localDir() {
        return path.dirname(this.localPath);
    }
    get localPath() {
        return path.relative(this.dir, this.fullPath);
    }
    set owner(val) {
        this._owner = val;      // 소유자
        val._owned.push(this);  // 사용된곳 설정
    }
    get owner() {
        return this._owner;
    }

    /**
     * 
     * @param {*} location 
     * @param {*} ori?  선택사항 
     */
    constructor(location, ori) {
        
        let entry = this._batch._task.entry;
        let auto  = null;

        this.#location = location;
        
        if (ori instanceof OriginalPath) {
            this._original = ori;    
            auto = ori._auto;
            this.#setType(ori);
            this.#initPath();
            if (location === entry.LOC.INS) auto.install.add(this);
        }
    }

    /*_______________________________________*/        
    // public method

    /**
     * 소스 내용(data) 설정
     * @param {*} isRoot 절대경로시 location 경로 포함 여부 (install 시점)
     */
    setData(isRoot = true) {
        
        let ori, data, arrObj = [], list, change, refSrc, localDir;
        let dir, entry;
        let type, absolute, relative;

        ori = this._original;
        data = ori.data;
        arrObj = []; // 초기화
        entry = this._batch._task.entry;

        
        for (let ii = 0; ii < ori._dep.length; ii++) {

            // _dep 객체에 pos 가 존재할 경우만 처리 !!
            if (typeof ori._dep[ii].pos !== 'object') continue;

            refSrc = ori._dep[ii].ref;
            // 1) 타겟소스가 없을 경우
            if (refSrc._target === null || refSrc._target.fullPath === null) {
                
                dir = path.dirname(this.fullPath);  
                relative = path.relative(dir, refSrc.fullPath); // 상대경로 (오토기준)

                if (entry === refSrc._auto) {
                    absolute = path.sep + refSrc.localPath;
                } else {    // 하위의 경우
                    if (this._batch.pathType !==2 && refSrc.dir.indexOf(entry.dir) < 0) { // 앤트리 하위 여부 검사
                        throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                    }
                    localDir = path.relative(entry.dir, refSrc.dir);
                    absolute = path.sep + localDir + path.sep + refSrc.localPath;
                }
            
            // 2) 타겟소스가 있을 경우
            } else {
                
                dir = path.dirname(this.fullPath);
                relative = path.relative(dir, refSrc._target.fullPath);       
               
                if (entry === refSrc._auto) {   // 엔트리의 경우
                    if (isRoot) absolute = path.sep + refSrc._target.localPath;     // root 기준 절대경로
                    else absolute = path.sep + refSrc._target.subPath;              // location 기준 절대경로       
                } else {                        // 엔트리 외(하위)의 경우
                    // 앤트리 하위 여부 검사
                    if (this._batch.pathType !==2 && refSrc._target.dir.indexOf(entry.dir) < 0) {
                        throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                    }
                    localDir = path.relative(entry.dir, refSrc._target.dir);
                    if (localDir.length > 0) {
                        absolute = path.sep + localDir + path.sep + refSrc._target.localPath;    
                    } else {    // 'install', 'depend' 의 경우
                        if (isRoot) absolute = path.sep + refSrc._target.localPath;
                        else absolute = path.sep + refSrc._target.subPath;
                    }
                }             
            }

            for (let iii = 0; iii < ori._dep[ii].pos.length; iii++) {
                list = ori._dep[ii].pos[iii];
                
                // 경로 설정
                if (this._batch.pathType === 0 ) {
                    // type = this.pathType === 0 ? list.type : this.pathType;
                    if (this.referType === 0) {
                        if (ori._dep[ii].ref._target.refedType === 0) {
                            // pos 에서 파싱된 타입 설정
                            type = list.type;
                        } else {
                            // 참조된 대상을 타입 설정
                            type = ori._dep[ii].ref._target.refedType;
                        }
                    } else {
                        // 대상 파일의 참조 타입 설정
                        type = this.referType;
                    }
                } else {
                    // 전체 경로 타입 설정
                    type = this._batch.pathType;    
                }
                
                if (type === 1) change = absolute;
                else change = relative; // 기본상대경로
                // else if (type === 2) change = relative;

                arrObj.push({
                    idx: list.idx,
                    txt: list.key,
                    rep: change,
                });
            }
        }
        // 파일내용 저장
        this.#replaceData(data, arrObj);
        return this.data;
    }

    /**
     * 타겟소스 복제본 리턴
     * @returns {this}
     */
    clone() {
        
        let obj = new TargetSource(this.location, this._original);
        
        obj.isSave      = this.isSave;
        obj.isExcept    = this.isExcept;
        obj.referType   = this.referType;
        obj.refedType   = this.refedType;
        obj.data        = this.data;
        obj._original   = this._original;
        obj._owner      = this._owner;
        obj._owned      = this._owned.map( (val) => {return val } );
        obj._owned      = this._owned;
        obj._batch      = this._batch;
        obj.subPath     = this.subPath;

        return obj;
    }

    /*_______________________________________*/        
    // private method

    /**
     * fullPath, dir 속성을 설정한다.
     */
     #initPath() {

        let auto, src, useAuto, entry, alias, fullPath;
        let location;
        // const AutoTask = require('./auto-task');
        entry = this._batch._task.entry;
        

        src = this._original;
        auto = src._auto;
        location = this.location;

        if (location == entry.LOC.DIS) {
            if (entry === src._auto) {
                fullPath = auto.dir + path.sep + entry.LOC.DIS + path.sep + src.subPath;
                
            } else {    // 하위 오토의 경우
                useAuto = auto._owner;
                alias = useAuto.modName +'.'+ auto.alias;
                fullPath = auto.dir + path.sep + entry.LOC.DIS + path.sep + alias + path.sep + src.subPath;
            }
            this.#dir = auto.dir;
            this.#fullPath = fullPath;
        
        } else if (location == entry.LOC.DEP) {
            alias = auto.alias;
            fullPath = entry.dir + path.sep + entry.LOC.DEP + path.sep + alias + path.sep + src.subPath;
            this.#dir = entry.dir;
            this.#fullPath = fullPath;
        
        } else if (location == entry.LOC.INS) {
            alias = auto.alias ? auto.modName + path.sep + auto.alias : auto.modName;
            fullPath = entry.dir + path.sep + entry.LOC.INS + path.sep + alias + path.sep + src.subPath;
            this.#dir = entry.dir;
            this.#fullPath = fullPath;          
        }
    }    

    /**
     * 타입 설정
     * @param {OriginalPath} ori 
     * @returns {*}
     */
    #setType(ori) {
        
        let type = 0;
        
        if (ori instanceof VirtualFolder) this.type = 10;
        if (ori instanceof NonTextFile) this.type = 20;
        if (ori instanceof TextFile) this.type = 30;
        
        return type;
    } 

    /**
     * 파일내용(data) 을 배열에 맞게 교체한다.
     * @param {*} data 
     * @param {*} arrObj 
     */
    #replaceData(data, arrObj) {
        // replace
        var obj;
        var base_idx = 0, idx = 0;
        var ori_data = data;
        var ori_prev = '', ori_next = '';

        // 배열 정렬
        arrObj.sort(function (a,b) {
            if (a.idx > b.idx) return 1;
            if (a.idx === b.idx) return 0;
            if (a.idx < b.idx) return -1;
        });

        for(var i = 0; i < arrObj.length; i++) {
            obj = arrObj[i];
            // rep 문자열검사
            // txt 문자열 1 이상 
            // idx > 
            if (typeof obj.idx !== 'number' || typeof obj.txt !== 'string') {
                console.warn('객체아님');
                continue;
            }
            idx = obj.idx + base_idx;                                   // 시작 인텍스
            if (ori_data.substr(idx, obj.txt.length) === obj.txt) {     // 검사
                ori_prev = ori_data.slice(0, idx);                      // 앞 문자열
                ori_next = ori_data.slice(idx + obj.txt.length);        // 뒤 문자열
                ori_data = ori_prev + obj.rep + ori_next;
                base_idx = base_idx + obj.rep.length - obj.txt.length;
            } else {
                console.warn('실패 '+ obj);
            }
        }
        this.data = ori_data;
    }
}

exports.TargetSource = TargetSource;
