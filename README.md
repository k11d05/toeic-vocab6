# TOEIC単語トレーニング PWA

## Vercelへのデプロイ手順

### 1. GitHubにアップロード
1. https://github.com にアクセスしてアカウント作成（または既存アカウントでログイン）
2. 「New repository」でリポジトリを作成（名前例: `toeic-vocab`）
3. このフォルダの中身を全てアップロード

**コマンドラインの場合:**
```bash
cd toeic-pwa
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのID/toeic-vocab.git
git push -u origin main
```

### 2. Vercelにデプロイ
1. https://vercel.com にアクセスしてGitHubアカウントでサインアップ
2. 「Add New Project」→ GitHubのリポジトリを選択
3. 設定はそのままで「Deploy」を押す
4. 数分でURLが発行される（例: `https://toeic-vocab-xxx.vercel.app`）

### 3. iPhoneのホーム画面に追加
1. iPhoneのSafariで上記URLを開く
2. 画面下の「共有」ボタン（四角に矢印のアイコン）をタップ
3. 「ホーム画面に追加」を選択
4. 名前を確認して「追加」をタップ
5. ホーム画面にアイコンが追加され、アプリのように起動できる

## ローカルで動かす場合
```bash
cd toeic-pwa
npm install
npm start
```
ブラウザで http://localhost:3000 が開く
