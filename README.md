# Gemcam Prompt Lab

Gemini 画像生成プロンプトを「カメラフィルター」として素早く検証するための開発用アプリ。

起動すると即カメラが立ち上がり、画面下のフィルターストリップからプロンプト×リファレンス画像セットを選んで撮影 → 生成結果を確認できる。フィルターはサーバー側 (Firebase) で管理されており、誰かが追加すると他の人にもすぐ反映される。

## セットアップ

### 1. Firebase プロジェクトを用意

1. <https://console.firebase.google.com> でプロジェクトを新規作成（Spark プランで OK / 無料）
2. **Firestore** を有効化（Build → Firestore Database → Create database。本番モードでOK、Admin SDK は RLS を通らない）
3. **Storage** を有効化（Build → Storage → Get started）
   - バケット名を控える（例: `your-project-id.firebasestorage.app`）
4. **サービスアカウントキーを発行**
   - Project settings → Service accounts → "Generate new private key"
   - ダウンロードした JSON の中から `project_id` / `client_email` / `private_key` を控える

### 2. 環境変数

```bash
cp .env.example .env.local
```

| 変数 | 用途 |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio で発行 |
| `GEMINI_MODEL` | 既定 `gemini-3.1-flash-image-preview`（任意） |
| `FIREBASE_PROJECT_ID` | サービスアカウント JSON の `project_id` |
| `FIREBASE_CLIENT_EMAIL` | サービスアカウント JSON の `client_email` |
| `FIREBASE_PRIVATE_KEY` | サービスアカウント JSON の `private_key`（`\n` 含む文字列のままで OK） |
| `FIREBASE_STORAGE_BUCKET` | バケット名（例: `your-project.firebasestorage.app`、`gs://` は付けない） |

### 3. 起動

```bash
npm install
npm run dev
```

初回 `GET /api/filters` で Firestore の `filters` コレクションが空なら、`public/seeds/` の画像を Storage にアップロードして **BayGal** / **Band Toy** の 2 フィルターを自動投入する。

## アーキテクチャ

- **Next.js 16 App Router** + TypeScript / CSS Modules
- **Firebase Admin (Spark / 無料枠)**:
  - Firestore: フィルターメタデータ (`filters` コレクション)
  - Cloud Storage: リファレンス画像 (`references/` プレフィックス)
- **同期 API**: `POST /api/generate` で Gemini を直接呼び出し（キュー無し、`maxDuration=120s`）
- リファレンス画像 URL は Firebase 標準のダウンロードトークン形式 (`firebasestorage.googleapis.com/v0/b/...?token=...`)。バケット公開設定や Signed URL 期限切れの心配なし。

## ディレクトリ

```
app/
  page.tsx                    # メイン（ステートマシン）
  api/filters/route.ts        # GET 一覧 / POST 作成
  api/filters/[id]/route.ts   # GET / DELETE
  api/generate/route.ts       # 同期生成
components/
  AppHeader, CameraView, FilterStrip,
  AspectRatioSelector, ShutterBar,
  ProcessingScreen, ResultScreen, FilterCreateModal
lib/
  camera.ts    # getUserMedia, capture, アスペクト中央クロップ
  gemini.ts    # generateImage()
  firebase.ts  # Admin SDK 初期化（Firestore + Storage）
  filters.ts   # filters コレクションへの CRUD
  storage.ts   # references/ への upload / fetch
  seed.ts      # 初回シード投入
  types.ts
public/seeds/   # シード用リファレンス画像
```

## デプロイ (Vercel)

1. Vercel にリポジトリを接続
2. 環境変数を Vercel に設定（`FIREBASE_PRIVATE_KEY` は改行を `\n` のまま貼って OK — アプリ側で復元する）
3. デプロイ

## 制約

- 認証なし（社内開発用）。URL を知っている人は誰でもフィルターを追加・削除できる。
- 同期 API の上限は Vercel function の `maxDuration=120s`。
