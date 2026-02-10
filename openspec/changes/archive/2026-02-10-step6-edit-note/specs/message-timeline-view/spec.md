## ADDED Requirements

### Requirement: Message Edit Action Menu

システムは各メッセージ項目に編集操作を開始するメニュー導線を提供しなければならない（MUST）。

#### Scenario: メッセージ操作メニューから編集を選択する

- **WHEN** ユーザーが任意のメッセージ行で操作メニュー（例: `...` ボタン）を開く
- **THEN** メニュー内に「編集」操作が表示される
- **AND** 「編集」を選択すると対象メッセージが編集モードへ切り替わる

### Requirement: Inline Message Edit Mode

システムは編集対象メッセージをインライン編集モードで表示しなければならない（MUST）。

#### Scenario: 編集開始時の表示切り替え

- **WHEN** メッセージで「編集」を選択する
- **THEN** 対象メッセージ本文はテキストエリアへ切り替わる
- **AND** 「保存」ボタンと「キャンセル」ボタンが表示される

### Requirement: Message Edit Save Behavior

システムはインライン編集の保存操作時に `PUT /api/messages/:id` を呼び出し、成功時はタイムライン表示を更新しなければならない（MUST）。

#### Scenario: 保存成功時に本文表示が更新される

- **WHEN** 編集中メッセージの保存操作が成功レスポンスを受け取る
- **THEN** 対象メッセージは更新済み本文で表示される
- **AND** 編集モードは終了する

#### Scenario: 保存失敗時は編集内容を保持する

- **WHEN** 保存操作が失敗レスポンスまたは通信失敗になる
- **THEN** 編集中の入力内容は保持される
- **AND** ユーザーが再試行できるエラー表示が行われる

### Requirement: Message Edit Cancel Behavior

システムは編集キャンセル時にインライン編集を終了し、更新 API を呼び出してはならない（MUST NOT）。

#### Scenario: キャンセルで元の表示へ戻る

- **WHEN** 編集中メッセージで「キャンセル」を押す
- **THEN** 編集モードが終了して通常表示へ戻る
- **AND** `PUT /api/messages/:id` リクエストは送信されない
