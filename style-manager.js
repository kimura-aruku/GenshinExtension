/**
 * スタイル管理クラス
 * オリジナルページからのスタイル取得・保持・適用を管理
 */
class StyleManager {
    constructor() {
        // スタイルキャッシュ（configのSTYLE_TYPESから動的に初期化）
        this.styles = {};
        Object.values(STYLE_TYPES).forEach(type => {
            this.styles[type] = {};
        });
        
        // コピー対象のスタイルプロパティ
        this.allowedProperties = Object.freeze([
            'font-size', 'text-align', 'font-family', 'color'
        ]);
    }

    /**
     * スタイルタイプのバリデーション
     * @param {string} styleType - スタイルタイプ
     * @throws {Error} 無効なスタイルタイプの場合
     */
    validateStyleType(styleType) {
        if (!Object.values(STYLE_TYPES).includes(styleType)) {
            throw new Error(`Invalid style type: ${styleType}. Valid types: ${Object.values(STYLE_TYPES).join(', ')}`);
        }
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
     * 汎用スタイル設定メソッド
     * @param {string} styleType - スタイルタイプ（STYLE_TYPESの値）
     * @param {HTMLElement} element - スタイル取得元の要素
     */
    setStyle(styleType, element) {
        this.validateStyleType(styleType);
        this.styles[styleType] = this.extractStyles(element);
    }

    /**
     * 汎用スタイル適用メソッド
     * @param {string} styleType - スタイルタイプ（STYLE_TYPESの値）
     * @param {HTMLElement} element - 適用先の要素
     */
    applyStyle(styleType, element) {
        this.validateStyleType(styleType);
        Object.assign(element.style, this.styles[styleType]);
    }
}