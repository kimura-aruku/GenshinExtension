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
        
        // コピー対象のスタイルプロパティ（スタイルタイプ別）
        this.allowedProperties = Object.freeze({
            [STYLE_TYPES.NUMBER]: ['font-size', 'text-align', 'font-family', 'color'],
            [STYLE_TYPES.DESCRIPTION]: ['font-size', 'text-align', 'font-family', 'color'],
            [STYLE_TYPES.LABEL]: ['font-size', 'text-align', 'font-family', 'color'],
            [STYLE_TYPES.BUTTON]: ['background-color', 'outline', 'color', 'border', 'text-align', 'font-family', 'font-weight', 'border-radius']
        });
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
     * @param {string} styleType - スタイルタイプ
     * @returns {{ [key: string]: string }} スタイルオブジェクト
     */
    extractStyles(element, styleType) {
        const computedStyle = window.getComputedStyle(element);
        const styles = {};
        
        const properties = this.allowedProperties[styleType] || this.allowedProperties[STYLE_TYPES.LABEL];
        
        for (const property of properties) {
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
        this.styles[styleType] = this.extractStyles(element, styleType);
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