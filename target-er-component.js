/**
 * 目標チャージ効率UI管理クラス
 * mark-props内のmain-props、sub-propsの下に目標チャージ効率入力欄を追加・管理する
 */
class TargetERComponent {
    constructor() {
        this.elementId = 'target-er-input';
        this.isEnabled = true; // デフォルトは表示
        this.currentCharacterName = '';
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
     */
    async showTargetERInput(pageLocaleManager) {
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
            const targetERElement = this.createTargetERElement(pageLocaleManager, savedValue);

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
     * @param {number} savedValue - 保存された値
     * @returns {HTMLElement} 作成された入力要素
     */
    createTargetERElement(pageLocaleManager, savedValue) {
        const container = document.createElement('div');
        container.id = this.elementId;
        container.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
        `;

        // ラベル作成
        const label = document.createElement('span');
        label.style.cssText = `
            font-size: 14px;
            color: #333;
            font-weight: 500;
        `;
        
        // 多言語対応
        const messages = {
            'ja': '目標チャージ効率:',
            'en': 'Target Energy Recharge:'
        };
        const currentLang = pageLocaleManager.currentPageLocale || 'ja';
        label.textContent = messages[currentLang] || messages['ja'];

        // 入力欄作成
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '100';
        input.max = '999';
        input.step = '1';
        input.value = savedValue || '';
        input.placeholder = '0';
        input.style.cssText = `
            width: 80px;
            padding: 4px 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 13px;
            text-align: center;
        `;

        // 単位ラベル
        const unit = document.createElement('span');
        unit.textContent = '%';
        unit.style.cssText = `
            font-size: 14px;
            color: #666;
            margin-left: 4px;
        `;

        // 保存ボタン作成
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.style.cssText = `
            margin-left: 8px;
            padding: 4px 8px;
            border: 1px solid #4285f4;
            border-radius: 3px;
            background: #4285f4;
            color: white;
            font-size: 12px;
            cursor: pointer;
        `;

        // 保存ボタンのイベントリスナー
        saveButton.addEventListener('click', () => {
            const value = parseFloat(input.value);
            if (!isNaN(value) && value > 0) {
                this.saveTargetERValue(this.currentCharacterName, value);
            }
        });

        // Enterキーでも保存できるようにする
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = parseFloat(input.value);
                if (!isNaN(value) && value > 0) {
                    this.saveTargetERValue(this.currentCharacterName, value);
                }
            }
        });

        // 要素を組み立て
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';
        inputContainer.appendChild(input);
        inputContainer.appendChild(unit);
        inputContainer.appendChild(saveButton);

        container.appendChild(label);
        container.appendChild(inputContainer);

        return container;
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