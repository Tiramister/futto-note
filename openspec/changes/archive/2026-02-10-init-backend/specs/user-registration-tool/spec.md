## ADDED Requirements

### Requirement: CLI ツールの提供
ユーザー登録用の CLI ツールを `tools/create_user.go` として提供する。

#### Scenario: ツールの実行
- **WHEN** `go run tools/create_user.go -username <name> -password <pass>` を実行する
- **THEN** ユーザー登録用の SQL INSERT 文が標準出力に出力される

### Requirement: パスワードのハッシュ化
パスワードは bcrypt アルゴリズムでハッシュ化する。

#### Scenario: bcrypt ハッシュの生成
- **WHEN** パスワードが入力される
- **THEN** `golang.org/x/crypto/bcrypt` を使用してハッシュ化される

#### Scenario: ハッシュのコスト
- **WHEN** bcrypt ハッシュを生成する
- **THEN** デフォルトコスト（10）を使用する

### Requirement: INSERT 文の出力
生成される INSERT 文は `users` テーブルに直接実行可能な形式とする。

#### Scenario: 出力形式
- **WHEN** ユーザー名 `testuser` とパスワード `secret123` で実行する
- **THEN** 以下の形式で SQL が出力される
  ```
  INSERT INTO users (username, password_hash) VALUES ('testuser', '$2a$10$...');
  ```

### Requirement: 引数のバリデーション
必須引数が不足している場合はエラーを表示する。

#### Scenario: username 未指定
- **WHEN** `-username` フラグなしで実行する
- **THEN** エラーメッセージを表示して終了コード 1 で終了する

#### Scenario: password 未指定
- **WHEN** `-password` フラグなしで実行する
- **THEN** エラーメッセージを表示して終了コード 1 で終了する
