## Why

現在の実装ではメッセージ一覧を閲覧できるものの、新しいノートを追加する操作ができず、アプリの主目的である「思いついたことを即座に記録する」体験が未完成である。Step 6 以降の編集・削除に進む前に、作成フローを確立して書き込み系の基本動作を完成させる必要がある。

## What Changes

- バックエンドに認証必須の `POST /api/messages` を追加し、`body` が空文字の場合は 400、作成成功時は 201 で `id`, `body`, `created_at` を返却する。
- フロントエンドの下部入力エリアに、テキスト入力欄と送信ボタンを備えた投稿 UI を追加する。
- 入力操作として Enter 改行、Ctrl+Enter 送信をサポートする。
- 送信成功後に入力欄をクリアし、作成されたメッセージをタイムラインへ反映して最下部へスクロールする。
- 空テキストの送信を防止し、無効な投稿リクエストを行わないようにする。

## Capabilities

### New Capabilities

- `message-create-api`: 認証済みユーザーがメッセージを作成する `POST /api/messages` の入力検証、作成処理、レスポンス要件を定義する。

### Modified Capabilities

- `message-timeline-view`: 下部入力エリアの送信操作（Enter/Ctrl+Enter）、空入力の送信抑止、送信成功後の入力クリアとタイムライン末尾追従を要件として追加する。

## Impact

- **バックエンド**:
  - `backend/main.go` に `POST /api/messages` ハンドラーとルーティングを追加
  - `messages` テーブルへの INSERT クエリと入力検証を追加
- **フロントエンド**:
  - `frontend/src/App.tsx` に入力状態管理、送信処理、送信後のタイムライン更新処理を追加
  - `frontend/src/App.css` に入力エリアと送信ボタンのスタイル調整を追加
- **API**:
  - 新規エンドポイント `POST /api/messages` を公開
- **データベース**:
  - 既存 `messages` テーブルを利用し、スキーマ変更は不要
