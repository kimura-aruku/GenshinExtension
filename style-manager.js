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
            [STYLE_TYPES.BUTTON]: ['background-color', 'outline', 'color', 'border', 'text-align', 'font-family', 'font-weight', 'border-radius', 'cursor']
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
     * 要素からスタイルを抽出する（ホバースタイル対応）
     * @param {HTMLElement} element - スタイル取得元の要素
     * @param {string} styleType - スタイルタイプ
     * @returns {{ [key: string]: string, hoverStyles?: { [key: string]: string } }} スタイルオブジェクト
     */
    extractStyles(element, styleType) {
        const computedStyle = window.getComputedStyle(element);
        const styles = {};
        
        const properties = this.allowedProperties[styleType] || this.allowedProperties[STYLE_TYPES.LABEL];
        
        for (const property of properties) {
            styles[property] = computedStyle.getPropertyValue(property);
        }
        
        // ボタンタイプの場合はホバースタイルを取得
        if (styleType === STYLE_TYPES.BUTTON) {
            styles.hoverStyles = this.extractHoverStyles(element);
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
     * ボタンのホバースタイルを取得する
     * @param {HTMLElement} element - スタイル取得元の要素
     * @returns {{ [key: string]: string }} ホバースタイルオブジェクト
     */
    extractHoverStyles(element) {
        const hoverStyles = {};
        
        // 通常状態のスタイルを取得（比較用）
        const normalComputedStyle = window.getComputedStyle(element);
        const normalBgColor = normalComputedStyle.getPropertyValue('background-color');
        
        // :hover疑似クラスから直接スタイルを取得
        try {
            const hoverComputedStyle = window.getComputedStyle(element, ':hover');
            const hoverBgColor = hoverComputedStyle.getPropertyValue('background-color');
            
            // 通常時と異なる場合のみ設定
            if (hoverBgColor && hoverBgColor !== normalBgColor) {
                hoverStyles['background-color'] = hoverBgColor;
            }
        } catch (error) {
            // 無視してフォールバックに進む
        }
        
        // フォールバック：CSS規則から直接取得を試行
        if (!hoverStyles['background-color']) {
            try {
                const rules = Array.from(document.styleSheets)
                    .flatMap(sheet => {
                        try {
                            return Array.from(sheet.cssRules || sheet.rules || []);
                        } catch (e) {
                            return [];
                        }
                    });
                
                // ボタンのホバー規則を検索
                const hoverRules = rules.filter(rule => {
                    if (!rule.selectorText) return false;
                    const selector = rule.selectorText.toLowerCase();
                    return selector.includes('gt-button-ys') && selector.includes(':hover');
                });
                
                for (const hoverRule of hoverRules) {
                    // background-colorを取得
                    const hoverBgFromCSS = hoverRule.style.getPropertyValue('background-color') || 
                                          hoverRule.style.backgroundColor ||
                                          hoverRule.style.background;
                    
                    if (hoverBgFromCSS && hoverBgFromCSS !== normalBgColor) {
                        // CSS変数を実際の色に解決
                        const resolvedColor = this.resolveCSSVariable(hoverBgFromCSS, element);
                        hoverStyles['background-color'] = resolvedColor || hoverBgFromCSS;
                        break;
                    }
                }
            } catch (error) {
                // エラー時は無視
            }
        }
        
        return hoverStyles;
    }

    /**
     * CSS変数を実際の色値に解決する
     * @param {string} cssValue - CSS変数を含む可能性がある値
     * @param {HTMLElement} element - 変数を解決するためのコンテキスト要素
     * @returns {string|null} 解決された色値
     */
    resolveCSSVariable(cssValue, element) {
        try {
            // CSS変数（var()）が含まれているかチェック
            if (!cssValue.includes('var(')) {
                return cssValue;
            }
            
            // 一時的な要素を作成してCSS変数を解決
            const tempElement = document.createElement('div');
            tempElement.style.backgroundColor = cssValue;
            tempElement.style.position = 'absolute';
            tempElement.style.visibility = 'hidden';
            tempElement.style.pointerEvents = 'none';
            
            // 元の要素と同じ親に挿入してコンテキストを継承
            element.parentNode.appendChild(tempElement);
            
            // computedStyleで実際の色を取得
            const computedColor = window.getComputedStyle(tempElement).backgroundColor;
            
            // 一時要素を削除
            tempElement.remove();
            
            return computedColor || null;
            
        } catch (error) {
            // フォールバック：CSS変数のフォールバック値を抽出
            const fallbackMatch = cssValue.match(/var\([^,]+,\s*([^)]+)\)/);
            if (fallbackMatch) {
                const fallbackColor = fallbackMatch[1].trim();
                return fallbackColor;
            }
            
            return null;
        }
    }

    /**
     * 汎用スタイル適用メソッド（ホバースタイル対応）
     * @param {string} styleType - スタイルタイプ（STYLE_TYPESの値）
     * @param {HTMLElement} element - 適用先の要素
     */
    applyStyle(styleType, element) {
        this.validateStyleType(styleType);
        const styles = this.styles[styleType];
        
        // 通常のスタイルを適用（hoverStyles以外）
        const { hoverStyles, ...normalStyles } = styles;
        Object.assign(element.style, normalStyles);
        
        // ボタンタイプの場合はホバーイベントを追加
        if (styleType === STYLE_TYPES.BUTTON && hoverStyles) {
            this.addHoverEvents(element, normalStyles['background-color'], hoverStyles['background-color']);
        }
    }

    /**
     * ボタンにホバーイベントを追加する
     * @param {HTMLElement} element - 対象要素
     * @param {string} normalBgColor - 通常時の背景色
     * @param {string} hoverBgColor - ホバー時の背景色
     */
    addHoverEvents(element, normalBgColor, hoverBgColor) {
        element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = hoverBgColor;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = normalBgColor;
        });
    }
}