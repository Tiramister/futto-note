## Why

フロントエンドの開発基盤がない状態から、React アプリケーションの雛形を構築する必要がある。バックエンドとの接続確認ができる最小構成を整えることで、以降の UI 開発を進められるようにする。

## What Changes

- `frontend/` ディレクトリに Vite + React + TypeScript プロジェクトを新規作成
- Vite の開発サーバーを Docker コンテナで動作するよう設定
- `/api/*` へのリクエストを `backend:8080` にプロキシする設定を追加
- `/api/health` を呼び出して接続確認する最小限のページを作成
- Vitest によるユニットテストの設定とサンプルテストを追加
- Playwright による E2E テストの設定とサンプルテストを追加

## Capabilities

### New Capabilities

- `frontend-dev-server`: Vite 開発サーバーの設定（プロキシ、Docker対応）
- `health-check-page`: バックエンドとの接続確認ページ
- `frontend-testing`: Vitest（ユニットテスト）と Playwright（E2E テスト）の設定とサンプル

### Modified Capabilities

（なし - 新規プロジェクト）

## Impact

- 新規ディレクトリ: `frontend/`
- 新規ファイル: `frontend/Dockerfile`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/*`
- 依存関係: React 18, TypeScript, Vite, Vitest, Playwright
- Docker Compose への追加が必要（この change の範囲外）
