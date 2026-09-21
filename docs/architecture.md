# Drum Pattern Maker 開発アーキテクチャ

最終確認日: 2026-09-21

この文書は、現行ソースコードから整理した開発者向けの構成資料です。新機能を追加する際は、特に「正規リズム形式」と既存データとの互換性を守ることを優先します。

## 1. アプリの役割

Drum Pattern Maker は、次の3機能を持つ React SPA です。

1. **練習** (`/`): アクセント練習、またはジャンル・グルーヴ・フィルを組み合わせたフィルイン練習を生成する。
2. **フィルエディタ** (`/fills`): グリッド入力でフィルを作成し、譜面表示・音声再生・保存・公開設定を行う。
3. **コミュニティ** (`/community`): 公開フィルの試聴、いいね、自分のライブラリへの複製を行う。

認証済みでプロフィール設定が完了したユーザーのみ、上記のアプリ画面へ進めます。ログイン、オンボーディング、利用規約、プライバシーポリシーは個別ルートです。

練習画面の初期表示は **今日の練習** です。ユーザーが開始した時点で、著作物を複製しないルールベースの16小節（4段×4小節）の読譜ページを生成します。段が進むほど休符・裏拍・16分音符の組合せが増える、約8分の連続練習です。既存のパラメーター操作は **練習を選ぶ** モードとして保持します。

## 2. 全体構成

```text
main.jsx
  └─ App.jsx（軽量な History API ルーター、画面アクセス制御、共通ヘッダー）
       ├─ AuthProvider（Supabase Auth / profiles）
       └─ I18nProvider（日本語・英語）
            ├─ PracticePage
            │    ├─ patternGenerator / fillGenerator → canonical pattern
            │    ├─ fillEditorModel → 譜面用・再生用の表示モデル
            │    ├─ VexFlowNotationPreview
            │    └─ useDrumPlaybackEngine → Tone.js
            ├─ FillEditorPage
            │    ├─ fillEditorModel → canonical pattern
            │    ├─ VexFlowNotationPreview / useDrumPlaybackEngine
            │    └─ Supabase fill_patterns
            └─ PublicFillsPage
                 ├─ Supabase fill_patterns / profiles / fill_pattern_likes
                 └─ VexFlowNotationPreview / useDrumPlaybackEngine
```

技術基盤は React 19、Vite、Tone.js、Supabase JS です。譜面描画は現行画面では `components/vexflow-notation-preview.jsx` が担います。`SvgNotationPreview` と `ImageNotationPreview` は残っていますが、現行の主要画面からは使用されていません。

ルーティングに React Router は使用せず、`App.jsx` が `window.history.pushState` と `popstate` を直接扱います。Vercel はすべての非 API パスを `index.html` へ rewrite します（`vercel.json`）。新しい画面を追加する場合は、`KNOWN_ROUTES`、`page` の分岐、必要ならナビゲーション項目を同時に更新します。

## 3. 主なソースの責務

| 領域 | 主なファイル | 責務 |
| --- | --- | --- |
| アプリ殻 | `src/App.jsx`, `src/main.jsx` | ルート、認証状態に応じた遷移、共通ヘッダー、モーダル |
| 練習画面 | `src/pages/PracticePage.jsx` | 練習パラメータのUI、パターン生成、再生とハイライトの接続 |
| フィル編集 | `src/pages/FillEditorPage.jsx` | ステップ編集、保存済みフィルのCRUD、公開・練習採用設定 |
| コミュニティ | `src/pages/PublicFillsPage.jsx` | 公開フィル一覧、いいね、複製、試聴 |
| 生成ロジック | `src/utils/patternGenerator.js`, `src/utils/fillGenerator.js`, `src/constants/patterns.js` | アクセント練習、ジャンル別グルーヴ、既定フィル、カリキュラムの生成 |
| 日替わり練習 | `src/utils/todayPractice.js` | 独自のリズム読譜メニュー、属性付与、結果履歴、難易度調整 |
| リズム変換 | `src/constants/rhythmSchema.js`, `src/utils/canonicalRhythm.js`, `src/utils/fillEditorModel.js` | 正規形式、旧形式との相互変換、譜面・再生向け表示モデル |
| 音声 | `src/hooks/useDrumPlaybackEngine.js`, `src/constants/kitConfig.js` | Tone.js サンプル読込、音色設定、正規タイミングでの再生 |
| 認証・プロフィール | `src/contexts/AuthContext.jsx`, `src/utils/supabaseClient.js` | Google OAuth、セッション、プロフィール、退会 |
| 多言語 | `src/contexts/I18nContext.jsx`, `src/constants/i18n.js` | `ja` / `en` の辞書、localStorage、プロフィール言語、国別初期値 |
| 表示 | `src/components/`, `src/index.css` | 譜面、ログインランディング、設定・お知らせモーダル、全スタイル |

