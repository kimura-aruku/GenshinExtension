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
            console.error(chrome.i18n.getMessage('errorTemplateLoadFailed'), error);
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
                <div>${chrome.i18n.getMessage('errorScoreDisplayLoadFailed')}</div>
                <div class="score-total">
                    <span>${chrome.i18n.getMessage('totalScore')}: </span>
                    <span data-total-score="0.00">0.00</span>
                </div>
            </div>
        `;
    }

    /**
     * スコア表示要素を作成する
     * @param {number[]} scoreList - 5つの聖遺物のスコア配列
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     * @returns {Promise<HTMLElement>} 作成されたスコア表示要素
     */
    async createScoreElement(scoreList, styleManager) {
        const template = await this.loadTemplate();
        
        // 一時的なコンテナでHTMLを解析
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        
        // メインのスコア表示要素を取得
        const scoreElement = tempContainer.querySelector('.score-display');
        if (!scoreElement) {
            throw new Error(chrome.i18n.getMessage('errorScoreElementNotFound'));
        }

        // IDを設定
        scoreElement.id = this.elementId;

        // 国際化メッセージを適用
        this.applyI18nMessages(scoreElement);

        // スコアデータを更新
        this.updateScores(scoreElement, scoreList);

        // スタイルを適用
        this.applyStyles(scoreElement, styleManager);

        return scoreElement;
    }

    /**
     * 国際化メッセージをHTMLテンプレートに適用する
     * @param {HTMLElement} element - スコア表示要素
     */
    applyI18nMessages(element) {
        // data-i18n属性を持つ全ての要素を取得してメッセージを適用
        const i18nElements = element.querySelectorAll('[data-i18n]');
        i18nElements.forEach(el => {
            const messageKey = el.getAttribute('data-i18n');
            const message = chrome.i18n.getMessage(messageKey);
            if (message) {
                el.textContent = message;
            }
        });
    }

    /**
     * スコア値をHTMLテンプレートに反映する
     * @param {HTMLElement} element - スコア表示要素
     * @param {number[]} scoreList - 5つの聖遺物のスコア配列
     */
    updateScores(element, scoreList) {
        // 合計スコアを計算
        const totalScore = scoreList.reduce((sum, score) => sum + Number(score), 0);

        // 合計スコアを更新
        const totalScoreElement = element.querySelector('[data-total-score]');
        if (totalScoreElement) {
            totalScoreElement.textContent = totalScore.toFixed(2);
        }

        // 個別スコアを更新
        scoreList.forEach((score, index) => {
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

        // ラベルのスタイル適用（合計スコアラベル）
        const totalLabelElement = element.querySelector('.score-total-label');
        if (totalLabelElement) {
            styleManager.applyStyle(STYLE_TYPES.LABEL, totalLabelElement);
        }

        // 数値のスタイル適用（合計スコア値）
        const totalValueElement = element.querySelector('.score-total-value');
        if (totalValueElement) {
            styleManager.applyStyle(STYLE_TYPES.NUMBER, totalValueElement);
        }

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
}

// グローバルに利用可能にする
window.ScoreComponent = ScoreComponent;