/**
 * スコア計算の設定・定数ファイル
 * スコア計算の倍率や定数をここで一元管理する
 * 将来的に複数のスコア計算方式を切り替え可能にする
 */

// ステータス名の定数
const PROP_NAME = Object.freeze({
    HP: 'HP',
    HP_PERCENT: 'HPパーセンテージ',
    ATK: '攻撃力',
    ATK_PERCENT: '攻撃力パーセンテージ',
    DEF: '防御力',
    DEF_PERCENT: '防御力パーセンテージ',
    CRIT_RATE: '会心率',
    CRIT_DMG: '会心ダメージ',
    ELEMENTAL_MASTERY: '元素熟知',
    ENERGY_RECHARGE: '元素チャージ効率'
});

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
        name: '厳密型',
        description: '会心ダメージ:会心率:攻撃力% = 1:2:1.333...',
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
        name: '普及型',
        description: '会心ダメージ:会心率:攻撃力% = 1:2:1',
        baseValue: STAT_MAX_VALUES.CRIT_DMG,  // 62.2を基準値とする
        multipliers: {
            CRIT_RATE: 2.0,  // 会心率は2倍換算
            CRIT_DMG: 1.0,   // 会心ダメージは等倍（基準値）
            ATK_PERCENT: 1.0,     // 攻撃力%は等倍
            HP_PERCENT: 1.0,      // HP%は等倍
            DEF_PERCENT: 1.0,     // 防御力%は等倍
            ELEMENTAL_MASTERY: 1.0,   // 元素熟知は等倍
            ENERGY_RECHARGE: 1.0,     // 元素チャージ効率は等倍
            REAL_STATS: 0    // 実数ステータスはスコア対象外
        }
    }
});

// 現在使用するスコア計算方式（将来的に設定UIで変更可能にする）
const CURRENT_CALCULATION_METHOD = 'STRICT';

// 現在の設定から計算倍率を取得する関数
function getCurrentScoreMultipliers() {
    return SCORE_CALCULATION_METHODS[CURRENT_CALCULATION_METHOD].multipliers;
}

// Chrome拡張の設定
const EXTENSION_CONFIG = Object.freeze({
    ELEMENT_ID: 'alk-element',     // Chrome拡張の要素ID
    WAIT_TIMEOUT: 10000,           // 要素待機のタイムアウト（ミリ秒）
    DEFAULT_METHOD: CURRENT_CALCULATION_METHOD  // デフォルトのスコア計算方式
});

// グローバルに利用可能にする
window.PROP_NAME = PROP_NAME;
window.STAT_MAX_VALUES = STAT_MAX_VALUES;
window.SCORE_CALCULATION_METHODS = SCORE_CALCULATION_METHODS;
window.CURRENT_CALCULATION_METHOD = CURRENT_CALCULATION_METHOD;
window.getCurrentScoreMultipliers = getCurrentScoreMultipliers;
window.EXTENSION_CONFIG = EXTENSION_CONFIG;

// 後方互換性のため、現在の計算方式の倍率を直接参照できるようにする
window.SCORE_MULTIPLIERS = getCurrentScoreMultipliers();