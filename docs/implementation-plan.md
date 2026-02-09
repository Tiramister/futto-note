# 実装ロードマップ

## Step 1: 環境構築

### 1-1. プロジェクト構成

```
project-root/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── go.mod
│   └── main.go
├── db/
│   └── init.sql          # DDL（テーブル定義）
└── tools/
    └── create_user.go    # ユーザー登録スクリプト
```

### 1-2. Docker Compose

3つのコンテナを定義する。

| サービス | イメージ/ビルド | ポート | 備考 |
|---------|---------------|-------|------|
| `db` | `postgres:16` | 5432 | `init.sql` をマウントして初期化 |
| `backend` | `./backend` | 8080 | DB への接続情報を環境変数で注入 |
| `frontend` | `./frontend` | 3000 | Vite dev server。API リクエストは backend へプロキシ |

**ネットワーク**: 3コンテナを同一 Docker ネットワークに配置し、`backend` → `db` はサービス名で名前解決する。

**フロントエンドのプロキシ**: 開発時は Vite の `server.proxy` で `/api/*` を `http://backend:8080` に転送する。これにより Cookie のドメイン不一致を回避する。

### 1-3. データベース初期化 (`db/init.sql`)

仕様書のデータ設計に基づき、以下の3テーブルを作成する。

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 1-4. Go バックエンドの雛形

最小構成で HTTP サーバーを起動し、DB 接続を確認できる状態にする。

- `go mod init` でモジュール初期化
- `net/http` または軽量ルーター（`chi` 等）でサーバー起動
- `database/sql` + `lib/pq` で PostgreSQL 接続
- ヘルスチェック用エンドポイント `GET /api/health` → DB に `SELECT 1` して 200 を返す

### 1-5. React フロントエンドの雛形

- Vite + React + TypeScript でプロジェクト作成
- Vite のプロキシ設定 (`/api` → `backend:8080`)
- 画面は空ページでOK。`/api/health` を fetch して接続確認

### 1-6. ユーザー登録スクリプト (`tools/create_user.go`)

CLIツールとして実装する。

```
go run tools/create_user.go -username <name> -password <pass>
```

- `bcrypt` でパスワードをハッシュ化
- `INSERT INTO users (username, password_hash) VALUES (...)` の SQL を標準出力に出力
- 出力された SQL を `psql` や DB クライアントで実行してユーザーを作成する

### 1-7. 完了条件

- `docker compose up` で3コンテナが起動する
- フロントエンドからバックエンドの `/api/health` を呼び出して 200 が返る
- `create_user.go` でユーザー INSERT 文を生成し、DB に登録できる

---

## Step 2: ログイン・ログアウト機構

### 2-1. バックエンド

**`POST /api/login`**

1. リクエストボディから `username`, `password` を取得
2. `users` テーブルから `username` で検索
3. `bcrypt.CompareHashAndPassword` でパスワード照合
4. 一致したら `crypto/rand` で 32 バイトのランダムトークン（hex）を生成
5. `sessions` テーブルに INSERT（`expires_at` = 現在 + 30日）
6. レスポンスの `Set-Cookie` でトークンを返却
   - `HttpOnly`, `Secure`（開発時は外す）, `SameSite=Strict`, `Path=/`, `Max-Age=30日`
7. ボディには `{ "user": { "id": "...", "username": "..." } }` を返す

**`POST /api/logout`**

1. Cookie からトークンを取得
2. `sessions` テーブルから DELETE
3. `Set-Cookie` で Cookie を無効化（`Max-Age=0`）
4. 204 No Content を返す

**`GET /api/me`**

1. Cookie からトークンを取得
2. `sessions` テーブルで有効期限内か確認
3. 有効ならユーザー情報を返す（200）、無効なら 401

**認証ミドルウェア**

- 以降のメッセージ系 API に適用する共通処理
- Cookie からトークンを取得 → sessions を検索 → 有効期限チェック
- 有効ならリクエストコンテキストに `user_id` を埋め込み、無効なら 401

### 2-2. フロントエンド

**ログイン画面**

- ユーザー名 + パスワードの入力フォーム
- `POST /api/login` を呼び出し、成功したらメイン画面へ遷移
- 失敗時はエラーメッセージを表示

**認証状態管理**

- アプリ起動時に `GET /api/me` を呼び出して認証状態を確認
- 未認証ならログイン画面を表示、認証済みならメイン画面を表示
- ログアウトボタンを設置（`POST /api/logout` → ログイン画面へ）

### 2-3. 完了条件

- `create_user.go` で作成したユーザーでログインできる
- ログイン後にページをリロードしてもセッションが維持される
- ログアウト後に認証が必要な API にアクセスすると 401 が返る

---

## Step 3: ノートの一覧取得・表示

