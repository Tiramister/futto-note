## ADDED Requirements

### Requirement: Authenticated Message Update Endpoint

システムは認証済みユーザー向けに `PUT /api/messages/:id` エンドポイントを提供しなければならない（MUST）。

#### Scenario: 認証済みユーザーがメッセージを更新する

- **WHEN** 有効なセッショントークンを持つユーザーが `body` を含む `PUT /api/messages/:id` を送信する
- **THEN** ステータス 200 が返却される
- **AND** レスポンスボディに更新済みメッセージが含まれる

#### Scenario: 未認証ユーザーは更新できない

- **WHEN** セッショントークンを持たない状態で `PUT /api/messages/:id` を送信する
- **THEN** ステータス 401 が返却される

### Requirement: Message Update Validation

システムはメッセージ更新時に不正な入力を受け付けてはならない（MUST NOT）。

#### Scenario: 空文字の本文を送信する

- **WHEN** `body` が空文字 `""` の `PUT /api/messages/:id` を送信する
- **THEN** ステータス 400 が返却される
- **AND** メッセージは更新されない

#### Scenario: 不正なメッセージ ID を指定する

- **WHEN** 整数に変換できない `:id` で `PUT /api/messages/:id` を送信する
- **THEN** ステータス 400 が返却される
- **AND** メッセージは更新されない

### Requirement: User-Scoped Message Update

システムは更新対象を `id` と `user_id` で絞り込み、他ユーザーのメッセージを更新してはならない（MUST NOT）。

#### Scenario: 対象メッセージが存在しない

- **WHEN** 指定 `id` に該当する更新可能メッセージが存在しない状態で `PUT /api/messages/:id` を送信する
- **THEN** ステータス 404 が返却される

#### Scenario: 他ユーザーのメッセージを更新しようとする

- **WHEN** ユーザー A がユーザー B のメッセージ ID に対して `PUT /api/messages/:id` を送信する
- **THEN** ステータス 404 が返却される
- **AND** ユーザー B のメッセージ内容は変更されない

### Requirement: Message Update Response Shape

システムは更新成功時、更新済みメッセージを `id`, `body`, `created_at` を含む JSON として返却しなければならない（MUST）。

#### Scenario: 更新成功時のレスポンス形式

- **WHEN** メッセージ更新が成功する
- **THEN** レスポンスは `id`（整数）, `body`（文字列）, `created_at`（RFC 3339 形式の日時文字列）を含む
