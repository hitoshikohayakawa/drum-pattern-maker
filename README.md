# Drum Pattern Maker

ドラムのアクセント練習とフィルイン練習を生成・再生し、フィルインを作成、保存、公開できる React アプリケーションです。

## 開発を始めるには

```bash
npm install
npm run dev
```

ビルドと静的解析は以下です。

```bash
npm run build
npm run lint
```

## 環境変数

ログイン、フィル保存、コミュニティ機能には Supabase を使用します。`.env.local` に次を設定してください。

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

未設定でも画面は起動しますが、認証とデータベースを使う機能は利用できません。データベースの変更は `supabase/migrations/` を順番に適用します。問い合わせ API を有効にする場合は、デプロイ環境に `SLACK_FEEDBACK_WEBHOOK_URL` も設定します。

## 設計資料

アプリ固有の構成、リズムデータ形式、画面ごとの責務、拡張時の注意点は [開発アーキテクチャ](docs/architecture.md) にまとめています。
