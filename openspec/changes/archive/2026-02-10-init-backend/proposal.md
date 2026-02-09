## Why

フロントエンドは構築済みだが、バックエンド API と DB がないためアプリケーションが機能しない。ノートアプリの中核となるデータ永続化層とAPI サーバーを構築する。

## What Changes

- Go 言語によるバックエンドプロジェクトの新規作成（`backend/` ディレクトリ）
- PostgreSQL データベースの初期化スクリプト作成（`db/init.sql`）
- Docker Compose への backend/db サービス追加
- ヘルスチェック API エンドポイント（`GET /api/health`）の実装
- ユーザー登録用 CLI ツールの作成（`tools/create_user.go`）

## Capabilities

### New Capabilities

- `backend-project`: Go モジュールの初期化、HTTP サーバー構成、PostgreSQL 接続
- `database-schema`: users, sessions, messages テーブルの DDL 定義
- `health-check-api`: DB 接続確認用のヘルスチェックエンドポイント
- `docker-backend`: backend と db の Docker Compose サービス定義
- `user-registration-tool`: bcrypt ハッシュ化したユーザー INSERT 文を生成する CLI ツール

### Modified Capabilities

なし

## Impact

- **新規ディレクトリ**: `backend/`, `db/`, `tools/`
- **Docker**: `docker-compose.yml` に backend, db サービスを追加
- **ネットワーク**: フロントエンドの Vite プロキシ設定で `/api/*` を backend に転送
- **依存関係**: Go モジュール（chi, lib/pq, bcrypt）