### 3-1. バックエンド

**`GET /api/messages`**

1. 認証ミドルウェア通過後、`user_id` を取得
2. `SELECT id, body, created_at FROM messages WHERE user_id = $1 ORDER BY created_at ASC`
3. JSON 配列で返却

```json
{
  "messages": [
    { "id": 1, "body": "最初のメモ", "created_at": "2025-01-15T10:30:00Z" },
    { "id": 2, "body": "次のメモ", "created_at": "2025-01-15T14:00:00Z" }
  ]
}
```

### 3-2. フロントエンド

**メイン画面のレイアウト**

- Slack 風のタイムライン表示（新しいメッセージが下）
- 画面はメッセージリスト領域 + 下部の入力エリアで構成
- メッセージリスト領域は上方向にスクロール可能
- 初回表示時に最下部にスクロール

**メッセージの表示**

- 各メッセージに本文と投稿時刻を表示
- URL を検出して自動リンク化（正規表現 or ライブラリ）
- レスポンシブ対応（スマホ/PC で見やすいレイアウト）

### 3-3. 完了条件

- DB にテストデータを入れた状態でメッセージ一覧が表示される
- URL を含むメッセージがクリック可能なリンクとして表示される
- スマホ幅・PC幅の両方で見やすいレイアウトになっている

---

## Step 4: 日付の境界線表示

### 4-1. フロントエンド

- メッセージ一覧を描画する際に、前後のメッセージの `created_at` を比較
- 日付（年月日）が変わる箇所にセパレーターを挿入
- セパレーター例: `──── 2025年1月16日 ────` のような横線+日付表示

### 4-2. 完了条件

- 異なる日付のメッセージの間にセパレーターが表示される
- 同じ日付のメッセージの間にはセパレーターが表示されない

---

## Step 5: ノートの追加

### 5-1. バックエンド

**`POST /api/messages`**

1. リクエストボディから `body` を取得（空文字は 400 で拒否）
2. `INSERT INTO messages (user_id, body) VALUES ($1, $2) RETURNING id, body, created_at`
3. 作成されたメッセージを JSON で返却（201 Created）

### 5-2. フロントエンド

**入力エリア**

- 画面下部に固定配置のテキスト入力欄 + 送信ボタン
- Enter で送信（Shift+Enter で改行）
- 送信後は入力欄をクリア
- 送信成功したらメッセージ一覧に追加し、最下部にスクロール

### 5-3. 完了条件

- テキストを入力して送信するとメッセージが保存・表示される
- 空テキストでは送信できない
- 送信後に入力欄がクリアされ、リストが最下部にスクロールする

---

## Step 6: ノートの編集

### 6-1. バックエンド

**`PUT /api/messages/:id`**

1. パスパラメータから `id` を取得
2. リクエストボディから `body` を取得（空文字は 400 で拒否）
3. `UPDATE messages SET body = $1 WHERE id = $2 AND user_id = $3`
4. 更新件数が 0 なら 404
5. 更新後のメッセージを返却

### 6-2. フロントエンド

**編集 UI**

- メッセージのメニュー（例: 「…」ボタンやホバー時のアイコン）から「編集」を選択
- 対象メッセージの本文がインライン編集モードに切り替わる（テキストエリアに変化）
- 「保存」で `PUT /api/messages/:id` を呼び出し、「キャンセル」で元に戻す

### 6-3. 完了条件

- メッセージの編集が保存され、画面上に反映される
- 他ユーザーのメッセージは編集できない（自分のメッセージのみ。今回は単一ユーザー想定なので実質全メッセージ）

---

## Step 7: ノートの削除

### 7-1. バックエンド

**`DELETE /api/messages/:id`**

1. パスパラメータから `id` を取得
2. `DELETE FROM messages WHERE id = $1 AND user_id = $2`
3. 削除件数が 0 なら 404
4. 204 No Content を返す

### 7-2. フロントエンド

**削除フロー**

- メッセージのメニューから「削除」を選択
- 確認ダイアログ（「このメッセージを削除しますか？」）を表示
- 「OK」で `DELETE /api/messages/:id` を呼び出し、一覧から除去
- 「キャンセル」で何もしない

### 7-3. 完了条件

- 削除時に確認ダイアログが表示される
- 確認後にメッセージが削除され、一覧から消える
- キャンセルした場合はメッセージが残る

---

## Step 8: クリップボードコピー

### 8-1. フロントエンド

- メッセージのメニューから「コピー」を選択
- `navigator.clipboard.writeText(body)` でクリップボードにコピー
- コピー完了時にトースト通知やアイコン変化でフィードバックを表示

### 8-2. 完了条件

- メッセージの本文がクリップボードにコピーされる
- コピー完了のフィードバックが表示される
