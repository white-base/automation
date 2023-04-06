
/**
 * 오토에서 설정해야 맞을듯
 * this.task
 * 
 * 조건 : 엔트리별 오토 설정이 다르게 => 비교에서 엔트리만 설정함
 * package의 sring과 배열의 형태 참조
 * 
 */

class Auto {
    constructor() {
        this._task.batch.pathType // 이경우는 너무 길다.
        
        // auto 에 참조키 방식을 삽입, 엔트리만 유효하게
        // this.batch.  => 속성을 직접 접근하는 것은 않좋은 방법으로 사료됨
        
        /**
         * 상대경로, 엔트리경로
         * type :  0 = 자동, 1 = 상대, 2 = 엔트리 
         * 0, 2 의 경우 startDir
         */
        this.pathType = {
            type: 0,    // 기본 자동
            rootDir: '없을시 auto.dir',
            depend: {
                type: 1,
                rootDir: ''
            },
            dist: 1,    // 강제 상대경로
            install: {
                type: 2,
                rootDir: '',
                subDir: 'install'
            },
            publish: null,  // 사용유무?
        };

        // 모두 상대경로로 지정됨
        this.pathType = 1;
        // install 모두 엔트리 경로로 변경함
        this.pathType = {
            install: {
                type: 2,
                subDir: ''
            }
        }
        // 기본은 상대경로, dist 는 엔트리경로
        this.pathType = {
            type: 1,
            dist: 2
        }

        /**
         * pathType 위치별 정보
         * - auto.PathType : 오토에 설정된 기본값
         * - batch.pathType : 소스배치의 기본값
         * => 병합하여 
         */
    }
}

class SourceBatch  {
    constructor() {
        this.pathType = {
            type: 0,    // 기본 자동
            rootDir: null,  // '없을시 entry.dir'
            depend: 1,
            dist: 1,
            install: {
                subDir: 'install'
            },
            publish: 0,  // 사용유무?
        };
    }
}
var pathType = {
    type: 0,
    // 상대경로는 rootDir + subDir 조합으로 만듬
    rootDir: '',
    subDir: ''
}