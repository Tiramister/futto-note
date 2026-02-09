## ADDED Requirements

### Requirement: Go モジュールの初期化
バックエンドプロジェクトは `backend/` ディレクトリに Go モジュールとして構成される。モジュール名は `futto-note/backend` とする。

#### Scenario: go mod init 実行
- **WHEN** `backend/` ディレクトリで `go mod init` を実行する
- **THEN** `go.mod` ファイルが作成され、モジュール名が設定される

### Requirement: HTTP サーバーの起動
バックエンドは chi ルーターを使用して HTTP サーバーを起動する。ポート番号は環境変数 `PORT` で指定可能とし、デフォルトは `8080` とする。

#### Scenario: デフォルトポートでの起動
- **WHEN** 環境変数 `PORT` が未設定の状態でサーバーを起動する
- **THEN** サーバーはポート `8080` でリッスンする

#### Scenario: カスタムポートでの起動
- **WHEN** 環境変数 `PORT=3000` を設定してサーバーを起動する
- **THEN** サーバーはポート `3000` でリッスンする

### Requirement: PostgreSQL への接続
バックエンドは起動時に PostgreSQL データベースへ接続する。接続情報は環境変数で設定する。

#### Scenario: 環境変数による接続設定
- **WHEN** 以下の環境変数が設定されている
  - `DB_HOST`: データベースホスト
  - `DB_PORT`: データベースポート
  - `DB_USER`: ユーザー名
  - `DB_PASSWORD`: パスワード
  - `DB_NAME`: データベース名
- **THEN** バックエンドはこれらの値を使用してデータベースに接続する

#### Scenario: 接続失敗時のエラー
- **WHEN** データベースへの接続に失敗する
- **THEN** エラーメッセージをログに出力してプロセスを終了する

### Requirement: Dockerfile の作成
バックエンドのビルドと実行用の Dockerfile を `backend/Dockerfile` に作成する。

#### Scenario: マルチステージビルド
- **WHEN** Dockerfile をビルドする
- **THEN** ビルドステージで Go バイナリをコンパイルし、実行ステージでは軽量イメージ上でバイナリを実行する
