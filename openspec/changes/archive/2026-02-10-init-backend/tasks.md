## 1. データベース初期化

- [x] 1.1 `db/` ディレクトリを作成する
- [x] 1.2 `db/init.sql` に users, sessions, messages テーブルの DDL を記述する

## 2. バックエンドプロジェクト構成

- [x] 2.1 `backend/` ディレクトリを作成する
- [x] 2.2 `go mod init futto-note/backend` でモジュールを初期化する
- [x] 2.3 依存パッケージを追加する（chi, lib/pq）
- [x] 2.4 `backend/main.go` を作成し、HTTP サーバーの雛形を実装する
- [x] 2.5 PostgreSQL への接続処理を実装する
- [x] 2.6 `GET /api/health` エンドポイントを実装する

## 3. Docker 設定

- [x] 3.1 `backend/Dockerfile` を作成する（マルチステージビルド）
- [x] 3.2 `docker-compose.yml` を作成し、db サービスを定義する
- [x] 3.3 `docker-compose.yml` に backend サービスを追加する
- [x] 3.4 `docker-compose.yml` に frontend サービスを追加する
- [x] 3.5 frontend の Vite プロキシ設定で `/api` を backend に転送するよう設定する

## 4. ユーザー登録ツール

- [x] 4.1 `tools/` ディレクトリを作成する
- [x] 4.2 `tools/create_user.go` を作成し、bcrypt ハッシュ生成と INSERT 文出力を実装する

## 5. 動作確認

- [x] 5.1 `docker compose up` で 3 サービスが起動することを確認する
- [x] 5.2 フロントエンドから `/api/health` を呼び出して 200 が返ることを確認する
- [x] 5.3 `create_user.go` でユーザー INSERT 文を生成し、DB に登録できることを確認する
