## ADDED Requirements

### Requirement: Timeline Screen Layout

認証済みメイン画面は、メッセージリスト領域と下部入力エリアで構成される Slack 風タイムラインレイアウトを提供しなければならない（MUST）。

#### Scenario: メイン画面の基本構造

- **WHEN** 認証済みユーザーがメイン画面を表示する
- **THEN** メッセージリスト領域が表示される
- **AND** 画面下部に入力エリアが表示される

#### Scenario: メッセージリスト領域のスクロール

- **WHEN** 画面に表示可能な件数を超えるメッセージが存在する
- **THEN** メッセージリスト領域は上方向へスクロール可能である

### Requirement: Timeline Data Fetch and Rendering

システムは画面表示時に `GET /api/messages` で取得したメッセージ一覧を描画しなければならない（MUST）。

#### Scenario: 一覧取得の成功

- **WHEN** メイン画面を初回表示する
- **THEN** `/api/messages` への GET リクエストが送信される
- **AND** 取得した順序でメッセージが表示される

#### Scenario: メッセージ表示内容

- **WHEN** メッセージがタイムラインに描画される
- **THEN** 各メッセージに本文が表示される
- **AND** 各メッセージに投稿時刻が表示される

### Requirement: URL Auto-Linkification

システムはメッセージ本文中の URL を検出し、クリック可能なリンクとして表示しなければならない（MUST）。

#### Scenario: URL を含む本文

- **WHEN** `https://example.com` のような URL を含むメッセージを表示する
- **THEN** URL 部分がアンカータグとして描画される
- **AND** ユーザーがリンクをクリックできる

#### Scenario: URL を含まない本文

- **WHEN** URL を含まないメッセージを表示する
- **THEN** 通常テキストとして描画される

### Requirement: Initial Scroll Position

システムは初回表示時にタイムラインを最下部へスクロールし、最新メッセージを見える状態にしなければならない（MUST）。

#### Scenario: 初回表示時のスクロール

- **WHEN** メッセージ一覧の描画が完了する
- **THEN** タイムラインの表示位置は最下部になる
- **AND** 最新メッセージが表示領域に含まれる

### Requirement: Responsive Timeline View

システムはスマホ幅と PC 幅の両方で可読性を維持したレイアウトを提供しなければならない（MUST）。

#### Scenario: スマホ幅での表示

- **WHEN** ビューポート幅がスマホ相当（例: 375px 前後）でメイン画面を表示する
- **THEN** メッセージ本文・時刻・入力エリアが横スクロールなしで読める

#### Scenario: PC 幅での表示

- **WHEN** ビューポート幅が PC 相当（例: 1280px 前後）でメイン画面を表示する
- **THEN** タイムラインが余白を保って表示される
- **AND** メッセージ本文と時刻が判読しやすい配置を維持する
