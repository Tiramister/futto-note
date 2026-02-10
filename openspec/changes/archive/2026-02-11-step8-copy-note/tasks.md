## 1. メッセージメニューのコピー導線追加

- [x] 1.1 `frontend/src/components/MessageList.tsx` の props に `onCopy` とコピー状態表示用の入力を追加し、メニューへ「コピー」項目を追加する
- [x] 1.2 コピー項目押下時に対象メッセージを `onCopy` へ渡し、既存の編集・削除導線を維持したままメニューを閉じる挙動を実装する

## 2. クリップボード書き込みと状態管理

- [x] 2.1 `frontend/src/App.tsx` に `handleCopyMessage` を追加し、`navigator.clipboard.writeText(body)` の成功・失敗を処理する
- [x] 2.2 `frontend/src/App.tsx` にコピー成功フィードバック状態（例: `copiedMessageId`）と失敗時エラー状態を追加し、既存 UI に表示する
- [x] 2.3 コピー成功フィードバックを短時間で解除するタイマー管理と、ログアウト時の関連 state 初期化を実装する

## 3. コピー完了フィードバックの見た目調整

- [x] 3.1 `frontend/src/App.css` にコピー完了時のアイコン変化スタイルを追加し、モバイル幅と PC 幅で既存メニューの可読性を維持する

## 4. テスト追加と非回帰確認

- [x] 4.1 `frontend/src/components/MessageList.test.tsx` にコピー項目の表示と既存メニュー構造維持のテストを追加する
- [x] 4.2 `frontend/src/App.test.tsx` で `navigator.clipboard.writeText` の成功時呼び出しとコピー完了フィードバック表示を検証する
- [x] 4.3 `frontend/src/App.test.tsx` でコピー失敗時のエラー表示と既存編集・削除フローの非回帰を検証する
- [x] 4.4 フロントエンドテストコマンドを実行し、追加したコピー関連テストが通ることを確認する
