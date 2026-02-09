## ADDED Requirements

### Requirement: Authenticated Message List Endpoint

システムは認証済みユーザー向けに `GET /api/messages` エンドポイントを提供しなければならない（MUST）。

#### Scenario: 認証済みユーザーが一覧を取得する

- **WHEN** 有効なセッショントークンを持つユーザーが `/api/messages` に GET リクエストを送信する
- **THEN** ステータス 200 が返却される
- **AND** レスポンスボディに `messages` 配列が含まれる

#### Scenario: 未認証ユーザーが一覧を取得する

- **WHEN** セッショントークンを持たない状態で `/api/messages` に GET リクエストを送信する
- **THEN** ステータス 401 が返却される

### Requirement: User-Scoped Message Retrieval

システムはログイン中ユーザー自身のメッセージのみを返却しなければならない（MUST）。

#### Scenario: 複数ユーザーのデータが存在する

- **WHEN** 複数ユーザーのメッセージが `messages` テーブルに保存されている
- **AND** ユーザー A が `/api/messages` を呼び出す
- **THEN** レスポンスにはユーザー A の `user_id` に紐づくメッセージのみが含まれる
- **AND** 他ユーザーのメッセージは含まれない

### Requirement: Message Ordering and Response Shape

システムはメッセージを `created_at` 昇順で返却し、各要素に `id`, `body`, `created_at` を含めなければならない（MUST）。

#### Scenario: 複数メッセージの並び順

- **WHEN** 同一ユーザーに対して異なる `created_at` のメッセージが複数存在する
- **THEN** レスポンスの `messages` は古い投稿から新しい投稿の順に並ぶ

#### Scenario: 各メッセージ要素の形式

- **WHEN** `/api/messages` のレスポンスが返却される
- **THEN** 各メッセージ要素は `id`（整数）, `body`（文字列）, `created_at`（RFC 3339 形式の日時文字列）を含む

#### Scenario: メッセージが存在しない

- **WHEN** 対象ユーザーにメッセージが 1 件も存在しない状態で `/api/messages` を呼び出す
- **THEN** ステータス 200 が返却される
- **AND** `messages` は空配列 `[]` になる
