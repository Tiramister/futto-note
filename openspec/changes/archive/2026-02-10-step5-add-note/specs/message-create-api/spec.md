## ADDED Requirements

### Requirement: Authenticated Message Create Endpoint

システムは認証済みユーザー向けに `POST /api/messages` エンドポイントを提供しなければならない（MUST）。

#### Scenario: 認証済みユーザーがメッセージを作成する

- **WHEN** 有効なセッショントークンを持つユーザーが `body` を含む `POST /api/messages` を送信する
- **THEN** ステータス 201 が返却される
- **AND** レスポンスボディに作成済みメッセージが含まれる

#### Scenario: 未認証ユーザーは作成できない

- **WHEN** セッショントークンを持たない状態で `POST /api/messages` を送信する
- **THEN** ステータス 401 が返却される

### Requirement: Message Body Validation

システムはメッセージ作成時に `body` が空文字のリクエストを受け付けてはならない（MUST NOT）。

#### Scenario: 空文字のメッセージを送信する

- **WHEN** `body` が空文字 `""` の `POST /api/messages` を送信する
- **THEN** ステータス 400 が返却される
- **AND** メッセージは新規作成されない

### Requirement: Message Creation Response Shape

システムはメッセージ作成成功時、作成結果を `id`, `body`, `created_at` を含む JSON として返却しなければならない（MUST）。

#### Scenario: 作成成功時のレスポンス形式

- **WHEN** メッセージ作成が成功する
- **THEN** レスポンスは `id`（整数）, `body`（文字列）, `created_at`（RFC 3339 形式の日時文字列）を含む

#### Scenario: 作成ユーザーに紐づくメッセージとして保存される

- **WHEN** ユーザー A が `POST /api/messages` でメッセージを作成する
- **AND** `messages` テーブルに他ユーザーのデータが存在する
- **THEN** 新規メッセージはユーザー A の `user_id` に紐づいて保存される
