document.addEventListener('DOMContentLoaded', () => {
    const MY_ID = 'alk-element';

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

    // スタイルそのものを保持しているとバグったので辞書にキャッシュ
    // オリジナルの数値スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let numberStyleObject = {};

    // オリジナルの説明文スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let descriptionStyleObject = {};

    // オリジナルのラベルスタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let labelStyleObject = {};

    // 追加ステータスとキャラ情報の監視オブジェクト
    let subPropsElementObserve, basicInfoElementObserve;

    // 要素取得
    function waitForElement(selector) {
        return new Promise((resolve, reject) => {
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
                reject(new Error(`Timeout: 要素 ${selector} が見つかりませんでした`));
            }, 10000);
        });
    }

    // 監視のコールバック
    const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.target.id === MY_ID) {
                continue;
            }
            if(observer === subPropsElementObserve && (mutation.type === 'childList' || mutation.type === 'attributes')){
                reDraw();
            } else if(observer === basicInfoElementObserve && mutation.type === 'attributes'){
                reDraw();
            }
        }
    };

    // 監視設定
    const config = {
        childList: true,
        attributes: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false,
        attributeOldValue: false,
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
        subPropsElementObserve.observe(subPropListElement, config);
        
        basicInfoElementObserve = new MutationObserver(callback);
        basicInfoElementObserve.observe(basicInfoElement, config);
    }

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
        return Math.floor(score * 100) / 100;
    }


    // 数値オリジナル要素のスタイルをコピー
    function applyOriginalNumberStyle(element){
        Object.assign(element.style, numberStyleObject);
    }

    // 説明文オリジナル要素のスタイルをコピー
    function applyOriginalDescriptionStyle(element){
        Object.assign(element.style, descriptionStyleObject);
    }

    // 項目名オリジナル要素のスタイルをコピー
    function applyOriginalLabelStyle(element){
        Object.assign(element.style, labelStyleObject);
    }

    // スコアにして返す
    function getScore(subPropName, subPropValue){
        const PROP_NAME = Object.freeze({
            HP: 'HP',
            HP_PERCENT: 'HPパーセンテージ',
            ATK: '攻撃力',
            ATK_PERCENT: '攻撃力パーセンテージ',
            DEF: '防御力',
            DEF_PERCENT: '防御力パーセンテージ',
            CRIT_RATE: '会心率',
            CRIT_DMG: '会心ダメージ',
            ELEMENTAL_MASTERY: '元素熟知',
            ENERGY_RECHARGE: '元素チャージ効率'
        });

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
                return 0;
            // 会心ダメージ
            case PROP_NAME.CRIT_DMG:
                return subPropValue;
            // 会心率
            case PROP_NAME.CRIT_RATE:
                return subPropValue * 2.0;
            // 攻撃力%、HP%
            case PROP_NAME.ATK_PERCENT:
            case PROP_NAME.HP_PERCENT:
                return (62.2/46.6) * subPropValue;
            // 防御%
            case PROP_NAME.DEF_PERCENT:
                return (62.2/58.3) * subPropValue;
            // 元素熟知
            case PROP_NAME.ELEMENTAL_MASTERY:
                return (62.2/187.0) * subPropValue;
            // 元素チャージ効率
            case PROP_NAME.ENERGY_RECHARGE:
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
        newDiv.style.display = 'flex';
        newDiv.style.flexDirection = 'column';
        newDiv.style.gap = '0';
        newDiv.style.alignItems = 'center';

        // スコア計算
        let scoreList = [];
        let scores = 0;
        for (let i = 0; i < 5; i++){
            scoreList[i] = calculateScore(i);
            scores += Number(scoreList[i]);
        }
        // 1行目
        const row1 = document.createElement('div');
        row1.style.display = 'flex';
        row1.style.width = '100%';

        // 1行目1列目〜3列目
        const cell1 = document.createElement('div');
        cell1.textContent = 'スコアは追加ステータスから算出されます。';
        applyOriginalDescriptionStyle(cell1);
        cell1.style.flex = '3';
        cell1.style.paddingRight = 'calc(8 * 3px + 12 * 3px)';
        cell1.style.display = 'flex';
        cell1.style.alignItems = 'center';
        cell1.style.justifyContent = 'flex-start';
        cell1.style.marginRight = 'calc(12 * 3px)';
        row1.appendChild(cell1);
        
        // 1行目の4列目
        const cell2 = document.createElement('div');
        cell2.style.flex = '1';
        cell2.style.padding = '0 8px 0 12px';
        cell2.style.display = 'flex';
        cell2.style.marginRight = '12px';
        row1.appendChild(cell2);

        // 1行目の5列目
        const cell3 = document.createElement('div');
        cell3.style.display = 'flex';
        cell3.style.justifyContent = 'space-between';
        cell3.style.flex = '1';
        cell3.style.padding = '0 8px 0 12px';
        cell3.style.alignItems = 'center';
        // 左寄せのテキストを作成
        const cell3Left = document.createElement('span');
        applyOriginalLabelStyle(cell3Left);
        cell3Left.textContent = '合計スコア:';
        cell3.appendChild(cell3Left);
        // 右寄せのテキストを作成
        const cell3Right = document.createElement('span');
        cell3Right.textContent = scores.toFixed(2);
        applyOriginalNumberStyle(cell3Right);
        cell3.appendChild(cell3Right);
        row1.appendChild(cell3);

        // 2行目を作成
        const row2 = document.createElement('div');
        row2.style.display = 'flex';
        row2.style.width = '100%';
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.style.display = 'flex';
            cell.style.justifyContent = 'space-between';
            cell.style.flex = '1';
            cell.style.padding = '10px 8px 10px 12px';
            cell.style.alignItems = 'center';
            if(col < 4){
                cell.style.marginRight = '12px';
            }
            // 左寄せのテキストを作成
            const cellLeft = document.createElement('span');
            applyOriginalLabelStyle(cellLeft);
            cellLeft.textContent = 'スコア:';
            cell.appendChild(cellLeft);
            // 右寄せのテキストを作成
            const cellRight = document.createElement('span');
            cellRight.textContent = scoreList[col].toFixed(2);
            applyOriginalNumberStyle(cellRight);
            cell.appendChild(cellRight);
            row2.appendChild(cell);
        }
        // テーブルに行を追加
        newDiv.appendChild(row1);
        newDiv.appendChild(row2);
        return newDiv;
    }

    // 描画
    function draw(){
        const parent = relicListElement.parentElement;
        if (parent && relicListElement) {
            // 追加ステータス名取得
            cacheSubPropNames();
            const existingNode = document.getElementById(MY_ID);
            // 既存の要素があれば削除
            if (existingNode) {
                const parent = relicListElement.parentElement;
                parent.removeChild(existingNode);
            }
            const newDiv = createScoreElement();
            parent.insertBefore(newDiv, relicListElement);
        }else{
            // TODO:エラーハンドリング
        }
    }

    // 非同期処理を分離
    async function reDraw() {
        if(!isElementVisible(relicListElement)){
            relicListElement = await waitForElement('.relic-list');
        }
        if(!isElementVisible(subPropListElement)){
            if (subPropsElementObserve) {
                subPropsElementObserve.disconnect();
            }
            const subPropsElement = await waitForElement('.sub-props');
            subPropListElement = subPropsElement.querySelector('.prop-list');
            subPropsElementObserve = new MutationObserver(callback);
            subPropsElementObserve.observe(subPropListElement, config);
        }
        if(!isElementVisible(basicInfoElement)){
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
        // コピー対象のスタイルプロパティ
        const allowedProperties = ['font-size', 'text-align', 'font-family', 'color'];
        // 説明用のスタイル取得
        const artifactHeaderElement = await waitForElement('.artifact-info header');
        const descriptionElements = artifactHeaderElement.querySelectorAll('div');
        let descriptionElement = null;
        const searchKeyForDescription = 'ハイライトされたステータス';
        for (let el of descriptionElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                if (el.textContent.includes(searchKeyForDescription)) {
                    descriptionElement = el;
                    break;
                }
            }
        }
        const descriptionTextStyle = window.getComputedStyle(descriptionElement);
        for (let style of allowedProperties) {
            descriptionStyleObject[style] = descriptionTextStyle.getPropertyValue(style);
        }
        // 聖遺物要素取得
        relicListElement = await waitForElement('.relic-list');
        const subPropsElement = await waitForElement('.sub-props');
        // 項目ラベル用のスタイル取得
        const subPropsElements = subPropsElement.querySelectorAll('p');
        let labelElement = null;
        const searchKeyForLabel = '追加ステータス';
        for (let el of subPropsElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                if (el.textContent.includes(searchKeyForLabel)) {
                    labelElement = el;
                    break;
                }
            }
        }
        const labelTextStyle = window.getComputedStyle(labelElement);
        for (let style of allowedProperties) {
            labelStyleObject[style] = labelTextStyle.getPropertyValue(style);
        }
        // 追加ステータス名要素
        subPropListElement = subPropsElement.querySelector('.prop-list');
        // 数値用スタイル取得
        const finalTextElement = await waitForElement('.final-text');
        const finalTextStyle = window.getComputedStyle(finalTextElement);
        for (let style of allowedProperties) {
            numberStyleObject[style] = finalTextStyle.getPropertyValue(style);
        }

        // キャラ情報要素取得
        basicInfoElement = await waitForElement('.basic-info');
        // 変更監視開始
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

    firstDraw();
});