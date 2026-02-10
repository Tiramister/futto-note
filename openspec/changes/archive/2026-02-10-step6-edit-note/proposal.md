## Why

現在の実装ではノートの追加までは可能になったが、書き間違いの修正や追記の反映ができない。`docs/implementation-plan.md` の Step 6 を実装し、基本的なノート運用に必要な編集体験を完成させる必要がある。

## What Changes

- バックエンドに認証必須の `PUT /api/messages/:id` を追加し、`body` が空文字の場合は 400、対象なしの場合は 404、成功時は更新済みメッセージを返却する。
- 更新時の対象判定を `id` と `user_id` の組み合わせで行い、他ユーザーのメッセージは編集不可にする。
- フロントエンドのメッセージ項目に操作メニュー（`...` ボタン）を追加し、「編集」選択でインライン編集モードへ切り替える。
- インライン編集では「保存」で `PUT /api/messages/:id` を実行し、「キャンセル」で表示モードへ戻す。
- 保存成功後は一覧内の対象メッセージ本文を更新し、失敗時はエラーを表示して再試行可能にする。

## Capabilities

### New Capabilities

- `message-update-api`: 認証済みユーザー向けのメッセージ編集 API（`PUT /api/messages/:id`）の要件を定義する。

### Modified Capabilities

- `message-timeline-view`: メッセージごとの操作メニュー、インライン編集 UI、保存/キャンセル操作の要件を追加する。

## Impact

- **バックエンド**:
  - `backend/main.go` に `PUT /api/messages/{id}` ルーティングを追加
  - `backend/messages.go` に更新ハンドラーと SQL 更新処理を追加
  - `backend/messages_test.go` に更新 API の主要ケースを追加
- **フロントエンド**:
  - `frontend/src/components/MessageList.tsx` に編集メニューとインライン編集 UI を追加
  - `frontend/src/App.tsx` と `frontend/src/hooks/useMessages.ts` に編集状態管理と更新処理を追加
  - `frontend/src/App.css` と `frontend/src/App.test.tsx` に編集 UI のスタイルとテストを追加
- **API**:
  - 新規エンドポイント `PUT /api/messages/:id` を公開
