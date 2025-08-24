/**
 * Popup スクリプト
 * スコア計算方式の選択UI を提供する
 */

/**
 * ブラウザの言語設定に基づいてメッセージを取得する
 * @returns {Object} 言語に対応したメッセージオブジェクト
 */
function getMessages() {
    const lang = navigator.language.split('-')[0]; // "en-US" → "en"
    const messages = {
        ja: {
            calculationMethodLabel: 'スコア計算方式:',
            scoreMethodStrictName: '厳密型',
            scoreMethodPopularName: '普及型',
            scoreMethodDescription: 'スコア = ステータス値 × スコア係数',
            statName: 'ステータス',
            multiplier: 'スコア係数',
            critDMG: '会心ダメージ',
            critRate: '会心率',
            atkPercent: '攻撃力%',
            hpPercent: 'HP%',
            defPercent: '防御力%',
            elementalMastery: '元素熟知',
            energyRecharge: '元素チャージ効率',
            targetEnergyRechargeDisplay: '目標チャージ効率 表示'
        },
        en: {
            calculationMethodLabel: 'Calculation Method:',
            scoreMethodStrictName: 'Strict',
            scoreMethodPopularName: 'Popular',
            scoreMethodDescription: 'Score = Stat Value × Score Coefficient',
            statName: 'Stat',
            multiplier: 'Score Coefficient',
            critDMG: 'CRIT DMG',
            critRate: 'CRIT Rate',
            atkPercent: 'ATK%',
            hpPercent: 'HP%',
            defPercent: 'DEF%',
            elementalMastery: 'Elemental Mastery',
            energyRecharge: 'Energy Recharge',
            targetEnergyRechargeDisplay: 'Target Energy Recharge Display'
        }
    };
    return messages[lang] || messages['ja']; // フォールバック
}

// config.jsのデータを使用して多言語対応のスコア計算方式オブジェクトを作成
function createLocalizedScoreCalculationMethods() {
    const messages = getMessages();
    return Object.freeze({
        STRICT: {
            name: messages.scoreMethodStrictName,
            description: messages.scoreMethodDescription,
            multipliers: SCORE_CALCULATION_METHODS.STRICT.multipliers
        },
        POPULAR: {
            name: messages.scoreMethodPopularName,
            description: messages.scoreMethodDescription,
            multipliers: SCORE_CALCULATION_METHODS.POPULAR.multipliers
        }
    });
}

const LOCALIZED_SCORE_METHODS = createLocalizedScoreCalculationMethods();

// デフォルト設定
const DEFAULT_METHOD = 'STRICT';
const STORAGE_KEY = 'selectedCalculationMethod';
const TARGET_ER_DISPLAY_KEY = 'targetEnergyRechargeDisplay';

// DOM要素
let calculationMethodSelect;
let methodDescriptionDiv;
let targetEnergyRechargeToggle;
let statusDiv;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    await initializeUI();
    setupEventListeners();
});

/**
 * DOM要素の初期化
 */
function initializeElements() {
    calculationMethodSelect = document.getElementById('calculationMethod');
    methodDescriptionDiv = document.getElementById('methodDescription');
    targetEnergyRechargeToggle = document.getElementById('targetEnergyRechargeToggle');
    statusDiv = document.getElementById('status');
}

/**
 * UIの初期化
 */
async function initializeUI() {
    try {
        // 国際化対応
        updateI18nText();
        
        // プルダウンのオプションを生成
        populateMethodOptions();
        
        // 保存された設定を読み込み
        const savedMethod = await loadSavedMethod();
        const savedToggleState = await loadTargetERDisplaySetting();
        
        // 選択状態を復元
        calculationMethodSelect.value = savedMethod;
        updateDescription(savedMethod);
        updateToggleState(savedToggleState);
        
    } catch (error) {
        console.error('Failed to initialize popup UI:', error);
        showStatus('初期化に失敗しました', 'error');
    }
}

/**
 * 国際化対応のテキスト更新
 */
function updateI18nText() {
    const messages = getMessages();
    
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = messages[key];
        if (message) {
            element.textContent = message;
        }
    });
}

/**
 * プルダウンのオプションを生成
 */
function populateMethodOptions() {
    // 既存のオプションをクリア
    calculationMethodSelect.innerHTML = '';
    
    // 各計算方式をオプションとして追加
    Object.entries(LOCALIZED_SCORE_METHODS).forEach(([key, method]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = method.name;
        calculationMethodSelect.appendChild(option);
    });
}

/**
 * スコア係数表のHTMLを生成する
 * @param {string} methodKey - 計算方式のキー（STRICT/POPULAR）
 * @returns {string} 表形式のHTML
 */
