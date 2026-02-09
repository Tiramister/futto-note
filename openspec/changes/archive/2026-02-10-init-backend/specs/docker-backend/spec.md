## ADDED Requirements

### Requirement: db サービスの定義
PostgreSQL データベースを `db` サービスとして Docker Compose に定義する。

#### Scenario: db サービスの設定
- **WHEN** `docker compose up` を実行する
- **THEN** 以下の設定で PostgreSQL コンテナが起動する
  - イメージ: `postgres:16`
  - ポート: `5432` をホストにマッピング
  - 環境変数: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` を設定
  - ボリューム: `db/init.sql` を `/docker-entrypoint-initdb.d/` にマウント

### Requirement: backend サービスの定義
Go バックエンドを `backend` サービスとして Docker Compose に定義する。

#### Scenario: backend サービスの設定
- **WHEN** `docker compose up` を実行する
- **THEN** 以下の設定でバックエンドコンテナが起動する
  - ビルド: `./backend` ディレクトリの Dockerfile を使用
  - ポート: `8080` をホストにマッピング
  - 環境変数: DB 接続情報（`DB_HOST=db`, `DB_PORT=5432` など）を設定
  - 依存関係: `db` サービスに依存

### Requirement: ネットワーク構成
全サービスは同一 Docker ネットワーク上で通信する。

#### Scenario: サービス間の名前解決
- **WHEN** backend コンテナから `db` ホストに接続する
- **THEN** Docker の内部 DNS により `db` サービスの IP アドレスが解決される

### Requirement: frontend との統合
既存の frontend サービスと backend/db サービスを統合する。

#### Scenario: 3サービスの同時起動
- **WHEN** `docker compose up` を実行する
- **THEN** frontend, backend, db の 3 サービスが起動する

#### Scenario: API プロキシの動作
- **WHEN** frontend から `/api/*` へのリクエストが発生する
- **THEN** Vite のプロキシ設定により `http://backend:8080` に転送される
