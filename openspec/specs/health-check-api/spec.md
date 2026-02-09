## ADDED Requirements

### Requirement: ヘルスチェックエンドポイント
`GET /api/health` エンドポイントを提供し、バックエンドとデータベースの接続状態を確認できる。

#### Scenario: 正常時のレスポンス
- **WHEN** データベース接続が正常な状態で `GET /api/health` にリクエストを送信する
- **THEN** ステータスコード `200` と JSON レスポンス `{"status": "ok"}` が返却される

#### Scenario: データベース接続失敗時のレスポンス
- **WHEN** データベース接続が失敗している状態で `GET /api/health` にリクエストを送信する
- **THEN** ステータスコード `503` と JSON レスポンス `{"status": "error", "message": "database connection failed"}` が返却される

### Requirement: データベース接続確認
ヘルスチェックはデータベースに対して `SELECT 1` を実行して接続を確認する。

#### Scenario: SELECT 1 による疎通確認
- **WHEN** ヘルスチェックが実行される
- **THEN** データベースに `SELECT 1` クエリを発行し、正常に結果が返ることを確認する
