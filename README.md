# スコア計算 Chrome拡張

このChrome拡張は[【原神】戦績](https://act.hoyolab.com/app/community-game-records-sea/index.html) 上でスコア計算を行い、その結果をページに追加する機能を提供します。

## 特徴

- **厳密なスコア計算**：普及したスコア計算方式（※1）ではなく、正確な計算方式（※2）を使用して結果を算出します。  
<small>※1 会心ダメージ : 会心率 : 攻撃力%（HP%) = 1 : 2 : 1 </small>  
<small>※2 会心ダメージ : 会心率 : 攻撃力%（HP%) = 1 : 2 : 1.333...</small>  

- **汎用性**：公式ページ内の「ハイライトするステータスの選択」から選んだ「追加ステータス」を加点対象とするため、HPアタッカー、サポーターなど、全てのキャラクターで利用することができます。

- **結果表示**：計算結果は [【原神】戦績](https://act.hoyolab.com/app/community-game-records-sea/index.html) 上に表示されます。
<div style="margin-left:20px;">
   <figure>
      <figcaption><small>導入前のイメージ</small></figcaption>
      <img src="Images/before.png" alt="拡張導入前のイメージ">
   </figure>
   <figure>
      <figcaption><small>導入後のイメージ</small></figcaption>
      <img src="Images/after.png" alt="拡張導入後のイメージ">
   </figure>
</div>

- **Chrome拡張として動作**：Chromeブラウザで動作する拡張機能です。

## 導入方法

### GitHubからダウンロード

1. GitHub から拡張機能をダウンロードします。
   - リポジトリページ: `https://github.com/kimura-aruku/GenshinExtension`
   - **[Download ZIP](https://github.com/kimura-aruku/GenshinExtension/archive/main.zip)** ボタンをクリックし、拡張機能のソースコードをダウンロードします。

2. ダウンロードした ZIP ファイルを解凍し、その中のフォルダを任意の場所に保存します。

3. Chrome ブラウザを開き、アドレスバーに `chrome://extensions` と入力して拡張機能の管理ページを開きます。

4. ページ右上の **「デベロッパーモード」** をオンにします。

5. **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリックし、解凍した拡張機能のフォルダを選択します。

6. インストールが完了すると、Chromeに拡張機能が追加されます。

## 使用方法

1. [【原神】戦績](https://act.hoyolab.com/app/community-game-records-sea/index.html) にアクセスします。

2. 拡張機能が自動的にページのスコアを計算し、結果を画面上に表示します。

## 注意

- この拡張機能は、[【原神】戦績](https://act.hoyolab.com/app/community-game-records-sea/index.html) のみで動作します。他のウェブサイトでは動作しません。

- スコア計算は普及された計算方法とは異なるため、他サイトとは異なる結果になることがあります。

## 今後追加予定の機能

- 普及型計算方式と厳密型計算方式で選択可能にする。

- 画面で有効な元素チャージ効率の数値を入力可能にし、設定値を越えた元素チャージ効率をスコアに加算しない仕様を追加する。

- 日本語以外の言語に対応する。
