## Why

現在のタイムラインは追加・編集まで対応しているが、不要になったノートを削除できず内容を整理できない。`docs/implementation-plan.md` の Step 7 を実装し、ノート管理の基本操作を完結させる必要がある。

## What Changes

- バックエンドに認証必須の `DELETE /api/messages/:id` を追加し、削除成功時は 204、ID 不正時は 400、対象なし時は 404 を返す。
- 削除対象の判定を `id` と `user_id` の組み合わせで行い、他ユーザーのメッセージは削除不可にする。
- フロントエンドのメッセージ操作メニューに「削除」を追加し、実行前に確認ダイアログを表示する。
- 確認ダイアログで「OK」を選択した場合のみ `DELETE /api/messages/:id` を実行し、成功後はタイムラインから対象メッセージを除去する。
- 確認ダイアログで「キャンセル」を選択した場合は削除 API を呼び出さず、表示内容を変更しない。

## Capabilities

### New Capabilities

- `message-delete-api`: 認証済みユーザー向けのメッセージ削除 API（`DELETE /api/messages/:id`）の要件を定義する。

### Modified Capabilities

- `message-timeline-view`: メッセージ操作メニューの削除導線、確認ダイアログ、削除実行後の一覧反映要件を追加する。

## Impact

- **バックエンド**:
  - `backend/main.go` に `DELETE /api/messages/{id}` ルーティングを追加
  - `backend/messages.go` に削除ハンドラーと SQL 削除処理を追加
  - `backend/messages_test.go` に削除 API の主要ケースを追加
- **フロントエンド**:
  - `frontend/src/components/MessageList.tsx` に削除メニューと確認フローを追加
  - `frontend/src/hooks/useMessages.ts` と `frontend/src/App.tsx` に削除処理と状態反映を追加
  - `frontend/src/components/MessageList.test.tsx` と `frontend/src/App.test.tsx` に削除操作のテストを追加
- **API**:
  - 新規エンドポイント `DELETE /api/messages/:id` を公開
