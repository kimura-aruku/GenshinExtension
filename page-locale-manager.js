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
        this.supportedLocales = ['简', '繁', 'DE', 'EN', 'ES', 'FR', 'ID', 'IT', 'JP', 'KR', 'PT', 'RU', 'TH', 'TR', 'VN'];
        
        // ページ言語マッピング（HoYoLABの言語表示 → locale）
        this.pageLanguageMapping = {
            '简': '简',
            '简体中文': '简',
            '繁': '繁',
            '繁體中文': '繁',
            'DE': 'DE',
            'Deutsch': 'DE',
            'EN': 'EN',
            'English': 'EN',
            'ES': 'ES',
            'Español': 'ES',
            'FR': 'FR',
            'Français': 'FR',
            'ID': 'ID',
            'Indonesia': 'ID',
            'IT': 'IT',
            'Italiano': 'IT',
            'JP': 'JP',
            '日本語': 'JP',
            'KR': 'KR',
            '한국어': 'KR',
            'PT': 'PT',
            'Português': 'PT',
            'RU': 'RU',
            'Pусский': 'RU',
            'TH': 'TH',
            'ภาษาไทย': 'TH',
            'TR': 'TR',
            'Türkçe': 'TR',
            'VN': 'VN',
            'Tiếng Việt': 'VN'
        };
        
        // 言語別メッセージ定義（chrome.i18nの代替）
        this.messages = {
            '简': {
                setupKeywordHighlightedStats: '标记的推荐属性由玩家自定义',
                setupKeywordFirstAccess: '首次访问时',
                setupKeywordAdditionalStats: '追加属性',
                errorGeneral: '错误:',
                errorScoreElementNotFound: '未找到分数显示元素',
                scoreDescription: '分数由追加属性计算得出。',
                totalScore: '总分数',
                itemScore: '分数',
                statHP: '生命值',
                statHPPercent: '生命值百分比',
                statATK: '攻击力',
                statATKPercent: '攻击力百分比',
                statDEF: '防御力',
                statDEFPercent: '防御力百分比',
                statCritRate: '暴击率',
                statCritDMG: '暴击伤害',
                statElementalMastery: '元素精通',
                statEnergyRecharge: '元素充能效率',
                noArtifactsEquipped: '未装备圣遗物',
                subtotalScoreLabel: '小计分数',
                excessScoreLabel: '超出分数',
                targetEnergyRecharge: '目标元素充能效率:',
                save: '保存'
            },
            '繁': {
                setupKeywordHighlightedStats: '標記的推薦屬性由玩家自訂',
                setupKeywordFirstAccess: '首次存取時',
                setupKeywordAdditionalStats: '追加屬性',
                errorGeneral: '錯誤:',
                errorScoreElementNotFound: '未找到分數顯示元素',
                scoreDescription: '分數由追加屬性計算得出。',
                totalScore: '總分數',
                itemScore: '分數',
                statHP: '生命值',
                statHPPercent: '生命值百分比',
                statATK: '攻擊力',
                statATKPercent: '攻擊力百分比',
                statDEF: '防禦力',
                statDEFPercent: '防禦力百分比',
                statCritRate: '暴擊率',
                statCritDMG: '暴擊傷害',
                statElementalMastery: '元素精通',
                statEnergyRecharge: '元素充能效率',
                noArtifactsEquipped: '未裝備聖遺物',
                subtotalScoreLabel: '小計分數',
                excessScoreLabel: '超出分數',
                targetEnergyRecharge: '目標元素充能效率:',
                save: '保存'
            },
            'DE': {
                setupKeywordHighlightedStats: 'Die empfohlenen Attribute, die hervorgehoben sind',
                setupKeywordFirstAccess: 'Beim ersten Zugriff',
                setupKeywordAdditionalStats: 'Bonusattribut',
                errorGeneral: 'Fehler:',
                errorScoreElementNotFound: 'Punkteanzeigeelement nicht gefunden',
                scoreDescription: 'Punkte werden aus Bonusattribut berechnet.',
                totalScore: 'Gesamtpunktzahl',
                itemScore: 'Punkte',
                statHP: 'LP',
                statHPPercent: 'LP-Rate',
                statATK: 'Angriff',
                statATKPercent: 'ANG-Rate',
                statDEF: 'Verteidigung',
                statDEFPercent: 'VTD-Rate',
                statCritRate: 'KT',
                statCritDMG: 'Kritischer Schaden',
                statElementalMastery: 'Elementarkunde',
                statEnergyRecharge: 'Aufladerate',
                noArtifactsEquipped: 'Keine Artefakte ausgerüstet',
                subtotalScoreLabel: 'Zwischensumme Punkte',
                excessScoreLabel: 'Überschuss Punkte',
                targetEnergyRecharge: 'Ziel-Aufladerate:',
                save: 'Speichern'
            },
            'EN': {
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
                excessScoreLabel: 'Excess Score',
                targetEnergyRecharge: 'Target Energy Recharge:',
                save: 'Save'
            },
            'ES': {
                setupKeywordHighlightedStats: 'Los atributos recomendados marcados han sido personalizados por los jugadores',
                setupKeywordFirstAccess: 'Cuando accedes por primera vez',
                setupKeywordAdditionalStats: 'Atributos secundarios',
                errorGeneral: 'Error:',
                errorScoreElementNotFound: 'Elemento de visualización de puntuación no encontrado',
                scoreDescription: 'Las puntuaciones se calculan a partir de los atributos secundarios.',
                totalScore: 'Puntuación total',
                itemScore: 'Puntuación',
                statHP: 'Vida',
                statHPPercent: 'Porcentaje de Vida',
                statATK: 'ATQ',
                statATKPercent: 'Porcentaje de ATQ',
                statDEF: 'DEF',
                statDEFPercent: 'Porcentaje de DEF',
                statCritRate: 'Prob. CRIT',
                statCritDMG: 'Daño CRIT',
                statElementalMastery: 'Maestría Elemental',
                statEnergyRecharge: 'Recarga de Energía',
                noArtifactsEquipped: 'No hay artefactos equipados',
                subtotalScoreLabel: 'Subtotal puntuación',
                excessScoreLabel: 'Puntuación excedente',
                targetEnergyRecharge: 'Recarga de Energía Objetivo:',
                save: 'Guardar'
            },
            'FR': {
                setupKeywordHighlightedStats: 'Les attributs recommandés marqués sont personnalisés par les joueurs',
                setupKeywordFirstAccess: 'Lors de votre première entrée',
                setupKeywordAdditionalStats: 'Attributs bonus',
                errorGeneral: 'Erreur:',
                errorScoreElementNotFound: 'Élément d\'affichage du score introuvable',
                scoreDescription: 'Les scores sont calculés à partir des attributs bonus.',
                totalScore: 'Score total',
                itemScore: 'Score',
                statHP: 'PV',
                statHPPercent: 'Pourcentage PV',
                statATK: 'ATQ',
                statATKPercent: 'Pourcentage ATQ',
                statDEF: 'DÉF',
                statDEFPercent: 'Pourcentage DÉF',
                statCritRate: 'Taux CRIT',
                statCritDMG: 'DGT CRIT',
                statElementalMastery: 'Maîtrise élémentaire',
                statEnergyRecharge: 'Recharge d\'énergie',
                noArtifactsEquipped: 'Aucun artefact équipé',
                subtotalScoreLabel: 'Score sous-total',
                excessScoreLabel: 'Score excédentaire',
                targetEnergyRecharge: 'Recharge d\'énergie cible:',
                save: 'Enregistrer'
            },
            'ID': {
                setupKeywordHighlightedStats: 'Rekomendasi Stats yang ditandai dapat diatur pemain',
                setupKeywordFirstAccess: 'Saat pertama kali masuk',
                setupKeywordAdditionalStats: 'Stats Sekunder',
                errorGeneral: 'Error:',
                errorScoreElementNotFound: 'Elemen tampilan skor tidak ditemukan',
                scoreDescription: 'Skor dihitung dari Stats Sekunder.',
                totalScore: 'Total Skor',
                itemScore: 'Skor',
                statHP: 'HP',
                statHPPercent: 'HP%',
                statATK: 'ATK',
                statATKPercent: 'ATK%',
                statDEF: 'DEF',
                statDEFPercent: 'DEF%',
                statCritRate: 'CRIT Rate',
                statCritDMG: 'CRIT DMG',
                statElementalMastery: 'Elemental Mastery',
                statEnergyRecharge: 'Energy Recharge',
                noArtifactsEquipped: 'Tidak ada Artifact yang dilengkapi',
                subtotalScoreLabel: 'Subtotal Skor',
                excessScoreLabel: 'Skor Berlebih',
                targetEnergyRecharge: 'Target Energy Recharge:',
                save: 'Simpan'
            },
            'IT': {
                setupKeywordHighlightedStats: 'I modificatori consigliati evidenziati sono personalizzati dal giocatore',
                setupKeywordFirstAccess: 'Quando entri per la prima volta',
                setupKeywordAdditionalStats: 'Modificatori secondari',
                errorGeneral: 'Errore:',
                errorScoreElementNotFound: 'Elemento di visualizzazione del punteggio non trovato',
                scoreDescription: 'I punteggi sono calcolati dagli modificatori secondari.',
                totalScore: 'Punteggio totale',
                itemScore: 'Punteggio',
                statHP: 'PS',
                statHPPercent: 'Percentuale PS',
                statATK: 'ATT',
                statATKPercent: 'Percentuale ATT',
                statDEF: 'DIF',
                statDEFPercent: 'Percentuale DIF',
                statCritRate: 'Tasso di CRIT',
                statCritDMG: 'DAN da CRIT',
                statElementalMastery: 'Maestria elementale',
                statEnergyRecharge: 'Ricarica di energia',
                noArtifactsEquipped: 'Nessun artefatto equipaggiato',
                subtotalScoreLabel: 'Punteggio subtotale',
                excessScoreLabel: 'Punteggio in eccesso',
                targetEnergyRecharge: 'Ricarica di energia obiettivo:',
                save: 'Salva'
            },
            'JP': {
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
                excessScoreLabel: '超過スコア',
                targetEnergyRecharge: '目標チャージ効率:',
                save: '保存'
            },
            'KR': {
                setupKeywordHighlightedStats: '태그된 추천 속성은 플레이어가 직접 설정한 것입니다',
                setupKeywordFirstAccess: '처음 접속했을 때',
                setupKeywordAdditionalStats: '부가 속성',
                errorGeneral: '오류:',
                errorScoreElementNotFound: '점수 표시 요소를 찾을 수 없습니다',
                scoreDescription: '점수는 부가 속성으로부터 계산됩니다.',
                totalScore: '총 점수',
                itemScore: '점수',
                statHP: 'HP',
                statHPPercent: 'HP 백분율',
                statATK: '공격력',
                statATKPercent: '공격력 백분율',
                statDEF: '방어력',
                statDEFPercent: '방어력 백분율',
                statCritRate: '치명타 확률',
                statCritDMG: '치명타 피해',
                statElementalMastery: '원소 마스터리',
                statEnergyRecharge: '원소 충전 효율',
                noArtifactsEquipped: '성유물을 장착하지 않음',
                subtotalScoreLabel: '소계 점수',
                excessScoreLabel: '초과 점수',
                targetEnergyRecharge: '목표 원소 충전 효율:',
                save: '저장'
            },
            'PT': {
                setupKeywordHighlightedStats: 'Os atributos recomendados marcados são personalizados pelo jogador',
                setupKeywordFirstAccess: 'Quando você entra pela primeira vez',
                setupKeywordAdditionalStats: 'Atributo de Bônus',
                errorGeneral: 'Erro:',
                errorScoreElementNotFound: 'Elemento de exibição de pontuação não encontrado',
                scoreDescription: 'As pontuações são calculadas a partir dos Atributo de Bônus.',
                totalScore: 'Pontuação total',
                itemScore: 'Pontuação',
                statHP: 'Vida',
                statHPPercent: 'Porcentagem de Vida',
                statATK: 'ATQ',
                statATKPercent: 'Porcentagem de ATQ',
                statDEF: 'DEF',
                statDEFPercent: 'Porcentagem de DEF',
                statCritRate: 'Taxa Crítica',
                statCritDMG: 'Dano Crítico',
                statElementalMastery: 'Proficiência Elemental',
                statEnergyRecharge: 'Recarga de Energia',
                noArtifactsEquipped: 'Nenhum artefato equipado',
                subtotalScoreLabel: 'Subtotal da pontuação',
                excessScoreLabel: 'Pontuação excedente',
                targetEnergyRecharge: 'Recarga de Energia Alvo:',
                save: 'Salvar'
            },
            'RU': {
                setupKeywordHighlightedStats: 'Выделены атрибуты, устанавливаемые игроком',
                setupKeywordFirstAccess: 'При первом входе',
                setupKeywordAdditionalStats: 'Дополнительные атрибуты',
                errorGeneral: 'Ошибка:',
                errorScoreElementNotFound: 'Элемент отображения счёта не найден',
                scoreDescription: 'Счёт рассчитывается из Дополнительные атрибуты.',
                totalScore: 'Общий счёт',
                itemScore: 'Счёт',
                statHP: 'HP',
                statHPPercent: 'Процент от HP',
                statATK: 'Сила атаки',
                statATKPercent: 'Процент от силы атаки',
                statDEF: 'Защита',
                statDEFPercent: 'Процент от защиты',
                statCritRate: 'Шанс крит. попадания',
                statCritDMG: 'Крит. урон',
                statElementalMastery: 'Мастерство стихий',
                statEnergyRecharge: 'Восстановление энергии',
                noArtifactsEquipped: 'Артефакты не экипированы',
                subtotalScoreLabel: 'Промежуточный счёт',
                excessScoreLabel: 'Избыточный счёт',
                targetEnergyRecharge: 'Целевое восстановление энергии:',
                save: 'Сохранить'
            },
            'TH': {
                setupKeywordHighlightedStats: 'สถานะแนะนำที่ทำเครื่องหมายไว้จะถูกกำหนดโดยผู้เล่น',
                setupKeywordFirstAccess: 'เมื่อคุณเข้ามาครั้งแรก',
                setupKeywordAdditionalStats: 'โบนัสค่าสถานะ',
                errorGeneral: 'ข้อผิดพลาด:',
                errorScoreElementNotFound: 'ไม่พบองค์ประกอบการแสดงคะแนน',
                scoreDescription: 'คะแนนคำนวณจาก โบนัสค่าสถานะ',
                totalScore: 'คะแนนรวม',
                itemScore: 'คะแนน',
                statHP: 'พลังชีวิต',
                statHPPercent: 'เปอร์เซ็นต์พลังชีวิต',
                statATK: 'พลังโจมตี',
                statATKPercent: 'เปอร์เซ็นต์พลังโจมตี',
                statDEF: 'พลังป้องกัน',
                statDEFPercent: 'เปอร์เซ็นต์พลังป้องกัน',
                statCritRate: 'อัตราคริ',
                statCritDMG: 'ความแรงคริ',
                statElementalMastery: 'ความชำนาญธาตุ',
                statEnergyRecharge: 'ประสิทธิภาพการฟื้นฟูพลังงานธาตุ',
                noArtifactsEquipped: 'ไม่ได้สวมใส่สิ่งประดิษฐ์',
                subtotalScoreLabel: 'คะแนนย่อย',
                excessScoreLabel: 'คะแนนส่วนเกิน',
                targetEnergyRecharge: 'ประสิทธิภาพการฟื้นฟูพลังงานธาตุเป้าหมาย:',
                save: 'บันทึก'
            },
            'TR': {
                setupKeywordHighlightedStats: 'İşaretli önerilen özellikler kişiselleştirilebilir',
                setupKeywordFirstAccess: 'İlk kez girdiğinizde',
                setupKeywordAdditionalStats: 'Alt Özellik',
                errorGeneral: 'Hata:',
                errorScoreElementNotFound: 'Skor görüntüleme öğesi bulunamadı',
                scoreDescription: 'Skorlar Alt Özellik hesaplanır.',
                totalScore: 'Toplam skor',
                itemScore: 'Skor',
                statHP: 'Can',
                statHPPercent: 'Can Oranı',
                statATK: 'Saldırı',
                statATKPercent: 'Saldırı Oranı',
                statDEF: 'Savunma',
                statDEFPercent: 'Savunma Oranı',
                statCritRate: 'Kritik Oranı',
                statCritDMG: 'Kritik Hasar',
                statElementalMastery: 'Element Ustalığı',
                statEnergyRecharge: 'Enerji Yüklemesi',
                noArtifactsEquipped: 'Hiçbir eser donatılmadı',
                subtotalScoreLabel: 'Ara toplam skor',
                excessScoreLabel: 'Aşırı skor',
                targetEnergyRecharge: 'Hedef Enerji Yüklemesi:',
                save: 'Kaydet'
            },
            'VN': {
                setupKeywordHighlightedStats: 'Thuộc tính đề xuất được đánh dấu cho người chơi tùy chỉnh',
                setupKeywordFirstAccess: 'Khi bạn vào lần đầu tiên',
                setupKeywordAdditionalStats: 'Thuộc Tính Thêm',
                errorGeneral: 'Lỗi:',
                errorScoreElementNotFound: 'Không tìm thấy phần tử hiển thị điểm',
                scoreDescription: 'Điểm số được tính từ các Thuộc Tính Thêm.',
                totalScore: 'Tổng điểm',
                itemScore: 'Điểm',
                statHP: 'HP',
                statHPPercent: 'Tỷ Lệ HP',
                statATK: 'Tấn Công',
                statATKPercent: 'Tỷ Lệ Tấn Công',
                statDEF: 'Phòng Ngự',
                statDEFPercent: 'Tỷ Lệ Phòng Ngự',
                statCritRate: 'Tỷ Lệ Bạo Kích',
                statCritDMG: 'Sát Thương Bạo Kích',
                statElementalMastery: 'Tinh Thông Nguyên Tố',
                statEnergyRecharge: 'Hiệu Quả Nạp Nguyên Tố',
                noArtifactsEquipped: 'Không trang bị hiện vật nào',
                subtotalScoreLabel: 'Điểm tạm tính',
                excessScoreLabel: 'Điểm thừa',
                targetEnergyRecharge: 'Hiệu Quả Nạp Nguyên Tố Mục Tiêu:',
                save: 'Lưu'
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