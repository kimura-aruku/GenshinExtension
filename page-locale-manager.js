/**
 * ページ言語管理クラス
 * HoYoLABページの言語設定を検知し、適切なメッセージを提供する
 */
class PageLocaleManager {
    constructor() {
        // 現在のページ言語
        this.currentPageLocale = null;
        this.fallbackLocale = 'ja';
        
        // サポート言語リスト
        this.supportedLocales = ['ja', 'en'];
        
        // ページ言語マッピング（HoYoLABの言語表示 → locale）
        this.pageLanguageMapping = {
            'JP': 'ja',
            'EN': 'en',
            '日本語': 'ja',
            'English': 'en'
        };
        
        // 言語別メッセージ定義（chrome.i18nの代替）
        this.messages = {
            en: {
                setupKeywordHighlightedStats: 'The marked recommended affixes',
                setupKeywordFirstAccess: 'When you enter for the first time',
                setupKeywordAdditionalStats: 'Minor Affixes',
                errorGeneral: 'Error:',
                errorScoreElementNotFound: 'Score display element not found',
                scoreDescription: 'Scores are calculated from Minor Affixes.',
                totalScore: 'Total Score',
                itemScore: 'Score',
                statHP: 'HP',
                statHPPercent: 'HP Percentage',
                statATK: 'ATK',
                statATKPercent: 'ATK Percentage',
                statDEF: 'DEF',
                statDEFPercent: 'DEF Percentage',
                statCritRate: 'CRIT Rate',
                statCritDMG: 'CRIT DMG',
                statElementalMastery: 'Elemental Mastery',
                statEnergyRecharge: 'Energy Recharge',
                noArtifactsEquipped: 'No Artifacts equipped',
                subtotalScoreLabel: 'Subtotal Score',
                excessScoreLabel: 'Excess Score'
            },
            ja: {
                setupKeywordHighlightedStats: 'ハイライトされたステータス',
                setupKeywordFirstAccess: '初めてアクセスした',
                setupKeywordAdditionalStats: '追加ステータス',
                errorGeneral: 'エラー:',
                errorScoreElementNotFound: 'スコア表示要素が見つかりませんでした',
                scoreDescription: 'スコアは追加ステータスから算出されます。',
                totalScore: '合計スコア',
                itemScore: 'スコア',
                statHP: 'HP',
                statHPPercent: 'HPパーセンテージ',
                statATK: '攻撃力',
                statATKPercent: '攻撃力パーセンテージ',
                statDEF: '防御力',
                statDEFPercent: '防御力パーセンテージ',
                statCritRate: '会心率',
                statCritDMG: '会心ダメージ',
                statElementalMastery: '元素熟知',
                statEnergyRecharge: '元素チャージ効率',
                noArtifactsEquipped: '聖遺物を装備していません',
                subtotalScoreLabel: '小計スコア',
                excessScoreLabel: '超過スコア'
            }
        };
    }

    /**
     * 言語選択要素から言語設定を検知する
     * @param {HTMLElement} languageElement - 言語選択要素
     * @returns {string} 検知された言語コード（ja/en）
     */
    detectPageLanguage(languageElement) {
        try {
            if (languageElement) {
                const languageText = (languageElement.textContent || languageElement.innerText || '').trim();
                
                // マッピングから言語コードを取得
                for (const [pageText, locale] of Object.entries(this.pageLanguageMapping)) {
                    if (languageText.includes(pageText)) {
                        this.currentPageLocale = locale;
                        return locale;
                    }
                }
            }
            
            // フォールバック: ブラウザの言語設定を使用
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLocales.includes(browserLang)) {
                this.currentPageLocale = browserLang;
                return browserLang;
            }
            
            // 最後の手段としてフォールバック言語
            this.currentPageLocale = this.fallbackLocale;
            return this.fallbackLocale;
            
        } catch (error) {
            console.warn('Failed to detect page language, using fallback:', error);
            this.currentPageLocale = this.fallbackLocale;
            return this.fallbackLocale;
        }
    }

    /**
     * 指定された言語のメッセージオブジェクトを取得する
     * @param {string} locale - 言語コード
     * @returns {Object} メッセージオブジェクト
     */
    getMessages(locale) {
        return this.messages[locale] || this.messages[this.fallbackLocale] || {};
    }

    /**
     * 現在のページ言語に適したメッセージを取得する
     * @param {string} key - メッセージキー
     * @returns {string} メッセージ文字列
     */
    getMessage(key) {
        const locale = this.currentPageLocale || this.fallbackLocale;
        const messages = this.getMessages(locale);
        return messages[key] || key;
    }

    /**
     * 複数のメッセージキーを一度に取得する
     * @param {string[]} keys - メッセージキーの配列
     * @returns {Object} キー→メッセージのマッピング
     */
    getMessagesByKeys(keys) {
        const locale = this.currentPageLocale || this.fallbackLocale;
        const messages = this.getMessages(locale);
        
        const result = {};
        for (const key of keys) {
            result[key] = messages[key] || key;
        }
        
        return result;
    }

    /**
     * 現在のページ言語コードを取得
     * @returns {string} 言語コード
     */
    getCurrentLocale() {
        return this.currentPageLocale || this.detectPageLanguage();
    }

    /**
     * 言語が変更されたかをチェックする
     * @param {HTMLElement} languageElement - 言語選択要素
     * @returns {boolean} 言語が変更されたかどうか
     */
    checkLanguageChange(languageElement) {
        const oldLocale = this.currentPageLocale;
        const newLocale = this.detectPageLanguage(languageElement);
        
        return oldLocale !== newLocale;
    }
}