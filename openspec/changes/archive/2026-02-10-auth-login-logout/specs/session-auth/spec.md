## ADDED Requirements

### Requirement: Login API

システムは `POST /api/login` エンドポイントを提供し、ユーザー名とパスワードによる認証を行う。認証成功時はセッショントークンを Cookie で返却し、ユーザー情報を JSON で返す。

#### Scenario: ログイン成功

- **WHEN** 有効なユーザー名とパスワードで `/api/login` に POST リクエストを送信する
- **THEN** ステータス 200 が返却される
- **AND** レスポンスボディに `{ "user": { "id": "...", "username": "..." } }` が含まれる
- **AND** `Set-Cookie` ヘッダーでセッショントークンが設定される
- **AND** Cookie は `HttpOnly`, `SameSite=Strict`, `Path=/`, `Max-Age=2592000`（30日）が設定される

#### Scenario: ユーザーが存在しない

- **WHEN** 存在しないユーザー名で `/api/login` に POST リクエストを送信する
- **THEN** ステータス 401 が返却される
- **AND** レスポンスボディにエラーメッセージが含まれる

#### Scenario: パスワードが不一致

- **WHEN** 正しいユーザー名だが誤ったパスワードで `/api/login` に POST リクエストを送信する
- **THEN** ステータス 401 が返却される
- **AND** レスポンスボディにエラーメッセージが含まれる

### Requirement: Logout API

システムは `POST /api/logout` エンドポイントを提供し、現在のセッションを破棄する。

#### Scenario: ログアウト成功

- **WHEN** 有効なセッショントークンを持つ状態で `/api/logout` に POST リクエストを送信する
- **THEN** ステータス 204 が返却される
- **AND** `sessions` テーブルから該当セッションが削除される
- **AND** `Set-Cookie` ヘッダーで Cookie が無効化される（`Max-Age=0`）

#### Scenario: セッションなしでログアウト

- **WHEN** セッショントークンがない状態で `/api/logout` に POST リクエストを送信する
- **THEN** ステータス 204 が返却される（エラーにはしない）

### Requirement: Session Check API

システムは `GET /api/me` エンドポイントを提供し、現在のログイン状態を確認できる。

#### Scenario: 有効なセッション

- **WHEN** 有効期限内のセッショントークンを持つ状態で `/api/me` に GET リクエストを送信する
- **THEN** ステータス 200 が返却される
- **AND** レスポンスボディに `{ "user": { "id": "...", "username": "..." } }` が含まれる

#### Scenario: セッションが期限切れ

- **WHEN** 有効期限切れのセッショントークンを持つ状態で `/api/me` に GET リクエストを送信する
- **THEN** ステータス 401 が返却される

#### Scenario: セッションなし

- **WHEN** セッショントークンがない状態で `/api/me` に GET リクエストを送信する
- **THEN** ステータス 401 が返却される

### Requirement: Authentication Middleware

認証が必要な API エンドポイントに適用するミドルウェアを提供する。

#### Scenario: 有効なセッションでのアクセス

- **WHEN** 認証ミドルウェアが適用されたエンドポイントに有効なセッショントークンでアクセスする
- **THEN** リクエストは次のハンドラーに渡される
- **AND** リクエストコンテキストに `user_id` が設定される

#### Scenario: 無効なセッションでのアクセス

- **WHEN** 認証ミドルウェアが適用されたエンドポイントに無効または期限切れのセッショントークンでアクセスする
- **THEN** ステータス 401 が返却される
- **AND** リクエストはハンドラーに渡されない

#### Scenario: セッショントークンなしでのアクセス

- **WHEN** 認証ミドルウェアが適用されたエンドポイントにセッショントークンなしでアクセスする
- **THEN** ステータス 401 が返却される

### Requirement: Session Token Generation

セッショントークンは安全なランダム値として生成される。

#### Scenario: トークン生成

- **WHEN** ログイン成功時にセッショントークンを生成する
- **THEN** `crypto/rand` で 32 バイトのランダム値が生成される
- **AND** hex エンコードされた 64 文字の文字列として使用される

### Requirement: Session Storage

セッションは `sessions` テーブルに保存され、有効期限が管理される。

#### Scenario: セッション作成

- **WHEN** ログイン成功時
- **THEN** `sessions` テーブルに新しいレコードが作成される
- **AND** `expires_at` は現在時刻 + 30日に設定される

#### Scenario: セッション削除

- **WHEN** ログアウト時
- **THEN** `sessions` テーブルから該当レコードが削除される
