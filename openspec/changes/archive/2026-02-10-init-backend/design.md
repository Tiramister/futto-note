## Context

フロントエンド（Vite + React + TypeScript）は `frontend/` ディレクトリに構築済み。バックエンドとデータベースを追加して、フルスタックアプリケーションとして機能させる。

現状:
- フロントエンドのみ存在（開発サーバーは動作確認済み）
- Docker Compose は未設定
- API サーバー、データベースは存在しない

制約:
- Docker Compose で全サービスを管理
- フロントエンドの Vite プロキシ経由で API にアクセス（CORS 回避）
- 単一ユーザー想定のシンプルなアプリケーション

## Goals / Non-Goals

**Goals:**
- Go + chi による HTTP サーバーの構築
- PostgreSQL への接続と基本的なクエリ実行
- Docker Compose での3サービス（frontend, backend, db）の統合
- ヘルスチェック API による疎通確認
- CLI ツールでのユーザー登録（INSERT 文生成）

**Non-Goals:**
- 認証・認可の実装（Step 2 で対応）
- メッセージ CRUD API の実装（Step 3 以降で対応）
- 本番環境向けの最適化
- テストコードの作成

## Decisions

### 1. HTTP ルーター: chi を採用

**選択**: `github.com/go-chi/chi/v5`

**理由**:
- 標準 `net/http` 互換で学習コストが低い
- ミドルウェアチェーンが直感的
- パスパラメータのパース（`/messages/{id}`）が容易

**代替案**:
- `net/http` のみ: パスパラメータ処理が煩雑
- Gin: 独自のコンテキストを持ち、標準との互換性が低い
- Echo: 機能過多

### 2. DB ドライバ: lib/pq を採用

**選択**: `github.com/lib/pq`

**理由**:
- PostgreSQL 公式推奨
- `database/sql` 標準インターフェースに準拠
- 安定した実績

**代替案**:
- pgx: 高機能だが今回の用途にはオーバースペック

### 3. パスワードハッシュ: bcrypt を採用

**選択**: `golang.org/x/crypto/bcrypt`

**理由**:
- Go 公式サブパッケージで信頼性が高い
- コスト調整可能で将来の強化に対応
- 業界標準のアルゴリズム

**代替案**:
- argon2: より新しいが、bcrypt で十分

### 4. ディレクトリ構成: フラット構造

**選択**: 最小限のディレクトリ構成

```
backend/
├── Dockerfile
├── go.mod
├── go.sum
└── main.go
```

**理由**:
- Step 1 時点ではコード量が少ない
- 機能追加に応じて分割（handler/, db/ など）

### 5. DB 初期化: init.sql による DDL 管理

**選択**: `db/init.sql` をコンテナ起動時に自動実行

**理由**:
- PostgreSQL 公式イメージの `/docker-entrypoint-initdb.d/` を活用
- マイグレーションツール不要でシンプル
- 開発初期段階では十分

**代替案**:
- golang-migrate: 本番向けには有用だが、初期段階では過剰

## Risks / Trade-offs

**[リスク] DB 接続失敗時のエラーハンドリング**
→ ヘルスチェック API で接続状態を確認可能にする。起動時の接続失敗は明確なエラーメッセージで通知。

**[リスク] 環境変数の管理**
→ Docker Compose の `environment` セクションで一元管理。`.env` ファイルは使用しない（シンプルさ優先）。

**[トレードオフ] マイグレーションツール不使用**
→ スキーマ変更時は `init.sql` を直接編集してコンテナ再作成が必要。開発段階では許容。

**[トレードオフ] ユーザー登録が CLI のみ**
→ Web UI での登録は対象外。単一ユーザー想定のため CLI で十分。
