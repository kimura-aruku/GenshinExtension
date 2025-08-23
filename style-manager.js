/**
 * スタイル管理クラス
 * オリジナルページからのスタイル取得・保持・適用を管理
 */
class StyleManager {
    constructor() {
        // スタイルキャッシュ
        this.styles = {
            number: {},
            description: {},
            label: {}
        };
        
        // コピー対象のスタイルプロパティ
        this.allowedProperties = Object.freeze([
            'font-size', 'text-align', 'font-family', 'color'
        ]);
    }

    /**
     * 要素からスタイルを抽出する
     * @param {HTMLElement} element - スタイル取得元の要素
     * @returns {{ [key: string]: string }} スタイルオブジェクト
     */
    extractStyles(element) {
        const computedStyle = window.getComputedStyle(element);
        const styles = {};
        
        for (const property of this.allowedProperties) {
            styles[property] = computedStyle.getPropertyValue(property);
        }
        
        return styles;
    }

    /**
     * 数値スタイルを設定する
     * @param {HTMLElement} element - 数値スタイル取得元の要素
     */
    setNumberStyle(element) {
        this.styles.number = this.extractStyles(element);
    }

    /**
     * 説明文スタイルを設定する
     * @param {HTMLElement} element - 説明文スタイル取得元の要素
     */
    setDescriptionStyle(element) {
        this.styles.description = this.extractStyles(element);
    }

    /**
     * ラベルスタイルを設定する
     * @param {HTMLElement} element - ラベルスタイル取得元の要素
     */
    setLabelStyle(element) {
        this.styles.label = this.extractStyles(element);
    }

    /**
     * 数値スタイルを要素に適用する
     * @param {HTMLElement} element - 適用先の要素
     */
    applyNumberStyle(element) {
        Object.assign(element.style, this.styles.number);
    }

    /**
     * 説明文スタイルを要素に適用する
     * @param {HTMLElement} element - 適用先の要素
     */
    applyDescriptionStyle(element) {
        Object.assign(element.style, this.styles.description);
    }

    /**
     * ラベルスタイルを要素に適用する
     * @param {HTMLElement} element - 適用先の要素
     */
    applyLabelStyle(element) {
        Object.assign(element.style, this.styles.label);
    }

    /**
     * スタイル適用関数のオブジェクトを取得する
     * @returns {object} スタイル適用関数のオブジェクト
     */
    getStyleAppliers() {
        return {
            applyDescriptionStyle: (element) => this.applyDescriptionStyle(element),
            applyLabelStyle: (element) => this.applyLabelStyle(element),
            applyNumberStyle: (element) => this.applyNumberStyle(element)
        };
    }

    /**
     * 説明用要素を検索して設定する
     * @param {HTMLElement} containerElement - 検索対象のコンテナ要素
     * @param {string[]} searchKeys - 検索キーワード配列
     * @returns {boolean} 設定成功フラグ
     */
    findAndSetDescriptionStyle(containerElement, searchKeys) {
        const descriptionElements = containerElement.querySelectorAll('div');
        
        for (const el of descriptionElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                const textContent = el.textContent;
                for (const key of searchKeys) {
                    if (textContent.includes(key)) {
                        this.setDescriptionStyle(el);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * ラベル用要素を検索して設定する
     * @param {HTMLElement} containerElement - 検索対象のコンテナ要素
     * @param {string} searchKey - 検索キーワード
     * @returns {boolean} 設定成功フラグ
     */
    findAndSetLabelStyle(containerElement, searchKey) {
        const labelElements = containerElement.querySelectorAll('p');
        
        for (const el of labelElements) {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                if (el.textContent.includes(searchKey)) {
                    this.setLabelStyle(el);
                    return true;
                }
            }
        }
        return false;
    }
}