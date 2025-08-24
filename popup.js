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
            scoreMethodStrictDescription: '会心ダメージ:会心率:攻撃力% = 1:2:1.333...',
            scoreMethodPopularName: '普及型',
            scoreMethodPopularDescription: '会心ダメージ:会心率:攻撃力% = 1:2:1'
        },
        en: {
            calculationMethodLabel: 'Calculation Method:',
            scoreMethodStrictName: 'Strict',
            scoreMethodStrictDescription: 'CRIT DMG:CRIT Rate:ATK% = 1:2:1.333...',
            scoreMethodPopularName: 'Popular',
            scoreMethodPopularDescription: 'CRIT DMG:CRIT Rate:ATK% = 1:2:1'
        }
    };
    return messages[lang] || messages['ja']; // フォールバック
}

// config.js から必要な定数を読み込み
// Manifest V3では content script の変数に直接アクセスできないため、
// 必要な定数をここで再定義する
function createScoreCalculationMethods() {
    const messages = getMessages();
    return Object.freeze({
        STRICT: {
            name: messages.scoreMethodStrictName,
            description: messages.scoreMethodStrictDescription
        },
        POPULAR: {
            name: messages.scoreMethodPopularName,
            description: messages.scoreMethodPopularDescription
        }
    });
}

const SCORE_CALCULATION_METHODS = createScoreCalculationMethods();

// デフォルト設定
const DEFAULT_METHOD = 'STRICT';
const STORAGE_KEY = 'selectedCalculationMethod';

// DOM要素
let calculationMethodSelect;
let methodDescriptionDiv;
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
        
        // 選択状態を復元
        calculationMethodSelect.value = savedMethod;
        updateDescription(savedMethod);
        
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
    Object.entries(SCORE_CALCULATION_METHODS).forEach(([key, method]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = method.name;
        calculationMethodSelect.appendChild(option);
    });
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    calculationMethodSelect.addEventListener('change', handleMethodChange);
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
    const method = SCORE_CALCULATION_METHODS[methodKey];
    if (method) {
        methodDescriptionDiv.textContent = method.description;
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
                console.warn(`Failed to notify tab ${tab.id}:`, error.message);
            }
        }
        
        // 通知完了（詳細ログは不要）
        
    } catch (error) {
        console.error('Failed to query tabs or send notifications:', error);
    }
}