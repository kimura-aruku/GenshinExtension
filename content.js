document.addEventListener('DOMContentLoaded', () => {
    // Chrome拡張の要素ID（config.jsから取得）
    const MY_ID = EXTENSION_CONFIG.ELEMENT_ID;
    
    // オリジナルページの要素セレクタ（クラス名変更時はここを修正）
    const SELECTORS = Object.freeze({
        // 基本情報・ステータス関連
        BASIC_INFO: '.basic-info',
        FINAL_TEXT: '.final-text',
        
        // 聖遺物関連
        ARTIFACT_INFO: '.artifact-info',
        ARTIFACT_INFO_HEADER: '.artifact-info header',
        RELIC_LIST: '.relic-list',
        ARTIFACT_SUB_PROP: '.artifact-sub-prop',
        
        // 追加ステータス関連
        SUB_PROPS: '.sub-props',
        SUB_PROPS_PROP_LIST: '.sub-props .prop-list',
        PROP_LIST: '.prop-list',
        
        // その他
        SPLIT: '.split'
    });

    // 聖遺物親要素
    /** @type {HTMLElement | null} */
    let relicListElement;

    // 追加ステータス親要素
    /** @type {HTMLElement | null} */
    let subPropListElement;

    // 追加ステータス一覧
    /** @type {string[]} */
    let subPropNames = [];

    // キャラの基本情報要素
    /** @type {HTMLElement | null} */
    let basicInfoElement;

    // スタイル管理インスタンス（style-manager.jsから読み込み）
    const styleManager = new StyleManager();

    /**
     * DOM監視・検知管理クラス
     * MutationObserver関連の機能を統合管理
     */
    class ObserverManager {
        constructor() {
            // 追加ステータス要素の監視オブジェクト
            this.subPropsObserver = null;
            // 基本情報要素の監視オブジェクト
            this.basicInfoObserver = null;
            
            // 監視設定
            this.observerConfig = Object.freeze({
                childList: true,
                attributes: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: false,
                attributeOldValue: false,
            });
        }

        /**
         * 要素が見つかるまで待機する
         * @param {string} selector - セレクタ文字列
         * @returns {Promise<HTMLElement>} 見つかった要素
         */
        waitForElement(selector) {
            return new Promise((resolve, reject) => {
                // 既に存在するならそのまま返す
                const existingElement = document.querySelector(selector);
                if (existingElement) {
                    resolve(existingElement);
                    return;
                }

                const observer = new MutationObserver((mutationsList, observer) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        observer.disconnect();
                        resolve(element);
                    }
                });
                
                // DOMの変更を監視
                observer.observe(document.body, { 
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                // タイムアウトの設定
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(chrome.i18n.getMessage('errorTimeout', selector)));
                }, EXTENSION_CONFIG.WAIT_TIMEOUT);
            });
        }

        /**
         * 監視コールバック
         * @param {MutationRecord[]} mutationsList - 変更リスト
         * @param {MutationObserver} observer - 監視オブジェクト
         */
        handleMutations(mutationsList, observer) {
            for (let mutation of mutationsList) {
                // 自分の要素の変更は無視
                if (mutation.target.id === MY_ID) {
                    continue;
                }
                
                // 追加ステータス要素の監視
                if (observer === this.subPropsObserver && 
                    (mutation.type === 'childList' || mutation.type === 'attributes')) {
                    reDraw();
                    return;
                }
                
                // キャラクター基本情報の監視
                if (observer === this.basicInfoObserver && 
                    mutation.type === 'attributes') {
                    reDraw();
                    return;
                }
            }
        }

        /**
         * 監視を開始する
         * @param {HTMLElement} subPropElement - 追加ステータス要素
         * @param {HTMLElement} basicInfoElement - 基本情報要素
         */
        startObserving(subPropElement, basicInfoElement) {
            // 既存の監視を停止
            this.stopObserving();
            
            // 追加ステータス要素の監視
            if (subPropElement) {
                this.subPropsObserver = new MutationObserver(
                    (mutations, observer) => this.handleMutations(mutations, observer)
                );
                this.subPropsObserver.observe(subPropElement, this.observerConfig);
            }
            
            // 基本情報要素の監視
            if (basicInfoElement) {
                this.basicInfoObserver = new MutationObserver(
                    (mutations, observer) => this.handleMutations(mutations, observer)
                );
                this.basicInfoObserver.observe(basicInfoElement, this.observerConfig);
            }
        }

        /**
         * 全ての監視を停止する
         */
        stopObserving() {
            if (this.subPropsObserver) {
                this.subPropsObserver.disconnect();
                this.subPropsObserver = null;
            }
            if (this.basicInfoObserver) {
                this.basicInfoObserver.disconnect();
                this.basicInfoObserver = null;
            }
        }

        /**
         * 追加ステータス監視を再開する
         * @param {HTMLElement} subPropElement - 追加ステータス要素
         */
        restartSubPropsObserving(subPropElement) {
            if (this.subPropsObserver) {
                this.subPropsObserver.disconnect();
            }
            if (subPropElement) {
                this.subPropsObserver = new MutationObserver(
                    (mutations, observer) => this.handleMutations(mutations, observer)
                );
                this.subPropsObserver.observe(subPropElement, this.observerConfig);
            }
        }

        /**
         * 基本情報監視を再開する
         * @param {HTMLElement} basicInfoElement - 基本情報要素
         */
        restartBasicInfoObserving(basicInfoElement) {
            if (this.basicInfoObserver) {
                this.basicInfoObserver.disconnect();
            }
            if (basicInfoElement) {
                this.basicInfoObserver = new MutationObserver(
                    (mutations, observer) => this.handleMutations(mutations, observer)
                );
                this.basicInfoObserver.observe(basicInfoElement, this.observerConfig);
            }
        }
    }

    // 監視管理インスタンス
    const observerManager = new ObserverManager();

    // 要素が画面に表示されている
    function isElementVisible(element) {
        if (!element) {
            return false;
        }
        // 画面内に収まっているかチェック
        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
        // offsetWidth / offsetHeight で要素のサイズがゼロでないかチェック
        const hasDimensions = element.offsetWidth > 0 && element.offsetHeight > 0;
        // CSSの display と visibility プロパティをチェック
        const style = window.getComputedStyle(element);
        const isVisibleInCSS = style.display !== 'none' && style.visibility !== 'hidden';
        // すべての条件が満たされる場合に表示されていると判断
        return isInViewport && hasDimensions && isVisibleInCSS;
    }

    // 追加ステータスのキャッシュ
    function cacheSubPropNames(){
        const propItemElements = subPropListElement.querySelectorAll('.prop-item');
        subPropNames = Array.from(propItemElements).map(element => {
            const childText = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') // テキストノードかつ空白ではない
                .map(node => node.textContent.trim());
            let textContent;
            // childTextが空であれば、textContentを使ってテキストを取得
            if (childText.length === 0) {
                textContent = element.textContent.trim();
            }else{
                textContent = childText.map(node => node.textContent).join('');
            }
            return textContent || '';
        });
    }

    // テキストノードを取得
    function getTextNodes(element) {
        let textNodes = [];
        // 子要素を再帰的に探索
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = node.textContent ? node.textContent.trim().replace(/\n/g, "") : "";
                // 空白 & 数値のみを除外
                if (text && !/^\d+$/.test(text)) { 
                    textNodes.push(node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 要素ノードの場合は再帰的に子要素を探索
                textNodes = textNodes.concat(getTextNodes(node));
            }
        });
        return textNodes;
    }

    // スコアを計算し返す
    function calculateScore(index){
        // 花、羽、砂、杯、冠
        const relicElements = relicListElement.querySelectorAll('.relic-item');
        // 上記のいずれか
        const relicElement = relicElements[index];
        // 聖遺物1つあたりが持つサブステータス要素すべて
        const subPropElements = relicElement.querySelectorAll(SELECTORS.ARTIFACT_SUB_PROP);
        let score = 0;
        subPropElements.forEach(subPropElement => {
            // テキストノードを取得
            const textNodes = getTextNodes(subPropElement);
            // 2つの文字列を取得
            let subPropName, subPropValue;
            if (textNodes.length === 2) {
                const text1 = textNodes[0].textContent.trim();
                const text2 = textNodes[1].textContent.trim();
                // 数値を含む文字列をそれぞれ取得
                if (/\d/.test(text1)) {
                    subPropValue = text1;
                    subPropName = text2;
                } else {
                    subPropValue = text2;
                    subPropName = text1;
                }
                score += Number(getScore(subPropName, subPropValue));
            }
        });
        return Math.floor(score * 100) / 100;
    }



    // スコアにして返す（config.jsの定数を使用）
    function getScore(subPropName, subPropValue){
        // 実数かパーセントか判断できない状態
        const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
            .includes(subPropName);
        if(isRealOrPercent && subPropValue.includes('%')){
            subPropName += 'パーセンテージ';
        }
        subPropValue = subPropValue.replace(/[%+]/g, '').trim();
        // スコアにならないステータス
        if (!subPropNames.includes(subPropName)) {
            return 0;
        }
        switch (subPropName) {
            // 実数はスコア0
            case PROP_NAME.HP:
            case PROP_NAME.ATK:
            case PROP_NAME.DEF:
                return SCORE_MULTIPLIERS.REAL_STATS;
            // 会心ダメージ
            case PROP_NAME.CRIT_DMG:
                return subPropValue * SCORE_MULTIPLIERS.CRIT_DMG;
            // 会心率
            case PROP_NAME.CRIT_RATE:
                return subPropValue * SCORE_MULTIPLIERS.CRIT_RATE;
            // 攻撃力%、HP%
            case PROP_NAME.ATK_PERCENT:
            case PROP_NAME.HP_PERCENT:
                return SCORE_MULTIPLIERS.ATK_PERCENT * subPropValue;
            // 防御%
            case PROP_NAME.DEF_PERCENT:
                return SCORE_MULTIPLIERS.DEF_PERCENT * subPropValue;
            // 元素熟知
            case PROP_NAME.ELEMENTAL_MASTERY:
                return SCORE_MULTIPLIERS.ELEMENTAL_MASTERY * subPropValue;
            // 元素チャージ効率
            case PROP_NAME.ENERGY_RECHARGE:
                return SCORE_MULTIPLIERS.ENERGY_RECHARGE * subPropValue;
            default:
                return 0;
        }
    }

    // スコアコンポーネントのインスタンス
    const scoreComponent = new ScoreComponent(MY_ID);

    // 描画中フラグ（重複描画防止）
    let isDrawing = false;

    // スコア要素作成
    async function createScoreElement(){
        // スコア計算
        let scoreList = [];
        for (let i = 0; i < 5; i++){
            scoreList[i] = calculateScore(i);
        }

        // スコアコンポーネントを使用して要素作成
        return await scoreComponent.createScoreElement(scoreList, styleManager);
    }

    // 描画
    async function draw(){
        // 既に描画中の場合はスキップ
        if (isDrawing) {
            return;
        }
        
        isDrawing = true;
        
        try {
            const parent = relicListElement.parentElement;
            if (parent && relicListElement) {
                // 追加ステータス名取得
                cacheSubPropNames();
                const existingNode = document.getElementById(MY_ID);
                // 既存の要素があれば削除
                if (existingNode) {
                    parent.removeChild(existingNode);
                }
                
                // 重複チェック: 削除後に再度確認
                const duplicateCheck = document.getElementById(MY_ID);
                if (duplicateCheck) {
                    duplicateCheck.remove();
                }
                
                const newDiv = await createScoreElement();
                parent.insertBefore(newDiv, relicListElement);
            } else {
                console.error(chrome.i18n.getMessage('errorRequiredElementsNotFound'));
            }
        } catch (error) {
            console.error(chrome.i18n.getMessage('errorScoreElementCreationFailed'), error);
            // フォールバック: エラーメッセージを表示
            const parent = relicListElement?.parentElement;
            if (parent) {
                const errorDiv = document.createElement('div');
                errorDiv.id = MY_ID;
                errorDiv.textContent = chrome.i18n.getMessage('errorScoreDisplayLoadFailed');
                errorDiv.style.color = 'red';
                errorDiv.style.padding = '10px';
                parent.insertBefore(errorDiv, relicListElement);
            }
        } finally {
            // 描画完了フラグをリセット
            isDrawing = false;
        }
    }

    // 非同期処理を分離
    async function reDraw() {
        // 聖遺物リスト要素の再取得
        if (!isElementVisible(relicListElement)) {
            relicListElement = await observerManager.waitForElement(SELECTORS.RELIC_LIST);
        }
        
        // 追加ステータス要素の再取得
        if (!isElementVisible(subPropListElement)) {
            const subPropsElement = await observerManager.waitForElement(SELECTORS.SUB_PROPS);
            subPropListElement = subPropsElement.querySelector(SELECTORS.PROP_LIST);
            observerManager.restartSubPropsObserving(subPropListElement);
        }
        
        // 基本情報要素の再取得
        if (!isElementVisible(basicInfoElement)) {
            basicInfoElement = await observerManager.waitForElement(SELECTORS.BASIC_INFO);
            observerManager.restartBasicInfoObserving(basicInfoElement);
        }
        
        await draw();
    }

    // 最初に実行
    async function setup(){
        // 説明用のスタイル取得
        const artifactHeaderElement = await observerManager.waitForElement(SELECTORS.ARTIFACT_INFO_HEADER);
        const descriptionSearchKeys = [
            chrome.i18n.getMessage('setupKeywordHighlightedStats'),
            chrome.i18n.getMessage('setupKeywordFirstAccess')
        ];
        // 説明用要素を検索してスタイル設定
        const descriptionElements = artifactHeaderElement.querySelectorAll('div');
        for (const el of descriptionElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                const textContent = el.textContent;
                for (const key of descriptionSearchKeys) {
                    if (textContent.includes(key)) {
                        styleManager.setStyle(STYLE_TYPES.DESCRIPTION, el);
                        break;
                    }
                }
            }
        }
        
        // 聖遺物要素取得
        relicListElement = await observerManager.waitForElement(SELECTORS.RELIC_LIST);
        const subPropsElement = await observerManager.waitForElement(SELECTORS.SUB_PROPS);
        
        // 項目ラベル用のスタイル取得
        const searchKeyForLabel = chrome.i18n.getMessage('setupKeywordAdditionalStats');
        // ラベル用要素を検索してスタイル設定
        const labelElements = subPropsElement.querySelectorAll('p');
        for (const el of labelElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                if (el.textContent.includes(searchKeyForLabel)) {
                    styleManager.setStyle(STYLE_TYPES.LABEL, el);
                    break;
                }
            }
        }
        
        // 追加ステータス名要素
        subPropListElement = subPropsElement.querySelector(SELECTORS.PROP_LIST);
        
        // 数値用スタイル取得
        const finalTextElement = await observerManager.waitForElement(SELECTORS.FINAL_TEXT);
        styleManager.setStyle(STYLE_TYPES.NUMBER, finalTextElement);

        // キャラ情報要素取得
        basicInfoElement = await observerManager.waitForElement(SELECTORS.BASIC_INFO);
        // 変更監視開始
        observerManager.startObserving(subPropListElement, basicInfoElement);
    }

    // スコア要素作成
    async function firstDraw(){
        try {
            await setup();
            await draw();
        } catch (error) {
            console.error(chrome.i18n.getMessage('errorGeneral'), error);
        }
    }

    firstDraw();
});