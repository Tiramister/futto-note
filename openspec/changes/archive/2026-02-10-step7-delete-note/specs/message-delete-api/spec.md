## ADDED Requirements

### Requirement: Authenticated Message Delete Endpoint

システムは認証済みユーザー向けに `DELETE /api/messages/:id` エンドポイントを提供しなければならない（MUST）。

#### Scenario: 認証済みユーザーがメッセージを削除する

- **WHEN** 有効なセッショントークンを持つユーザーが `DELETE /api/messages/:id` を送信する
- **THEN** ステータス 204 が返却される
- **AND** レスポンスボディは空である

#### Scenario: 未認証ユーザーは削除できない

- **WHEN** セッショントークンを持たない状態で `DELETE /api/messages/:id` を送信する
- **THEN** ステータス 401 が返却される

### Requirement: Message Delete Validation

システムはメッセージ削除時に不正なメッセージ ID を受け付けてはならない（MUST NOT）。

#### Scenario: 不正なメッセージ ID を指定する

- **WHEN** 整数に変換できない `:id` で `DELETE /api/messages/:id` を送信する
- **THEN** ステータス 400 が返却される
- **AND** メッセージは削除されない

### Requirement: User-Scoped Message Deletion

システムは削除対象を `id` と `user_id` で絞り込み、他ユーザーのメッセージを削除してはならない（MUST NOT）。

#### Scenario: 対象メッセージが存在しない

- **WHEN** 指定 `id` に該当する削除可能メッセージが存在しない状態で `DELETE /api/messages/:id` を送信する
- **THEN** ステータス 404 が返却される

#### Scenario: 他ユーザーのメッセージを削除しようとする

- **WHEN** ユーザー A がユーザー B のメッセージ ID に対して `DELETE /api/messages/:id` を送信する
- **THEN** ステータス 404 が返却される
- **AND** ユーザー B のメッセージは削除されない
