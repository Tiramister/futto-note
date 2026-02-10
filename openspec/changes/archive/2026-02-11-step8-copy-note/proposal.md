## Why

現状のタイムラインは追加・編集・削除まで対応しているが、本文を再利用するためのコピー操作がなく、特にモバイル環境で素早く内容を転用しづらい。`docs/implementation-plan.md` の Step 8 を実装し、手軽なメモアプリとしての基本操作を完成させる必要がある。

## What Changes

- フロントエンドの各メッセージ操作メニューに「コピー」を追加する。
- 「コピー」選択時に `navigator.clipboard.writeText(body)` を実行し、対象メッセージ本文をクリップボードへ書き込む。
- コピー成功時にアイコン変化の即時フィードバックを表示する。
- コピー操作は既存の編集・削除導線を損なわないメニュー構成で提供する。

## Capabilities

### New Capabilities

- なし

### Modified Capabilities

- `message-timeline-view`: メッセージ操作メニューのコピー導線、クリップボード書き込み、コピー完了フィードバック表示の要件を追加する。

## Impact

- **フロントエンド**:
  - `frontend/src/components/MessageList.tsx` にコピー操作メニューとクリップボード呼び出し処理を追加
  - `frontend/src/App.tsx` にコピー完了フィードバック表示用の状態管理と描画を追加
  - `frontend/src/App.css` にコピー完了フィードバック（アイコン変化）のスタイルを追加
  - `frontend/src/components/MessageList.test.tsx` と `frontend/src/App.test.tsx` にコピー操作と完了フィードバックのテストを追加
- **バックエンド / API**:
  - 変更なし（既存 API を利用）
