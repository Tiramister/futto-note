## ADDED Requirements

### Requirement: Timeline Message Composer Layout

認証済みメイン画面は、画面下部に固定配置されたメッセージ入力欄と送信ボタンを提供しなければならない（MUST）。

#### Scenario: 入力エリアの基本構造

- **WHEN** 認証済みユーザーがタイムライン画面を表示する
- **THEN** 画面下部にテキスト入力欄が表示される
- **AND** 送信ボタンが表示される

### Requirement: Timeline Message Submission Interaction

システムはメッセージ入力欄で Enter による改行と Ctrl+Enter による送信を区別して処理しなければならない（MUST）。

#### Scenario: Enter で改行する

- **WHEN** 入力欄に本文を入力した状態で Enter キーを押す
- **THEN** 本文に改行が追加される
- **AND** `POST /api/messages` の送信処理は実行されない

#### Scenario: Ctrl+Enter で送信する

- **WHEN** 入力欄に本文を入力した状態で Ctrl+Enter キーを押す
- **THEN** `POST /api/messages` への送信処理が実行される

### Requirement: Post-Submit Timeline Update

システムはメッセージ送信成功時、入力欄をクリアし、作成されたメッセージをタイムラインに反映したうえで最下部へスクロールしなければならない（MUST）。

#### Scenario: 送信成功後の UI 更新

- **WHEN** `POST /api/messages` が成功レスポンスを返す
- **THEN** 入力欄の値は空文字にリセットされる
- **AND** 作成されたメッセージがタイムラインへ追加表示される
- **AND** タイムライン表示位置は最下部になる

### Requirement: Empty Message Submission Guard

システムは空テキストのメッセージ送信を実行してはならない（MUST NOT）。

#### Scenario: 空テキスト時の送信抑止

- **WHEN** 入力欄が空文字の状態で送信操作を行う
- **THEN** `POST /api/messages` リクエストは送信されない
