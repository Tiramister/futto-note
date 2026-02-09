## ADDED Requirements

### Requirement: users テーブルの定義
ユーザー情報を格納する `users` テーブルを作成する。

#### Scenario: テーブル構造
- **WHEN** `users` テーブルを参照する
- **THEN** 以下のカラムが存在する
  - `id`: UUID 型、主キー、デフォルトで `gen_random_uuid()` により自動生成
  - `username`: VARCHAR(255) 型、ユニーク制約、NOT NULL
  - `password_hash`: VARCHAR(255) 型、NOT NULL
  - `created_at`: TIMESTAMP 型、デフォルトで現在時刻、NOT NULL

### Requirement: sessions テーブルの定義
セッション情報を格納する `sessions` テーブルを作成する。

#### Scenario: テーブル構造
- **WHEN** `sessions` テーブルを参照する
- **THEN** 以下のカラムが存在する
  - `token`: VARCHAR(64) 型、主キー
  - `user_id`: UUID 型、`users.id` への外部キー（CASCADE 削除）、NOT NULL
  - `expires_at`: TIMESTAMP 型、NOT NULL
  - `created_at`: TIMESTAMP 型、デフォルトで現在時刻、NOT NULL

### Requirement: messages テーブルの定義
メッセージ（ノート）を格納する `messages` テーブルを作成する。

#### Scenario: テーブル構造
- **WHEN** `messages` テーブルを参照する
- **THEN** 以下のカラムが存在する
  - `id`: SERIAL 型、主キー
  - `user_id`: UUID 型、`users.id` への外部キー（CASCADE 削除）、NOT NULL
  - `body`: TEXT 型、NOT NULL
  - `created_at`: TIMESTAMP 型、デフォルトで現在時刻、NOT NULL

### Requirement: 初期化スクリプトの配置
DDL は `db/init.sql` に配置し、PostgreSQL コンテナ起動時に自動実行される。

#### Scenario: コンテナ起動時の初期化
- **WHEN** PostgreSQL コンテナが初回起動される
- **THEN** `db/init.sql` の内容が実行され、3 つのテーブルが作成される
