## ADDED Requirements

### Requirement: Message Copy Action Menu

システムは各メッセージ項目の操作メニューに、既存の編集・削除導線を維持したまま「コピー」導線を提供しなければならない（MUST）。

#### Scenario: 操作メニューにコピーを表示する

- **WHEN** ユーザーが任意のメッセージ行で操作メニューを開く
- **THEN** メニュー内に「コピー」操作が表示される
- **AND** 同じメニュー内に既存の「編集」と「削除」操作も表示される

### Requirement: Message Body Clipboard Copy

システムはユーザーがメッセージの「コピー」を選択したとき、対象メッセージ本文を `navigator.clipboard.writeText(body)` でクリップボードへ書き込まなければならない（MUST）。

#### Scenario: コピー操作で本文を書き込む

- **WHEN** ユーザーが本文を含むメッセージで「コピー」を選択する
- **THEN** システムは対象メッセージ本文を引数として `navigator.clipboard.writeText` を呼び出す

### Requirement: Clipboard Copy Completion Feedback

システムはクリップボードコピー成功時に、対象メッセージでコピー完了を示す視覚フィードバック（アイコン変化）を即時表示しなければならない（MUST）。

#### Scenario: コピー成功時にアイコン変化を表示する

- **WHEN** メッセージ本文のクリップボード書き込みが成功する
- **THEN** 対象メッセージでコピー完了を示すアイコン変化が表示される

