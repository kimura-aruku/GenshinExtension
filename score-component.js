/**
 * スコア表示コンポーネント
 * HTMLテンプレートベースでスコア表示UIを生成・更新する
 */

class ScoreComponent {
    constructor(elementId = 'alk-element') {
        this.elementId = elementId;
        this.templateCache = null;
    }

    /**
     * HTMLテンプレートを読み込む
     * @returns {Promise<string>} HTMLテンプレートの内容
     */
    async loadTemplate() {
        if (this.templateCache) {
            return this.templateCache;
        }

        try {
            const response = await fetch(chrome.runtime.getURL('score-component.html'));
            this.templateCache = await response.text();
            return this.templateCache;
        } catch (error) {
            console.error('Failed to load HTML template:', error);
            // フォールバック：最小限のHTMLを返す
            return this.getFallbackTemplate();
        }
    }

    /**
     * テンプレート読み込みに失敗した場合のフォールバック
     * @returns {string} 最小限のHTMLテンプレート
     */
    getFallbackTemplate() {
        return `
            <div class="score-display" style="width: 100%; display: flex; flex-direction: column;">
                <div>Score display element not found</div>
                <div class="score-total">
                    <span>Total Score: </span>
                    <span data-total-score="0.00">0.00</span>
                </div>
            </div>
        `;
    }

    /**
     * スコア表示要素を作成する
     * @param {number[]} scoreList - 5つの聖遺物のスコア配列
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     * @param {PageLocaleManager} pageLocaleManager - 言語管理インスタンス
     * @param {Object} scoreInfo - スコア情報（元のスコア、削減情報など）
     * @returns {Promise<HTMLElement>} 作成されたスコア表示要素
     */
    async createScoreElement(scoreList, styleManager, pageLocaleManager, scoreInfo = null) {
        const template = await this.loadTemplate();
        
        // 一時的なコンテナでHTMLを解析
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        
        // メインのスコア表示要素を取得
        const scoreElement = tempContainer.querySelector('.score-display');
        if (!scoreElement) {
            throw new Error(pageLocaleManager.getMessage('errorScoreElementNotFound'));
        }

        // IDを設定
        scoreElement.id = this.elementId;
        
        // 言語対応のテキスト更新
        this.updateLocalizedText(scoreElement, pageLocaleManager);


        // スコアデータを更新
        this.updateScores(scoreElement, scoreList, scoreInfo);

        // スタイルを適用
        this.applyStyles(scoreElement, styleManager);

        return scoreElement;
    }


    /**
     * スコア値をHTMLテンプレートに反映する
     * @param {HTMLElement} element - スコア表示要素
     * @param {number[]} scoreList - 5つの聖遺物のスコア配列
     * @param {Object} scoreInfo - スコア情報（元のスコア、削減情報など）
     */
    updateScores(element, scoreList, scoreInfo = null) {
        // 合計スコアを計算
        const totalScore = scoreList.reduce((sum, score) => sum + Number(score), 0);

        // スコア項目を更新
        const subtotalElement = element.querySelector('[data-subtotal-score]');
        const overElement = element.querySelector('[data-over-score]');
        const totalScoreElement = element.querySelector('[data-total-score]');

        if (scoreInfo && scoreInfo.originalTotal !== undefined && scoreInfo.reductionTotal !== undefined) {
            // 目標チャージ効率表示がオンの場合：3つのスコアを表示
            const displayOriginalTotal = Number(scoreInfo.originalTotal.toFixed(2));
            const displayReductionTotal = Number(scoreInfo.reductionTotal.toFixed(2));
            const displayAdjustedTotal = Number((displayOriginalTotal - displayReductionTotal).toFixed(2));
            
            if (subtotalElement) subtotalElement.textContent = displayOriginalTotal.toFixed(2);
            if (overElement) overElement.textContent = displayReductionTotal.toFixed(2);
            if (totalScoreElement) totalScoreElement.textContent = displayAdjustedTotal.toFixed(2);
        } else {
            // 目標チャージ効率表示がオフの場合：小計・超過スコアは空、合計スコアのみ表示
            if (subtotalElement) subtotalElement.textContent = '';
            if (overElement) overElement.textContent = '';
            if (totalScoreElement) totalScoreElement.textContent = totalScore.toFixed(2);
        }

        // 個別スコアを更新（常に元のスコアを表示）
        const originalScoreList = scoreInfo && scoreInfo.originalScoreList ? scoreInfo.originalScoreList : scoreList;
        originalScoreList.forEach((score, index) => {
            const scoreValueElement = element.querySelector(`[data-item-score="${index}"]`);
            if (scoreValueElement) {
                scoreValueElement.textContent = Number(score).toFixed(2);
            }
        });
    }

    /**
     * オリジナルページのスタイルを適用する
     * @param {HTMLElement} element - スコア表示要素
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     */
    applyStyles(element, styleManager) {
        // 説明文のスタイル適用
        const descriptionElement = element.querySelector('.score-description');
        if (descriptionElement) {
            styleManager.applyStyle(STYLE_TYPES.DESCRIPTION, descriptionElement);
        }

        // ラベルのスタイル適用（小計、超過、合計スコアラベル）
        const subtotalLabelElement = element.querySelector('.score-subtotal-label');
        const overLabelElement = element.querySelector('.score-over-label');
        const totalLabelElement = element.querySelector('.score-total-label');
        
        if (subtotalLabelElement) styleManager.applyStyle(STYLE_TYPES.LABEL, subtotalLabelElement);
        if (overLabelElement) styleManager.applyStyle(STYLE_TYPES.LABEL, overLabelElement);
        if (totalLabelElement) styleManager.applyStyle(STYLE_TYPES.LABEL, totalLabelElement);

        // 数値のスタイル適用（小計、超過、合計スコア値）
        const subtotalValueElement = element.querySelector('.score-subtotal-value');
        const overValueElement = element.querySelector('.score-over-value');
        const totalValueElement = element.querySelector('.score-total-value');
        
        if (subtotalValueElement) styleManager.applyStyle(STYLE_TYPES.NUMBER, subtotalValueElement);
        if (overValueElement) styleManager.applyStyle(STYLE_TYPES.NUMBER, overValueElement);
        if (totalValueElement) styleManager.applyStyle(STYLE_TYPES.NUMBER, totalValueElement);

        // 個別スコアのラベルと値にスタイル適用
        const itemLabels = element.querySelectorAll('.score-item-label');
        const itemValues = element.querySelectorAll('.score-item-value');

        itemLabels.forEach(label => {
            styleManager.applyStyle(STYLE_TYPES.LABEL, label);
        });

        itemValues.forEach(value => {
            styleManager.applyStyle(STYLE_TYPES.NUMBER, value);
        });
    }

    /**
     * 既存のスコア表示要素を更新する（再計算時に使用）
     * @param {number[]} scoreList - 新しいスコア配列
     */
    updateExistingElement(scoreList) {
        const existingElement = document.getElementById(this.elementId);
        if (existingElement) {
            this.updateScores(existingElement, scoreList);
        }
    }

    /**
     * ローカライズされたテキストを更新する
     * @param {HTMLElement} scoreElement - スコア表示要素
     * @param {PageLocaleManager} pageLocaleManager - 言語管理インスタンス
     */
    updateLocalizedText(scoreElement, pageLocaleManager) {
        // data-i18n属性を持つ全ての要素を取得
        const i18nElements = scoreElement.querySelectorAll('[data-i18n]');
        
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const localizedText = pageLocaleManager.getMessage(key);
            element.textContent = localizedText;
        });
    }
}

// グローバルに利用可能にする
window.ScoreComponent = ScoreComponent;