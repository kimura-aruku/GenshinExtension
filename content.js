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
        RELIC_ITEM: '.relic-item',
        ARTIFACT_SUB_PROP: '.artifact-sub-prop',
        
        // 追加ステータス関連
        SUB_PROPS: '.sub-props',
        SUB_PROPS_PROP_LIST: '.sub-props .prop-list',
        PROP_LIST: '.prop-list',
        
        // 言語選択関連
        LANGUAGE_SELECTOR: '.mhy-hoyolab-lang-selector__current-lang',
        
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

    // 言語選択要素
    /** @type {HTMLElement | null} */
    let languageSelectorElement;

    // スタイル管理インスタンス（style-manager.jsから読み込み）
    const styleManager = new StyleManager();
    
    // ページ言語管理インスタンス（page-locale-manager.jsから読み込み）
    const pageLocaleManager = new PageLocaleManager();
    
    // 目標チャージ効率管理インスタンス（target-er-component.jsから読み込み）
    const targetERComponent = new TargetERComponent();
    

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
            // 言語選択要素の監視オブジェクト
            this.languageObserver = null;
            
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
         * @param {function} additionalCondition - 追加の条件チェック関数（オプション）
         * @param {function} abortCondition - 中断条件チェック関数（オプション）
         * @returns {Promise<HTMLElement|null>} 見つかった要素、または中断時はnull
         */
        waitForElement(selector, additionalCondition = null, abortCondition = null) {
            return new Promise((resolve, reject) => {
                // 中断条件チェック
                const checkAbortCondition = () => {
                    if (abortCondition && abortCondition()) {
                        return true;
                    }
                    return false;
                };

                // 要素の条件チェック
                const checkElement = (element) => {
                    if (!element) return false;
                    if (additionalCondition && !additionalCondition(element)) {
                        return false;
                    }
                    return true;
                };

                // 中断条件の初期チェック
                if (checkAbortCondition()) {
                    resolve(null);
                    return;
                }

                // 既に存在するならそのまま返す
                const existingElement = document.querySelector(selector);
                if (checkElement(existingElement)) {
                    resolve(existingElement);
                    return;
                }

                let timeoutId;
                
                const observer = new MutationObserver((mutationsList, observer) => {
                    // 中断条件チェック
                    if (checkAbortCondition()) {
                        observer.disconnect();
                        clearTimeout(timeoutId);
                        resolve(null);
                        return;
                    }
                    
                    const element = document.querySelector(selector);
                    if (checkElement(element)) {
                        observer.disconnect();
                        clearTimeout(timeoutId);
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
                timeoutId = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout: Element ${selector} not found`));
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
         * @param {HTMLElement} languageElement - 言語選択要素
         */
        startObserving(subPropElement, basicInfoElement, languageElement) {
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
            
            // 言語選択要素の監視
            if (languageElement) {
                this.languageObserver = new MutationObserver(
                    (mutations, observer) => this.handleMutations(mutations, observer)
                );
                this.languageObserver.observe(languageElement, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
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
            if (this.languageObserver) {
                this.languageObserver.disconnect();
                this.languageObserver = null;
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

    // テキストを正規化する関数
    function normalizeText(text) {
        if (!text) return '';
        // 非改行スペース(&nbsp;)を通常スペースに変換し、前後の空白を除去
        return text.replace(/\u00A0/g, ' ').trim();
    }

    // 聖遺物未装備かどうかをチェックする関数
    function checkNoArtifactsEquipped() {
        const artifactInfoElement = document.querySelector(SELECTORS.ARTIFACT_INFO);
        if (!artifactInfoElement) {
            return false;
        }
        
        // artifact-info以下のp要素をチェック
        const pElements = artifactInfoElement.querySelectorAll('p');
        
        // ページの言語設定に基づく「装備なし」メッセージをチェック
        // pageLocaleManagerが初期化されていない場合は、まず初期化を試行
        if (!pageLocaleManager.currentPageLocale && languageSelectorElement) {
            pageLocaleManager.detectPageLanguage(languageSelectorElement);
        }
        
        const noArtifactsMessage = pageLocaleManager.getMessage('noArtifactsEquipped');
        const normalizedMessage = normalizeText(noArtifactsMessage);
        
        for (const pElement of pElements) {
            const textContent = normalizeText(pElement.textContent) || '';
            if (textContent === normalizedMessage) {
                return true;
            }
        }
        
        return false;
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
            // ステータス名を正規化
            return normalizeText(textContent);
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
        // 花、羽、砂、杯、冠 - relic-listの直接の子要素（div）を取得
        const relicElements = relicListElement.children;
        // 上記のいずれか
        const relicElement = relicElements[index];
        
        // relic-itemクラスを持たない場合はスコア0を返す
        if (!relicElement || !relicElement.classList.contains(SELECTORS.RELIC_ITEM.substring(1))) {
            return 0;
        }
        
        // 聖遺物1つあたりが持つサブステータス要素すべて
        const subPropElements = relicElement.querySelectorAll(SELECTORS.ARTIFACT_SUB_PROP);
        let score = 0;
        for (const subPropElement of subPropElements) {
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
                    subPropName = normalizeText(text2);
                } else {
                    subPropValue = text2;
                    subPropName = normalizeText(text1);
                }
                score += Number(getScore(subPropName, subPropValue));
            }
        }
        return Math.floor(score * 100) / 100;
    }




    // スコアにして返す（config.jsの定数を使用）
    function getScore(subPropName, subPropValue){
        // ステータス名を正規化
        subPropName = normalizeText(subPropName);
        
        // 実数かパーセントか判断できない状態
        const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
            .includes(subPropName);
        if(isRealOrPercent && subPropValue.includes('%')){
            // 言語に応じたパーセンテージ表記に変換
            if(subPropName === PROP_NAME.HP) subPropName = PROP_NAME.HP_PERCENT;
            else if(subPropName === PROP_NAME.ATK) subPropName = PROP_NAME.ATK_PERCENT;
            else if(subPropName === PROP_NAME.DEF) subPropName = PROP_NAME.DEF_PERCENT;
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

    /**
     * 指定した聖遺物の元素チャージ効率値を取得
     * @param {number} index - 聖遺物のインデックス（0-4）
     * @returns {number} 元素チャージ効率の値
     */
    function getERValueFromArtifact(index) {
        const relicElements = relicListElement.children;
        const relicElement = relicElements[index];
        
        if (!relicElement || !relicElement.classList.contains(SELECTORS.RELIC_ITEM.substring(1))) {
            return 0;
        }
        
        const subPropElements = relicElement.querySelectorAll(SELECTORS.ARTIFACT_SUB_PROP);
        let erValue = 0;
        
        for (const subPropElement of subPropElements) {
            const textNodes = getTextNodes(subPropElement);
            if (textNodes.length === 2) {
                const text1 = textNodes[0].textContent.trim();
                const text2 = textNodes[1].textContent.trim();
                
                let subPropName, subPropValue;
                if (/\d/.test(text1)) {
                    subPropValue = text1;
                    subPropName = normalizeText(text2);
                } else {
                    subPropValue = text2;
                    subPropName = normalizeText(text1);
                }
                
                // 元素チャージ効率かチェック
                if (subPropName === PROP_NAME.ENERGY_RECHARGE) {
                    erValue += parseFloat(subPropValue.replace(/[%+]/g, '').trim());
                }
            }
        }
        
        return erValue;
    }

    /**
     * 目標チャージ効率に基づいてスコア補正を適用
     * @param {number[]} scoreList - 各聖遺物のスコア配列
     * @param {number} totalERValue - 全聖遺物の元素チャージ効率合計
     * @returns {Promise<{adjustedScoreList: number[], scoreInfo: Object}>} 補正後のスコア配列と削減情報
     */
    async function applyTargetERCorrection(scoreList, totalERValue) {
        try {
            // 目標チャージ効率表示が無効化されている場合は通常計算
            if (!targetERComponent.isEnabled) {
                return {
                    adjustedScoreList: [...scoreList],
                    scoreInfo: null
                };
            }
            
            // 追加ステータスに元素チャージ効率が含まれていない場合でも、表示用の情報を返す
            if (!subPropNames.includes(PROP_NAME.ENERGY_RECHARGE)) {
                const totalOriginalScore = scoreList.reduce((sum, score) => sum + score, 0);
                return {
                    adjustedScoreList: [...scoreList],
                    scoreInfo: {
                        originalTotal: totalOriginalScore,
                        reductionTotal: 0,
                        originalScoreList: [...scoreList]
                    }
                };
            }
            
            const targetER = await targetERComponent.getCurrentTargetER();
            
            // targetERがnullまたは0以下の場合は9999として扱う（実質制限なし）
            const effectiveTargetER = targetER && targetER > 0 ? targetER : 9999;
            
            if (totalERValue <= effectiveTargetER) {
                // 合計値が目標値以下の場合は削減0で表示
                const totalOriginalScore = scoreList.reduce((sum, score) => sum + score, 0);
                return {
                    adjustedScoreList: [...scoreList],
                    scoreInfo: {
                        originalTotal: totalOriginalScore,
                        reductionTotal: 0,
                        originalScoreList: [...scoreList]
                    }
                };
            }
            
            // 超過分の計算
            const excessER = totalERValue - effectiveTargetER;
            const excessScore = SCORE_MULTIPLIERS.ENERGY_RECHARGE * excessER;
            
            // 全聖遺物から按分して超過スコアを削減
            const totalOriginalScore = scoreList.reduce((sum, score) => sum + score, 0);
            const adjustedScoreList = scoreList.map(score => {
                if (totalOriginalScore > 0) {
                    const ratio = score / totalOriginalScore;
                    const reduction = excessScore * ratio;
                    return Math.max(0, score - reduction);
                } else {
                    return score;
                }
            });
            
            const finalScoreList = adjustedScoreList.map(score => Math.floor(score * 100) / 100);
            
            return {
                adjustedScoreList: finalScoreList,
                scoreInfo: {
                    originalTotal: totalOriginalScore,
                    reductionTotal: excessScore,
                    originalScoreList: [...scoreList]
                }
            };
        } catch (error) {
            console.warn('Failed to apply target ER correction:', error);
            return {
                adjustedScoreList: [...scoreList],
                scoreInfo: null
            };
        }
    }

    // スコアコンポーネントのインスタンス
    const scoreComponent = new ScoreComponent(MY_ID);

    // 描画中フラグ（重複描画防止）
    let isDrawing = false;

    // スコア要素作成
    async function createScoreElement(){
        // まず通常のスコア計算を実行（目標ER考慮なし）
        let scoreList = [];
        let totalERValue = 0; // 全聖遺物の元素チャージ効率合計
        
        for (let i = 0; i < 5; i++){
            scoreList[i] = calculateScore(i);
            
            // 各聖遺物の元素チャージ効率を合計
            const erValueForArtifact = getERValueFromArtifact(i);
            totalERValue += erValueForArtifact;
        }
        
        // 目標チャージ効率に基づく調整を適用
        const correctionResult = await applyTargetERCorrection(scoreList, totalERValue);
        const adjustedScoreList = correctionResult.adjustedScoreList;
        const scoreInfo = correctionResult.scoreInfo;
        

        // スコアコンポーネントを使用して要素作成
        return await scoreComponent.createScoreElement(adjustedScoreList, styleManager, pageLocaleManager, scoreInfo);
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
                
                // 目標チャージ効率入力UI を表示（設定が有効な場合）
                await targetERComponent.showTargetERInput(pageLocaleManager);
            } else {
                console.error('Required parent element or relic list element not found for score display insertion.');
            }
        } catch (error) {
            console.error('Failed to create score element:', error);
            // フォールバック: エラーメッセージを表示
            const parent = relicListElement?.parentElement;
            if (parent) {
                const errorDiv = document.createElement('div');
                errorDiv.id = MY_ID;
                errorDiv.textContent = 'Failed to load score display.';
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
            relicListElement = await observerManager.waitForElement(SELECTORS.RELIC_LIST, null, checkNoArtifactsEquipped);
            if (!relicListElement) {
                console.log('No artifacts equipped, skipping score calculation');
                return; // 処理を終了
            }
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
        
        // 言語選択要素の再取得と言語判定の更新
        if (!isElementVisible(languageSelectorElement)) {
            languageSelectorElement = await observerManager.waitForElement(SELECTORS.LANGUAGE_SELECTOR, (element) => {
                // 文字列が取得できることを追加条件とする
                const text = element.textContent?.trim() || element.innerText?.trim() || '';
                return text.length > 0;
            });
            // 言語を再判定してPROP_NAMEを更新
            pageLocaleManager.detectPageLanguage(languageSelectorElement);
            initializePropNames(pageLocaleManager);
        }
        
        // 全ての監視を再開する（言語選択要素も含めて）
        observerManager.startObserving(subPropListElement, basicInfoElement, languageSelectorElement);
        
        await draw();
    }

    // 最初に実行
    async function setup(){
        // ストレージから計算方式を読み込み
        await loadCalculationMethod();
        
        // SCORE_MULTIPLIERSを更新（loadCalculationMethodで設定が更新されたため）
        window.SCORE_MULTIPLIERS = getCurrentScoreMultipliers();
        
        // 言語選択要素を取得して言語判定
        languageSelectorElement = await observerManager.waitForElement(SELECTORS.LANGUAGE_SELECTOR, (element) => {
            // 文字列が取得できることを追加条件とする
            const text = element.textContent?.trim() || element.innerText?.trim() || '';
            return text.length > 0;
        });
        pageLocaleManager.detectPageLanguage(languageSelectorElement);
        
        // 目標チャージ効率表示設定を読み込み
        await loadTargetERDisplaySetting();
        
        // ページ言語に応じたPROP_NAMEを初期化
        initializePropNames(pageLocaleManager);
        // 説明用のスタイル取得
        const artifactHeaderElement = await observerManager.waitForElement(SELECTORS.ARTIFACT_INFO_HEADER);
        const descriptionSearchKeys = [
            pageLocaleManager.getMessage('setupKeywordHighlightedStats'),
            pageLocaleManager.getMessage('setupKeywordFirstAccess')
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
        relicListElement = await observerManager.waitForElement(SELECTORS.RELIC_LIST, null, checkNoArtifactsEquipped);
        if (!relicListElement) {
            console.log('No artifacts equipped during setup, skipping initialization');
            return; // 処理を終了
        }
        const subPropsElement = await observerManager.waitForElement(SELECTORS.SUB_PROPS);
        
        // 項目ラベル用のスタイル取得
        const searchKeyForLabel = pageLocaleManager.getMessage('setupKeywordAdditionalStats');
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
        observerManager.startObserving(subPropListElement, basicInfoElement, languageSelectorElement);
    }

    // スコア要素作成
    async function firstDraw(){
        try {
            await setup();
            await draw();
        } catch (error) {
            console.error(pageLocaleManager.getMessage('errorGeneral'), error);
        }
    }

    // カスタムイベントリスナー（設定変更時の再描画用）
    document.addEventListener('genshin-method-changed', async (event) => {
        try {
            await draw();
        } catch (error) {
            console.error('Failed to redraw after method change:', error);
        }
    });

    // 目標チャージ効率変更時の再描画用イベントリスナー
    document.addEventListener('target-er-changed', async (event) => {
        try {
            await draw();
        } catch (error) {
            console.error('Failed to redraw after target ER change:', error);
        }
    });

    // popup からのメッセージを受信
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'CALCULATION_METHOD_CHANGED') {
            handleCalculationMethodChange(message.method);
            sendResponse({ success: true });
        } else if (message.type === 'TARGET_ER_DISPLAY_CHANGED') {
            handleTargetERDisplayChange(message.enabled);
            sendResponse({ success: true });
        }
    });

    // 計算方式変更のハンドラ
    async function handleCalculationMethodChange(newMethod) {
        try {
            // 設定を更新
            updateCalculationMethod(newMethod);
            
            // 既存のスコア表示要素を削除
            const existingScoreElement = document.getElementById(EXTENSION_CONFIG.ELEMENT_ID);
            if (existingScoreElement) {
                existingScoreElement.remove();
            }
            
            // カスタムイベントをdispatchしてDOMContentLoadedスコープ内の処理に再描画を要求
            const event = new CustomEvent('genshin-method-changed', { 
                detail: { method: newMethod } 
            });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('Failed to handle calculation method change:', error);
        }
    }

    // 目標チャージ効率表示設定変更のハンドラ
    async function handleTargetERDisplayChange(enabled) {
        try {
            // 目標チャージ効率コンポーネントの表示・非表示を切り替え
            targetERComponent.setEnabled(enabled);
            
            // 現在表示されているUI要素を更新
            if (enabled) {
                await targetERComponent.showTargetERInput(pageLocaleManager);
            } else {
                targetERComponent.hideTargetERInput();
            }
            
        } catch (error) {
            console.error('Failed to handle target ER display change:', error);
        }
    }

    firstDraw();
});