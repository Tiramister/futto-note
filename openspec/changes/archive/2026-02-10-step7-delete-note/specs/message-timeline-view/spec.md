## ADDED Requirements

### Requirement: Message Delete Action Menu

システムは各メッセージ項目の操作メニューに削除導線を提供しなければならない（MUST）。

#### Scenario: 操作メニューに削除を表示する

- **WHEN** ユーザーが任意のメッセージ行で操作メニューを開く
- **THEN** メニュー内に「削除」操作が表示される

### Requirement: Message Delete Confirmation Dialog

システムは削除実行前に確認ダイアログを表示し、ユーザー確認なしに削除を確定してはならない（MUST NOT）。

#### Scenario: 削除選択時に確認ダイアログを表示する

- **WHEN** ユーザーがメッセージの「削除」を選択する
- **THEN** 「このメッセージを削除しますか？」という確認ダイアログが表示される

### Requirement: Confirmed Message Delete Execution

システムは確認ダイアログで削除を承認した場合のみ `DELETE /api/messages/:id` を呼び出し、成功時にタイムラインから対象メッセージを除去しなければならない（MUST）。

#### Scenario: 確認ダイアログで OK を選択する

- **WHEN** ユーザーが確認ダイアログで「OK」を選択する
- **THEN** `DELETE /api/messages/:id` が送信される
- **AND** 削除成功後に対象メッセージがタイムラインから消える

### Requirement: Message Delete Cancel Behavior

システムは確認ダイアログでキャンセルされた場合、削除 API を呼び出してはならず、表示内容を変更してはならない（MUST NOT）。

#### Scenario: 確認ダイアログでキャンセルを選択する

- **WHEN** ユーザーが確認ダイアログで「キャンセル」を選択する
- **THEN** `DELETE /api/messages/:id` リクエストは送信されない
- **AND** 対象メッセージはタイムラインに残る