## 4. リズムデータの設計（重要）

### 正規形式

新規ロジックの内部表現は `canonical pattern` を基準にします。定義は `rhythmSchema.js`、変換実装は `canonicalRhythm.js` です。

```js
{
  schemaVersion: 2,
  patternKind: 'fill' | 'exercise',
  timeSignature: { numerator: 4, denominator: 4 },
  ppq: 192,
  gridProfile: 'straight_16',
  fillLengthType: 'full_bar',
  totalTicks: 768,
  events: [{
    id: 'fill-0',
    startTick: 0,
    durationTick: 48,
    isRest: false,
    notes: [{ instrument: 'snare', modifiers: { accent: true } }]
  }],
  metadata: { notationRuleSet: 'dpm_jp_v1' }
}
```

- PPQ は常に **192**、拍子は現在 **4/4**。
- グリッドは `straight_4` / `straight_8` / `triplet_8` / `triplet_16` / `straight_16` / `straight_32`。
- フィル長は `full_bar` / `half_bar` / `quarter_bar`。
- 楽器IDは `hihat_close`、`hihat_open`、`foot_hihat`、`ride`、`crash`、`snare`、`hi_tom`、`mid_tom`、`low_tom`、`floor_tom`、`bass_drum`。修飾は `accent`、`ghost`、`open`。

`canonicalToNotationView()` は譜面描画用の `accentRow` / `kickRow` 等へ、`canonicalToPlaybackSequence()` は Tone.js 用のステップ列へ変換します。画面コンポーネントや再生フックで、独自のリズム変換を増やさないでください。

### 旧形式との互換性

旧保存データは `steps_json`（ステップごとの `instruments`, `accent`, `ghost`, `isRest`）です。現在は `pattern_json` に canonical pattern を保存しますが、移行途中の環境を考慮し、以下を維持しています。

- 読み込みは `pattern_json` が有効なら優先し、なければ `steps_json` から復元する。
- `pattern_json` カラムが未適用の Supabase 環境では、クエリ・保存ともに旧形式へフォールバックする。
- `FillEditorPage`、`PracticePage`、`PublicFillsPage` でこの互換処理を使用する。

データスキーマを変更する際は、先に migration を追加し、旧レコードのフォールバックを壊さないことが前提です。

## 5. 主要フロー

### 練習の生成から再生まで

1. `PracticePage` が選択値を保持する。
2. アクセント練習では `createCanonicalPagePatterns()`、フィルイン練習では `createCanonicalFillInPracticePatterns()` を呼ぶ。
3. canonical pattern を譜面用と再生用にそれぞれ変換する。
4. `VexFlowNotationPreview` が譜面を描画し、`useDrumPlaybackEngine.playSequence()` が全ステップを PPQ 時刻で Tone.Transport に予約する。
5. `currentStep` を `Tone.Draw` 経由で更新し、表示中の音符をハイライトする。

フィルイン練習の生成は `fillGenerator.js` に集約されています。ロック／ポップス／ブルース／ジャズ、グルーヴ固定方法、フィル長、オープンハイハット、ユーザー作成フィルを組み合わせます。ランダム性のある音楽ルールを変更する場合は、このファイルと `constants/patterns.js` を対象にします。

### フィルの作成・公開・利用

1. `FillEditorPage` はステップ編集を `fillEditorModel.js` で正規化する。
2. 保存時、`steps_json` と canonical の `pattern_json` を `fill_patterns` に保存する。
3. `include_in_practice = true` の自分のフィルは、練習画面の「Created by Me」プールに渡される。
4. `visibility = 'public'` のフィルは、コミュニティで閲覧可能になる。
5. コミュニティの複製は、公開元を変更せず、自分所有の非公開フィルとして挿入する。

## 6. 音声・譜面表示

`useDrumPlaybackEngine` は Tone.js のグローバル `Transport` を共有します。各画面がアンマウント時に停止・破棄し、設定や画面モードの変更時は `stopPlayback()` を呼びます。同時再生や再生フックの二重マウントを導入しないよう注意してください。

