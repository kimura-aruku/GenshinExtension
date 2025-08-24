/**
 * 目標チャージ効率UI管理クラス
 * mark-props内のmain-props、sub-propsの下に目標チャージ効率入力欄を追加・管理する
 */
class TargetERComponent {
    constructor() {
        this.elementId = 'target-er-input';
        this.isEnabled = true; // デフォルトは表示
        this.currentCharacterName = '';
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
            const response = await fetch(chrome.runtime.getURL('target-er-component.html'));
            this.templateCache = await response.text();
            return this.templateCache;
        } catch (error) {
            console.error('Failed to load target ER HTML template:', error);
            return this.getFallbackTemplate();
        }
    }

    /**
     * テンプレート読み込みに失敗した場合のフォールバック
     * @returns {string} 最小限のHTMLテンプレート
     */
    getFallbackTemplate() {
        return `
            <div class="target-er-input" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin: 8px 0;">
                <span class="target-er-label">目標チャージ効率:</span>
                <div style="display: flex; align-items: center;">
                    <input type="number" class="target-er-input-field" min="100" max="999" step="1" placeholder="0" data-target-er-value="">
                    <span class="target-er-unit">%</span>
                    <button class="target-er-save-button">保存</button>
                </div>
            </div>
        `;
    }

    /**
     * キャラクター名を検出する
     * @returns {string} キャラクター名
     */
    detectCharacterName() {
        try {
            const basicInfoElement = document.querySelector('.basic-info');
            if (!basicInfoElement) {
                return '';
            }

            // basic-info内の最初のテキストノードを探す
            const walker = document.createTreeWalker(
                basicInfoElement,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const text = node.textContent.trim();
                        // 空白文字や数字のみのテキストは除外
                        if (text && !/^\d+$/.test(text) && text.length > 1) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );

            const firstTextNode = walker.nextNode();
            const characterName = firstTextNode ? firstTextNode.textContent.trim() : '';
            return characterName;
        } catch (error) {
            console.error('Failed to detect character name:', error);
            return '';
        }
    }

    /**
     * 目標チャージ効率入力UIを作成・表示する
     * @param {PageLocaleManager} pageLocaleManager - 言語管理インスタンス
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     */
    async showTargetERInput(pageLocaleManager, styleManager) {
        if (!this.isEnabled) {
            this.hideTargetERInput();
            return;
        }

        // 既存の要素があれば削除
        this.hideTargetERInput();

        try {
            // 挿入位置を取得：mark-props内のsub-propsの後
            const markPropsElement = document.querySelector('.mark-props');
            const subPropsElement = markPropsElement?.querySelector('.sub-props');
            
            if (!markPropsElement || !subPropsElement) {
                console.warn('Required elements not found for target ER input');
                return;
            }

            // キャラクター名を検出
            this.currentCharacterName = this.detectCharacterName();
            
            // 保存された値を読み込み
            const savedValue = await this.loadTargetERValue(this.currentCharacterName);

            // 入力要素を作成
            const targetERElement = await this.createTargetERElement(pageLocaleManager, styleManager, savedValue);

            // sub-propsの後に挿入
            subPropsElement.insertAdjacentElement('afterend', targetERElement);

        } catch (error) {
            console.error('Failed to show target ER input:', error);
        }
    }

    /**
     * 目標チャージ効率入力UIを非表示にする
     */
    hideTargetERInput() {
        const existingElement = document.getElementById(this.elementId);
        if (existingElement) {
            existingElement.remove();
        }
    }

    /**
     * 目標チャージ効率入力要素を作成
     * @param {PageLocaleManager} pageLocaleManager - 言語管理インスタンス
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     * @param {number} savedValue - 保存された値
     * @returns {Promise<HTMLElement>} 作成された入力要素
     */
    async createTargetERElement(pageLocaleManager, styleManager, savedValue) {
        const template = await this.loadTemplate();
        
        // 一時的なコンテナでHTMLを解析
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        
        // メインの要素を取得
        const targetERElement = tempContainer.querySelector('.target-er-input');
        if (!targetERElement) {
            throw new Error('Target ER element not found in template');
        }

        // IDを設定
        targetERElement.id = this.elementId;
        
        // 言語対応のテキスト更新
        this.updateLocalizedText(targetERElement, pageLocaleManager);
        
        // 保存された値を設定
        const inputField = targetERElement.querySelector('.target-er-input-field');
        if (inputField && savedValue) {
            inputField.value = savedValue;
        }
        
        // スタイルを適用
        this.applyStyles(targetERElement, styleManager);
        
        // イベントリスナーを設定
        this.setupEventListeners(targetERElement);

        return targetERElement;
    }
    
    /**
     * ローカライズされたテキストを更新する
     * @param {HTMLElement} targetERElement - 目標ER要素
     * @param {PageLocaleManager} pageLocaleManager - 言語管理インスタンス
     */
    updateLocalizedText(targetERElement, pageLocaleManager) {
        // data-i18n属性を持つ全ての要素を取得
        const i18nElements = targetERElement.querySelectorAll('[data-i18n]');
        
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key === 'targetEnergyRecharge') {
                // 多言語対応
                const messages = {
                    'ja': '目標チャージ効率:',
                    'en': 'Target Energy Recharge:'
                };
                const currentLang = pageLocaleManager.currentPageLocale || 'ja';
                element.textContent = messages[currentLang] || messages['ja'];
            } else if (key === 'save') {
                const messages = {
                    'ja': '保存',
                    'en': 'Save'
                };
                const currentLang = pageLocaleManager.currentPageLocale || 'ja';
                element.textContent = messages[currentLang] || messages['ja'];
            }
        });
    }
    
    /**
     * オリジナルページのスタイルを適用する
     * @param {HTMLElement} targetERElement - 目標ER要素
     * @param {StyleManager} styleManager - スタイル管理インスタンス
     */
    applyStyles(targetERElement, styleManager) {
        // ラベルのスタイル適用
        const labelElement = targetERElement.querySelector('.target-er-label');
        if (labelElement) {
            styleManager.applyStyle(STYLE_TYPES.LABEL, labelElement);
        }
        
        // 単位のスタイル適用
        const unitElement = targetERElement.querySelector('.target-er-unit');
        if (unitElement) {
            styleManager.applyStyle(STYLE_TYPES.LABEL, unitElement);
        }
        
        // 入力欄のスタイル適用
        const inputElement = targetERElement.querySelector('.target-er-input-field');
        if (inputElement) {
            styleManager.applyStyle(STYLE_TYPES.NUMBER, inputElement);
        }
        
        // 保存ボタンのスタイル適用
        const saveButton = targetERElement.querySelector('.target-er-save-button');
        if (saveButton) {
            styleManager.applyStyle(STYLE_TYPES.LABEL, saveButton);
        }
    }
    
    /**
     * イベントリスナーを設定する
     * @param {HTMLElement} targetERElement - 目標ER要素
     */
    setupEventListeners(targetERElement) {
        const inputField = targetERElement.querySelector('.target-er-input-field');
        const saveButton = targetERElement.querySelector('.target-er-save-button');
        
        if (saveButton) {
            // 保存ボタンのイベントリスナー
            saveButton.addEventListener('click', () => {
                if (inputField) {
                    const value = parseFloat(inputField.value);
                    if (!isNaN(value) && value > 0) {
                        this.saveTargetERValue(this.currentCharacterName, value);
                    }
                }
            });
        }
        
        if (inputField) {
            // 入力値制限（3桁まで、数値のみ）
            inputField.addEventListener('input', (e) => {
                let value = e.target.value;
                // 数値以外の文字を除去（e、+、-、.なども含む）
                value = value.replace(/[^0-9]/g, '');
                // 3桁を超える場合は3桁に切り詰め
                if (value.length > 3) {
                    value = value.slice(0, 3);
                }
                // 999を超える場合は999に制限
                const numValue = parseInt(value);
                if (numValue > 999) {
                    value = '999';
                }
                e.target.value = value;
            });
            
            // Enterキーでも保存できるようにする
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = parseFloat(inputField.value);
                    if (!isNaN(value) && value > 0) {
                        this.saveTargetERValue(this.currentCharacterName, value);
                    }
                }
            });
        }
    }

    /**
     * キャラクター別の目標チャージ効率値を保存
     * @param {string} characterName - キャラクター名
     * @param {number} value - 目標チャージ効率値
     */
    async saveTargetERValue(characterName, value) {
        try {
            if (!characterName) {
                return;
            }
            
            const key = `targetER_${characterName}`;
            await chrome.storage.local.set({ [key]: value });
            
            // スコア計算の更新イベントを発火
            document.dispatchEvent(new CustomEvent('target-er-changed', {
                detail: { characterName, value }
            }));
            
        } catch (error) {
            console.error('Failed to save target ER value:', error);
        }
    }

    /**
     * キャラクター別の目標チャージ効率値を読み込み
     * @param {string} characterName - キャラクター名
     * @returns {Promise<number|null>} 保存された値
     */
    async loadTargetERValue(characterName) {
        try {
            if (!characterName) {
                return null;
            }
            
            const key = `targetER_${characterName}`;
            const result = await chrome.storage.local.get(key);
            const value = result[key] || null;
            return value;
            
        } catch (error) {
            console.error('Failed to load target ER value:', error);
            return null;
        }
    }

    /**
     * 表示状態を設定
     * @param {boolean} enabled - 表示するかどうか
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * 現在の目標チャージ効率値を取得
     * @returns {Promise<number|null>} 現在の値
     */
    async getCurrentTargetER() {
        // 毎回最新のキャラクター名を検出
        const currentCharacterName = this.detectCharacterName();
        const value = await this.loadTargetERValue(currentCharacterName);
        return value;
    }
}