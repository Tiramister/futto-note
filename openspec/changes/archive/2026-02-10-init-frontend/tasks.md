## 1. プロジェクト初期化

- [x] 1.1 Vite + React + TypeScript プロジェクトを `frontend/` に作成
- [x] 1.2 不要なボイラープレートファイルを削除

## 2. 設定ファイル

- [x] 2.1 `vite.config.ts` に開発サーバー設定を追加（host, port, proxy, polling）
- [x] 2.2 `tsconfig.json` を適切に設定
- [x] 2.3 `Dockerfile` を作成（Node.js 20 LTS ベース）

## 3. ヘルスチェックページ

- [x] 3.1 `App.tsx` にヘルスチェック機能を実装（`/api/health` を fetch）
- [x] 3.2 接続成功/失敗の表示を実装

## 4. Vitest 設定

- [x] 4.1 Vitest と関連パッケージをインストール
- [x] 4.2 `vitest.config.ts` を作成
- [x] 4.3 `package.json` に `test` スクリプトを追加
- [x] 4.4 `App.test.tsx` にサンプルユニットテストを作成

## 5. Playwright 設定

- [x] 5.1 Playwright をインストール
- [x] 5.2 `playwright.config.ts` を作成（ヘッドレスモード、baseURL 設定）
- [x] 5.3 `package.json` に `test:e2e` スクリプトを追加
- [x] 5.4 `e2e/health.spec.ts` にサンプル E2E テストを作成

## 6. 動作確認

- [x] 6.1 `npm run dev` で開発サーバーが起動することを確認
- [x] 6.2 `npm run test` でユニットテストが成功することを確認
- [x] 6.3 `npm run test:e2e` で E2E テストが成功することを確認
