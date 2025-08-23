/**
 * スコア計算の設定・定数ファイル
 * スコア計算の倍率や定数をここで一元管理する
 * 将来的に複数のスコア計算方式を切り替え可能にする
 */

// ステータス名の定数（多言語対応）
// 注意: この定数はPageLocaleManagerで動的に初期化される
let PROP_NAME = {};

// PageLocaleManagerで初期化する関数
function initializePropNames(pageLocaleManager) {
    const messages = pageLocaleManager.getMessagesByKeys([
        'statHP', 'statHPPercent', 'statATK', 'statATKPercent',
        'statDEF', 'statDEFPercent', 'statCritRate', 'statCritDMG',
        'statElementalMastery', 'statEnergyRecharge'
    ]);
    
    PROP_NAME = Object.freeze({
        HP: messages.statHP,
        HP_PERCENT: messages.statHPPercent,
        ATK: messages.statATK,
        ATK_PERCENT: messages.statATKPercent,
        DEF: messages.statDEF,
        DEF_PERCENT: messages.statDEFPercent,
        CRIT_RATE: messages.statCritRate,
        CRIT_DMG: messages.statCritDMG,
        ELEMENTAL_MASTERY: messages.statElementalMastery,
        ENERGY_RECHARGE: messages.statEnergyRecharge
    });
    
    return PROP_NAME;
}

// 各ステータスの最大値（サブステータス）
const STAT_MAX_VALUES = Object.freeze({
    CRIT_RATE: 31.1,        // 会心率の最大値
    CRIT_DMG: 62.2,         // 会心ダメージの最大値
    ATK_PERCENT: 46.6,      // 攻撃力%の最大値
    HP_PERCENT: 46.6,       // HP%の最大値
    DEF_PERCENT: 58.3,      // 防御力%の最大値
    ELEMENTAL_MASTERY: 187.0,  // 元素熟知の最大値
    ENERGY_RECHARGE: 51.8   // 元素チャージ効率の最大値
});

// スコア計算方式の定義
const SCORE_CALCULATION_METHODS = Object.freeze({
    // 現在の厳密型計算方式（会心ダメージを基準値とする）
    STRICT: {
        name: chrome.i18n.getMessage('scoreMethodStrictName'),
        description: chrome.i18n.getMessage('scoreMethodStrictDescription'),
        baseValue: STAT_MAX_VALUES.CRIT_DMG,  // 62.2を基準値とする
        multipliers: {
            CRIT_RATE: 2.0,  // 会心率は2倍換算
            CRIT_DMG: 1.0,   // 会心ダメージは等倍（基準値）
            ATK_PERCENT: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.ATK_PERCENT,    // 62.2/46.6 ≈ 1.333
            HP_PERCENT: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.HP_PERCENT,      // 62.2/46.6 ≈ 1.333
            DEF_PERCENT: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.DEF_PERCENT,    // 62.2/58.3 ≈ 1.067
            ELEMENTAL_MASTERY: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.ELEMENTAL_MASTERY,  // 62.2/187.0 ≈ 0.333
            ENERGY_RECHARGE: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.ENERGY_RECHARGE,      // 62.2/51.8 ≈ 1.201
            REAL_STATS: 0    // 実数ステータスはスコア対象外
        }
    },
    
    // 将来追加予定の普及型計算方式
    POPULAR: {
        name: chrome.i18n.getMessage('scoreMethodPopularName'),
        description: chrome.i18n.getMessage('scoreMethodPopularDescription'),
        baseValue: STAT_MAX_VALUES.CRIT_DMG,  // 62.2を基準値とする
        multipliers: {
            CRIT_RATE: 2.0,  // 会心率は2倍換算
            CRIT_DMG: 1.0,   // 会心ダメージは等倍（基準値）
            ATK_PERCENT: 1.0,     // 攻撃力%は等倍
            HP_PERCENT: 1.0,      // HP%は等倍
            DEF_PERCENT: 1.0,     // 防御力%は等倍
            ELEMENTAL_MASTERY: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.ELEMENTAL_MASTERY,  // 62.2/187.0 ≈ 0.333
            ENERGY_RECHARGE: STAT_MAX_VALUES.CRIT_DMG / STAT_MAX_VALUES.ENERGY_RECHARGE,      // 62.2/51.8 ≈ 1.201
            REAL_STATS: 0    // 実数ステータスはスコア対象外
        }
    }
});

// 現在使用するスコア計算方式（storageから読み込み、デフォルトは厳密型）
let CURRENT_CALCULATION_METHOD = 'STRICT';

// ストレージから設定を読み込む関数
async function loadCalculationMethod() {
    try {
        const result = await chrome.storage.sync.get('selectedCalculationMethod');
        const loadedMethod = result.selectedCalculationMethod || 'STRICT';
        updateCalculationMethod(loadedMethod);
        console.log(`Loaded calculation method: ${loadedMethod}`);
    } catch (error) {
        console.warn('Failed to load calculation method from storage:', error);
        updateCalculationMethod('STRICT');
    }
}

// 現在の設定から計算倍率を取得する関数
function getCurrentScoreMultipliers() {
    // windowオブジェクトから最新の値を取得
    const currentMethod = window.CURRENT_CALCULATION_METHOD || CURRENT_CALCULATION_METHOD;
    return SCORE_CALCULATION_METHODS[currentMethod].multipliers;
}

// 計算方式を更新する関数
function updateCalculationMethod(newMethod) {
    CURRENT_CALCULATION_METHOD = newMethod;
    window.CURRENT_CALCULATION_METHOD = newMethod;
    // SCORE_MULTIPLIERSも同期更新
    window.SCORE_MULTIPLIERS = getCurrentScoreMultipliers();
}

// スタイル管理用の定数
const STYLE_TYPES = Object.freeze({
    NUMBER: 'number',
    DESCRIPTION: 'description',
    LABEL: 'label'
});

// Chrome拡張の設定
const EXTENSION_CONFIG = Object.freeze({
    ELEMENT_ID: 'alk-element',     // Chrome拡張の要素ID
    WAIT_TIMEOUT: 10000,           // 要素待機のタイムアウト（ミリ秒）
    DEFAULT_METHOD: CURRENT_CALCULATION_METHOD  // デフォルトのスコア計算方式
});

// グローバルに利用可能にする
window.PROP_NAME = PROP_NAME;  // 初期化後に更新される
window.initializePropNames = initializePropNames;
window.STAT_MAX_VALUES = STAT_MAX_VALUES;
window.SCORE_CALCULATION_METHODS = SCORE_CALCULATION_METHODS;
window.CURRENT_CALCULATION_METHOD = CURRENT_CALCULATION_METHOD;
window.loadCalculationMethod = loadCalculationMethod;
window.getCurrentScoreMultipliers = getCurrentScoreMultipliers;
window.updateCalculationMethod = updateCalculationMethod;
window.STYLE_TYPES = STYLE_TYPES;
window.EXTENSION_CONFIG = EXTENSION_CONFIG;

// 後方互換性のため、現在の計算方式の倍率を直接参照できるようにする
// 注意: 動的に変更される可能性があるため、この値は初期化後に更新が必要
window.SCORE_MULTIPLIERS = getCurrentScoreMultipliers();