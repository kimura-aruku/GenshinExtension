# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

これは原神のChrome拡張機能で、HoYoLABのコミュニティゲーム戦績ページで聖遺物のスコア計算を行います。この拡張機能は、ハイライトされた追加ステータスに基づいて聖遺物表示にスコア計算を追加します。

## コアアーキテクチャ

### 主要コンポーネント
- `manifest.json`: HoYoLAB戦績ページを対象とするChrome拡張機能のマニフェスト（v3）
- `content.js`: スコア計算機能を注入するメインコンテンツスクリプト
- `README.md`: インストールと使用方法の日本語ドキュメント

### 主要な技術詳細

**対象URL**: `https://act.hoyolab.com/app/community-game-records-sea/index.html`

**コンテンツスクリプトアーキテクチャ**:
- 初期化に`document.addEventListener('DOMContentLoaded')`を使用
- 動的なDOM変更を監視するMutationObserverパターンを実装
- Promise基盤の`waitForElement()`関数を使用して要素を待機
- 追加ステータス（`subPropsElementObserve`）とキャラクター情報（`basicInfoElementObserve`）の監視を維持

**スコア計算システム**:
- 公式ページでユーザーが選択したハイライト追加ステータスに基づいてスコアを計算
- 一般的な1:2:1の比率ではなく、会心ダメージ:会心率:攻撃力%の正確な比率を使用
- すべての聖遺物タイプ（花、羽、砂、杯、冠）をサポート
- スコア計算式は追加ステータスのタイプによって異なる（例：会心率 × 2.0、攻撃力%/HP% × 62.2/46.6）

**DOM操作**:
- ID `alk-element`でカスタムUI要素を作成
- 一貫した外観のために既存ページのスタイルをコピー
- 聖遺物リスト（`relic-list`）の上にスコア表示を挿入

### 使用されている要素セレクタ
- `.relic-list`: メインの聖遺物コンテナ
- `.sub-props .prop-list`: ハイライト追加ステータス選択エリア
- `.basic-info`: キャラクター情報セクション
- `.artifact-sub-prop`: 個別の聖遺物追加ステータス要素
- `.final-text`: 数値スタイリングの参照要素

## 開発ノート

- 拡張機能は日本語ユーザー向けに設計されている（すべてのテキストが日本語）
- ビルドプロセス不要 - 直接Chrome拡張機能の読み込み
- JSDoc型注釈を使用したバニラJavaScript
- 要素の可視性チェックによる防御的プログラミングを実装
- 適切な監視のクリーンアップで動的コンテンツ読み込みを処理

## インストール方法

この拡張機能はパッケージ化されていない読み込み方法を使用：
1. ファイルをダウンロードして展開
2. Chrome拡張機能でデベロッパーモードを有効化
3. パッケージ化されていない拡張機能フォルダを読み込み
4. 対象ページで拡張機能が自動的にアクティブ化

## 言語とローカライゼーション

現在日本語のみ。READMEに記載されているように、将来的に多言語サポートを予定。

## オリジナルページHTML構造（拡張無効時）

Chrome拡張が操作する`class="character-content"`内のオリジナルHTML構造：

```html
<!-- キャラステータス + 聖遺物 -->
<div class="character-content"> 
  <!-- 中略（キャラクター選択タブ、ブロックタイトルなど） -->
  <!-- キャラステータス -->
  <div class="top-info"> 
    <!-- 中略（キャラ画像、天賦レベル、好感度、凸数） -->
    <!-- 
      【.basic-info】キャラクターの基本情報（名前、レベル、星、ステータス）を表示する要素
      この要素の変更を監視することでキャラクター変更を検知 
    -->
    <div class="basic-info">
      <!-- 中略（キャラクター名、レベル、キャラレア度） -->
      <!-- ステータス情報 -->
      <div> 
        <!-- 中略（ラベル"ステータス"） -->
        <div class="prop-list">
          <div class="prop-item1">
            <!-- 中略（HPの数値以外の要素） -->
            <!-- 【.final-text】数値表示のスタイル参照用クラス -->
            <p class="final-text">HPの数値</p>
          </div>
          <!-- 中略（prop-item-2～10で他のステータスを表示） -->
        </div>
      </div>
    </div>
  </div>

  <!-- 【.artifact-info】聖遺物全体の情報コンテナ -->
  <div class="artifact-info">
    <!-- 中略（「ハイライトするステータスの選択」ボタン） -->
    <div>
      <!-- ハイライトするステータス選択 -->
      <div class="mark-props">
        <div class="main-props">
          <!-- 中略（メインステータス） -->
        </div>
        <!-- 
          【.sub-props .prop-list】ユーザーが選択したハイライト追加ステータスの一覧
          .prop-item__activeクラスが選択状態を示し、選択アイコンが表示される
          Chrome拡張はここからスコア計算対象のステータス名を取得
          Chrome拡張はMutationObserverでこの要素の変更を監視
        -->
        <div class="sub-props">
          <!-- 中略（ラベル「追加ステータス」） -->
          <div class="prop-list">
            <div class="prop-item">
              <!-- 中略（追加ステータスの名称） -->
            </div>
            <!-- 中略（追加ステータスの数だけprop-itemが存在） -->
          </div>
        </div>
      </div>

      <!-- 【.split】区切り線要素（Chrome拡張はこの直後にスコア表示を挿入） -->
      <div class="split"></div>
      <!-- 
        【.relic-list】5つの聖遺物（花、羽、砂、杯、冠）を横並びで表示
        Chrome拡張はこの要素の親要素内に#alk-elementでスコア表示UIを挿入
      -->
      <div class="relic-list">
        <!-- 【.relic-item】個別の聖遺物要素 -->
        <div class="relic-item">
          <!-- 中略（聖遺物の名称、画像、レベル） -->
          <!-- 【.main-prop】聖遺物のメインステータス -->
          <div class="main-prop">
            <!-- 中略（ステータスの名称と値） -->
          </div>
          <!-- 
            【.artifact-sub-prop】聖遺物のサブステータスの個別要素
            .artifact-sub-prop__activeクラスを持つ場合、スコア対象のサブステータス
            Chrome拡張はこの要素からステータス名と数値を解析してスコア計算
          -->
          <div class="artifact-sub-prop artifact-sub-prop__active">
            <!-- 中略（ステータスの名称と値） -->
          </div>
          <!-- 中略（サブステータスの数だけartifact-sub-propが存在） -->
        </div>
        <!-- 中略（聖遺物の数だけrelic-itemが存在） -->
      </div>
    </div>
  </div>
</div>
```