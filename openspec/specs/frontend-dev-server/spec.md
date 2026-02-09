## ADDED Requirements

### Requirement: Vite 開発サーバーが起動する

システムは `npm run dev` コマンドで Vite 開発サーバーを起動できなければならない（SHALL）。

#### Scenario: 開発サーバーの起動

- **WHEN** `frontend/` ディレクトリで `npm run dev` を実行する
- **THEN** ポート 3000 で開発サーバーが起動する

### Requirement: Docker コンテナ内でアクセス可能

開発サーバーは Docker コンテナ内から外部ホストにアクセス可能でなければならない（SHALL）。

#### Scenario: コンテナ外からのアクセス

- **WHEN** Docker コンテナ内で開発サーバーが起動している
- **THEN** ホストマシンから `http://localhost:3000` でアクセスできる

### Requirement: API プロキシ設定

`/api/*` へのリクエストはバックエンドサーバーにプロキシされなければならない（SHALL）。

#### Scenario: API リクエストのプロキシ

- **WHEN** フロントエンドから `/api/health` にリクエストする
- **THEN** リクエストは `http://backend:8080/api/health` に転送される

### Requirement: HMR がコンテナ内で動作する

ファイル変更時に Hot Module Replacement が動作しなければならない（SHALL）。

#### Scenario: ファイル変更の検知

- **WHEN** Docker ボリュームマウント経由でソースファイルを変更する
- **THEN** ブラウザがリロードなしで変更を反映する