音源は `kitConfig.js` に集約されています。`Pearl Master Studio` と Tone.js の Web 標準キットを選べ、音源ファイルは外部URLから読み込まれます。スネアはアクセント／通常／ゴースト用に各4ボイスのプレイヤープールを持ち、連打時の音切れを抑えています。

譜面表示は VexFlow を動的 import し、4小節ごとに段組みします。3連符、休符、上下声部、アクセント、ゴースト、ハイライトをここで処理します。新しい楽器・記法を増やす場合は、正規形式の楽器ID、`NOTATION_TOKEN_BY_INSTRUMENT`、VexFlow のキー／表示規則、音源マッピングを一緒に追加します。

## 7. Supabase と認可

必要なフロントエンド環境変数は `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` です。未設定時はクライアントを生成せず、画面側で利用不可として扱います。

DB定義は `supabase/migrations/` に時系列であります。

| テーブル／関数 | 用途と主な認可 |
| --- | --- |
| `profiles` | Googleログインユーザーの username、表示名、アバター、言語。本人は読み書き、公開プロフィールは全員が参照可能。 |
| `fill_patterns` | ユーザー作成フィル。本人はCRUD、`visibility = 'public'` は匿名利用者も参照可能。 |
| `fill_pattern_likes` | フィルごとのユーザーいいね。閲覧は公開、作成・削除は本人の行のみ。 |
| `delete_my_account()` | `auth.uid()` の Auth ユーザーを削除し、外部キーの cascade で関連データを削除する。 |

RLS を前提にしているため、クライアント側だけで所有者制限を保証する設計ではありません。テーブルや公開範囲を増やす場合は必ず migration 内で RLS とポリシーを追加します。

## 8. ローカル状態とAPI

- 言語は `app_language`、お知らせ既読は `app_updates_last_read` を localStorage に保存する。
- 日替わり練習の各項目の結果は `dpm_today_practice_history_v1` に保存する。現在は開始前に選ぶ `easy` / `normal` / `hard` を優先し、履歴は将来の自動提案に使えるよう保持する。`easy` はアクセントなしで基礎的な16分4打と各拍3打の3連符、`normal` は4分・16分・混合16分セル・各拍3打の3連符、`hard` は16分の密度・休符・裏拍・アクセントを増やす。`complete` は同程度の別パターンを継続する記録である。
- `/api/locale` は Vercel 等の国コードヘッダーから初期言語を返す。プロフィールの `preferred_language` がある場合はそちらが優先される。
- `/api/contact` は `SLACK_FEEDBACK_WEBHOOK_URL` を使って問い合わせを Slack へ転送する。Webhook URL はクライアントコードや `.env.local` に置かない。

## 9. 開発時の確認項目

```bash
npm run lint
npm run build
```

自動テストは現状スクリプト化されていません。リズム関連の変更では、少なくとも次を手動確認します。

- 16分、32分、8分3連、16分3連の譜面と再生が一致する。
- 休符、アクセント、ゴースト、複数楽器の同時発音が保持される。
- 新規保存・既存保存の読込・公開・複製・練習への採用が動く。
- `pattern_json` があるレコードと、`steps_json` のみの旧レコードの両方を読み込める。
- 再生中に設定または画面を変えても再生が残らない。

## 10. 拡張の指針

- **新しい練習タイプ**: `PracticePage` のモード、`constants/options.js`、専用ジェネレーターを追加し、canonical pattern を返す。
- **日替わりメニューの項目**: `todayPractice.js` の `createTodayPracticeMenu()` に、`pattern`、`instruction`、`minutes`、`tempo` と属性（`noteValues`、`rests`、`syncopationLevel`、`accents`、`triplets`、`bars`、`difficulty`、`exerciseType`）を揃えて追加する。譜面そのものの固定配列を流用せず、音楽的な生成ルールとして実装する。
- **新しいフィル保存項目**: migration → Supabase取得／保存 → `fillEditorModel` の復元順で実装する。
- **新しい楽器**: 正規形式、旧形式の変換、譜面、音源、エディタ選択肢を一式で更新する。
- **新しい翻訳文言**: `constants/i18n.js` の `ja` と `en` を同時に追加する。画面に文字列を直書きしない。
- **新しいルート**: `App.jsx` のルート正規化とアクセス制御に追加する。法律ページのように未認証で開ける必要がある場合だけ `LEGAL_ROUTES` 相当へ明示的に加える。