function generateScoreTable(methodKey) {
    const messages = getMessages();
    const multipliers = LOCALIZED_SCORE_METHODS[methodKey].multipliers;
    
    const statNames = {
        CRIT_DMG: messages.critDMG,
        CRIT_RATE: messages.critRate,
        ATK_PERCENT: messages.atkPercent,
        HP_PERCENT: messages.hpPercent,
        DEF_PERCENT: messages.defPercent,
        ELEMENTAL_MASTERY: messages.elementalMastery,
        ENERGY_RECHARGE: messages.energyRecharge
    };
    
    // 数値を省略表記に変換
    const formatMultiplier = (value) => {
        if (value === 1.0) return '1.0';
        if (value === 2.0) return '2.0';
        // 割り切れない数値は3桁で切って省略記号を付ける
        const rounded = Math.round(value * 1000) / 1000;
        const str = rounded.toString();
        if (str !== value.toString() && value % 1 !== 0) {
            return str + '...';
        }
        return rounded.toString();
    };
    
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: 500;">${messages.statName}</th>
                    <th style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: 500;">${messages.multiplier}</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.entries(multipliers).forEach(([statKey, multiplier]) => {
        if (multiplier > 0) { // 実数ステータス(0)は表示しない
            tableHTML += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 6px;">${statNames[statKey]}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${formatMultiplier(multiplier)}</td>
                </tr>
            `;
        }
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    return tableHTML;
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    calculationMethodSelect.addEventListener('change', handleMethodChange);
    targetEnergyRechargeToggle.addEventListener('click', handleToggleChange);
}

/**
 * 計算方式変更のハンドラ
 */
async function handleMethodChange(event) {
    const selectedMethod = event.target.value;
    
    try {
        // 選択された方式を保存
        await saveSelectedMethod(selectedMethod);
        
        // 説明文を更新
        updateDescription(selectedMethod);
        
        // 成功メッセージを表示
        showStatus('設定を保存しました', 'success');
        
        // content script に変更を通知
        await notifyContentScript(selectedMethod);
        
    } catch (error) {
        console.error('Failed to save calculation method:', error);
        showStatus('設定の保存に失敗しました', 'error');
    }
}

/**
 * 説明文の更新
 */
function updateDescription(methodKey) {
    const method = LOCALIZED_SCORE_METHODS[methodKey];
    if (method) {
        // 補足情報と詳細な係数表を表示
        const descriptionText = `<div style="font-size: 11px; color: #888;">${method.description}</div>`;
        const tableHTML = generateScoreTable(methodKey);
        methodDescriptionDiv.innerHTML = tableHTML + descriptionText;
    }
}

/**
 * ステータスメッセージの表示
 */
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // 3秒後に非表示
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

/**
 * 保存された計算方式を読み込み
 */
async function loadSavedMethod() {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEY);
        return result[STORAGE_KEY] || DEFAULT_METHOD;
    } catch (error) {
        console.error('Failed to load saved method:', error);
        return DEFAULT_METHOD;
    }
}

/**
 * 選択された計算方式を保存
 */
async function saveSelectedMethod(method) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: method });
    } catch (error) {
        console.error('Failed to save method:', error);
        throw error;
    }
}

/**
 * content script に設定変更を通知
 */
async function notifyContentScript(selectedMethod) {
    try {
        // 対象URLにマッチするすべてのタブを取得
        const tabs = await chrome.tabs.query({
            url: 'https://act.hoyolab.com/app/community-game-records-sea/index.html*'
        });
        
        let successCount = 0;
        let errorCount = 0;
        
        // 各タブに設定変更を通知
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'CALCULATION_METHOD_CHANGED',
                    method: selectedMethod
                });
                successCount++;
            } catch (error) {
                errorCount++;
                // content scriptが読み込まれていない場合は警告を出さない
                if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
                    console.warn(`Failed to notify tab ${tab.id}:`, error.message);
                }
            }
        }
        
        // 通知完了（詳細ログは不要）
        
    } catch (error) {
        console.error('Failed to query tabs or send notifications:', error);
    }
}

/**
 * トグル変更のハンドラ
 */
async function handleToggleChange() {
    const isActive = targetEnergyRechargeToggle.classList.contains('active');
    const newState = !isActive;
    
    try {
        // 設定を保存
        await chrome.storage.local.set({ [TARGET_ER_DISPLAY_KEY]: newState });
        
        // UI状態を更新
        updateToggleState(newState);
        
        // content scriptに通知
        await notifyTargetERDisplayChange(newState);
        
    } catch (error) {
        console.error('Failed to save toggle setting:', error);
        showStatus('設定の保存に失敗しました', 'error');
    }
}

/**
 * トグル状態を更新
 */
function updateToggleState(isActive) {
    if (isActive) {
        targetEnergyRechargeToggle.classList.add('active');
    } else {
        targetEnergyRechargeToggle.classList.remove('active');
    }
}

/**
 * 目標チャージ効率表示設定を読み込み
 */
async function loadTargetERDisplaySetting() {
    try {
        const result = await chrome.storage.local.get(TARGET_ER_DISPLAY_KEY);
        return result[TARGET_ER_DISPLAY_KEY] !== undefined ? result[TARGET_ER_DISPLAY_KEY] : true; // デフォルトはオン
    } catch (error) {
        console.error('Failed to load target ER display setting:', error);
        return true; // デフォルト値
    }
}

/**
 * content scriptに目標チャージ効率表示変更を通知
 */
async function notifyTargetERDisplayChange(isEnabled) {
    try {
        const tabs = await chrome.tabs.query({
            url: 'https://act.hoyolab.com/app/community-game-records-sea/index.html*'
        });
        
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'TARGET_ER_DISPLAY_CHANGED',
                    enabled: isEnabled
                });
            } catch (error) {
                // content scriptが読み込まれていない場合は警告を出さない
                if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
                    console.warn(`Failed to notify tab ${tab.id}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Failed to query tabs or send notifications:', error);
    }
}