const HP = 'HP';
const HP_PERCENT = 'HPパーセンテージ';
const ATK = '攻撃力';
const ATK_PERCENT = '攻撃力パーセンテージ';
const DEF = '防御力';
const DEF_PERCENT = '防御力パーセンテージ';
const CRIT_RATE = '会心率';
const CRIT_DMG = '会心ダメージ';
const ELEMENTAL_MASTERY = '元素熟知';
const ENERGY_RECHARGE = '元素チャージ効率';

const MY_ID = 'alk-element';

// 聖遺物親要素
/** @type {HTMLElement | null} */
let relicListElement;

// 追加ステータス親要素
/** @type {HTMLElement | null} */
let subPropsElement;

// 追加ステータス一覧
/** @type {string[]} */
let subPropNames = [];

// オリジナルの数値要素
/** @type {HTMLElement | null} */
let finalTextElement;

// キャラの基本情報要素
/** @type {HTMLElement | null} */
let basicInfoElement;

// 追加ステータスとキャラ情報の監視オブジェクト
let subPropsElementObserve, basicInfoElementObserve;

document.addEventListener('DOMContentLoaded', () => {
    // 要素取得
    function waitForElement(selector) {
        return new Promise((resolve, reject) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect(); // 要素が見つかったら監視を停止
                    resolve(element); // 要素が見つかったらPromiseを解決
                }
            });
            // DOMの変更を監視（子要素の追加、属性の変更など）
            observer.observe(document.body, { 
                childList: true,  // 子要素の追加/削除
                subtree: true,    // サブツリー内の変化も監視
                attributes: true  // 属性の変更も監視
            });

            // タイムアウトの設定（10秒以内に見つからない場合はエラー）
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout: 要素 ${selector} が見つかりませんでした`));
            }, 10000);  // タイムアウト時間を調整
        });
    }



    // 監視のコールバック
    const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.target.id === MY_ID) {
                continue;
            }
            if(observer === subPropsElementObserve){
                console.log('追加ステータスの変更を検知したので再描画');
            } else if(observer === basicInfoElementObserve){
                console.log('キャラ情報の変更を検知したので再描画');
            }
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                console.log('要素が変更されたので再描画');
                console.log(`変更された要素:`, mutation.target);
                console.log(`変更された属性:`, mutation.attributeName);
                reDraw();
            }
        }
    };

    // 監視するオプション（設定）
    const config = {
        childList: true,            // 子要素の追加・削除を監視
        attributes: true,           // 属性の変更を監視
        subtree: true,              // 子孫要素も監視対象にする
        characterData: true,        // テキストノードの変更を監視
        characterDataOldValue: true, // 変更前のテキストも取得
        attributeOldValue: true,    // 属性変更前の値も取得
    };

    // 監視を再設定する関数
    function setObservers() {
        // 既存の監視を解除
        if (subPropsElementObserve) {
            subPropsElementObserve.disconnect();
        }
        if (basicInfoElementObserve) {
            basicInfoElementObserve.disconnect();
        }
        subPropsElementObserve = new MutationObserver(callback);
        subPropsElementObserve.observe(subPropsElement, config);
        
        basicInfoElementObserve = new MutationObserver(callback);
        basicInfoElementObserve.observe(basicInfoElement, config);
    }

    // 要素が画面に表示されている
    function isElementVisible(element) {
        if (!element) {
            return false;
        }
        // getBoundingClientRect で画面内に収まっているかチェック
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
        const propItemElements = subPropsElement.querySelectorAll('.prop-item');
        subPropNames = Array.from(propItemElements).map(element => {
            const childText = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') // テキストノードかつ空白ではない
                .map(node => node.textContent.trim()); // 空白を取り除いたテキストを取得
            let textContent;
            // もし childText が空であれば、直接 element.textContent を使ってテキストを取得する
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
                if (text && !/^\d+$/.test(text)) { // 空白 & 数値のみを除外
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
        const subPropElements = relicElement.querySelectorAll('.artifact-sub-prop');
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
        return score;
    }

    // オリジナル要素のスタイルをコピー
    function applyOriginStyle(element){
        // sourceElementのスタイルを取得
        const computedStyles = window.getComputedStyle(finalTextElement);

        // computedStylesをtargetElementに適用
        for (let style of computedStyles) {
            element.style[style] = computedStyles.getPropertyValue(style);
        }
    }

    // スコアにして返す
    function getScore(subPropName, subPropValue){
        // 実数かパーセントか判断できない状態
        const isRealOrPercent = [HP, ATK, DEF].includes(subPropName);
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
            case HP:
            case ATK:
            case DEF:
                return 0;
            // 会心ダメージ
            case CRIT_DMG:
                return subPropValue;
            // 会心率
            case CRIT_RATE:
                return subPropValue * 2.0;
            // 攻撃力%、HP%
            case ATK_PERCENT:
            case HP_PERCENT:
                return (62.2/46.6) * subPropValue;
            // 防御%
            case DEF_PERCENT:
                return (62.2/58.3) * subPropValue;
            // 元素熟知
            case ELEMENTAL_MASTERY:
                return (62.2/187.0) * subPropValue;
            // 元素チャージ効率
            case ENERGY_RECHARGE:
                return (62.2/51.8) * subPropValue;
            default:
                return 0;
        }
    }

    // スコア要素作成
    function createScoreElement(){
        const newDiv = document.createElement('div');
        newDiv.id = MY_ID;
        // スタイル設定
        newDiv.style.width = '100%';
        newDiv.style.height = '50px';
        newDiv.style.display = 'grid'; 
        newDiv.style.gridTemplateRows = 'repeat(2, 1fr)'; 
        newDiv.style.gridTemplateColumns = 'repeat(5, 1fr)'; 
        newDiv.style.gap = '0';
        newDiv.style.alignItems = 'center';
        newDiv.style.justifyItems = 'end';
        // セルを作成して追加
        let scoreList = [];
        let scores = 0;
        for (let i = 0; i < 5; i++){
            scoreList[i] = calculateScore(i);
            scores += Number(scoreList[i]);
        }
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                if(row == 0 && col == 4){
                    const truncatedScore = Math.floor(Number(scores) * 100) / 100;
                    cell.textContent = truncatedScore.toFixed(2);
                }
                if(row == 1){
                    const truncatedScore = Math.floor(Number(scoreList[col]) * 100) / 100;
                    cell.textContent = truncatedScore.toFixed(2);
                }
                applyOriginStyle(cell);
                cell.style.paddingRight = '10px';
                newDiv.appendChild(cell);
            }
        }
        return newDiv;
    }

    function draw(){
        console.log('描画開始');
        const parent = relicListElement.parentElement;
        if (parent && relicListElement) {
            // 追加ステータス名取得
            cacheSubPropNames();
            const existingNode = document.getElementById(MY_ID);
            // 既存の要素があれば削除
            if (existingNode) {
                console.log('自作要素がすでにあったため削除');
                const parent = relicListElement.parentElement;
                parent.removeChild(existingNode);
            }
            const newDiv = createScoreElement();
            parent.insertBefore(newDiv, relicListElement);
        }else{
            console.log('聖遺物要素の親が取得できなかった');
        }
    }

    // 初期化処理
    async function initialize(){
        relicListElement = await waitForElement('.relic-list');
        subPropsElement = await waitForElement('.sub-props');
        finalTextElement = await waitForElement('.final-text');
        basicInfoElement = await waitForElement('.basic-info');
    }

    // 非同期処理を分離
    async function reDraw() {
        if(!isElementVisible(relicListElement)){
            console.log('再描画時に聖遺物リストが見えないため再取得');
            relicListElement = await waitForElement('.relic-list');
        }
        if(!isElementVisible(subPropsElement)){
            console.log('再描画時に追加ステータスが見えないため再取得');
            if (subPropsElementObserve) {
                subPropsElementObserve.disconnect();
            }
            subPropsElement = await waitForElement('.sub-props');
            subPropsElementObserve = new MutationObserver(callback);
            subPropsElementObserve.observe(subPropsElement, config);
        }
        if(!isElementVisible(finalTextElement)){
            console.log('再描画時にfinalテキストが見えないため再取得');
            finalTextElement = await waitForElement('.final-text');
        }
        if(!isElementVisible(basicInfoElement)){
            console.log('再描画時にキャラ情報が見えないため再取得');
            if (basicInfoElementObserve) {
                basicInfoElementObserve.disconnect();
            }
            basicInfoElement = await waitForElement('.basic-info');
            basicInfoElementObserve = new MutationObserver(callback);
            basicInfoElementObserve.observe(basicInfoElement, config);
        }
        draw();
    }

    // 最初に実行
    async function setup(){
        await initialize();
        setObservers();
    }

    // スコア要素作成
    async function firstDraw(){
        try {
            await setup();
            draw();
        } catch (error) {
            console.error('エラー:', error);
        }
    }
    console.log('拡張テスト開始');
    firstDraw();
});

