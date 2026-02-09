## ADDED Requirements

### Requirement: Vitest によるユニットテスト実行

`npm run test` コマンドで Vitest によるユニットテストを実行できなければならない（SHALL）。

#### Scenario: ユニットテストの実行

- **WHEN** `frontend/` ディレクトリで `npm run test` を実行する
- **THEN** Vitest がテストを実行し、結果を出力する

### Requirement: サンプルユニットテストの存在

プロジェクトには動作確認用のサンプルユニットテストが含まれていなければならない（SHALL）。

#### Scenario: サンプルテストの成功

- **WHEN** サンプルユニットテストを実行する
- **THEN** テストが成功する

### Requirement: Playwright による E2E テスト実行

`npm run test:e2e` コマンドで Playwright による E2E テストを実行できなければならない（SHALL）。

#### Scenario: E2E テストの実行

- **WHEN** `frontend/` ディレクトリで `npm run test:e2e` を実行する
- **THEN** Playwright がブラウザを起動してテストを実行し、結果を出力する

### Requirement: サンプル E2E テストの存在

プロジェクトには動作確認用のサンプル E2E テストが含まれていなければならない（SHALL）。

#### Scenario: サンプル E2E テストの成功

- **WHEN** 開発サーバーが起動した状態でサンプル E2E テストを実行する
- **THEN** テストが成功する

### Requirement: ヘッドレスモードでの実行

E2E テストはデフォルトでヘッドレスモードで実行されなければならない（SHALL）。

#### Scenario: CI 環境での実行

- **WHEN** ヘッドレス環境で E2E テストを実行する
- **THEN** ブラウザ UI なしでテストが実行される
