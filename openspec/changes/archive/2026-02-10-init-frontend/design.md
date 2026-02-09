## Context

フロントエンド開発基盤がない状態から、React アプリケーションの雛形を構築する。バックエンドは Go + PostgreSQL で構成され、Docker Compose で3コンテナ構成となる予定。

## Goals / Non-Goals

**Goals:**
- Vite + React + TypeScript のプロジェクトを `frontend/` に作成
- Docker コンテナ内で開発サーバーが動作する
- `/api/*` へのリクエストがバックエンドにプロキシされる
- Vitest でユニットテスト、Playwright で E2E テストが実行できる

**Non-Goals:**
- 本番ビルドの最適化
- CI/CD パイプラインの構築
- docker-compose.yml の作成（別 change で対応）

## Decisions

### 1. ビルドツール: Vite

**選択**: Vite
**理由**: 高速な HMR、TypeScript サポート、シンプルな設定
**代替案**: Create React App（設定の柔軟性が低い）、Next.js（SSR 不要なため過剰）

### 2. テストフレームワーク

**ユニットテスト**: Vitest
**理由**: Vite とネイティブ統合、Jest 互換 API、高速
**代替案**: Jest（Vite との統合に追加設定が必要）

**E2E テスト**: Playwright
**理由**: 複数ブラウザサポート、自動待機、優れたデバッグ体験
**代替案**: Cypress（ブラウザサポートが限定的）

### 3. ディレクトリ構成

```
frontend/
├── src/
│   ├── App.tsx           # メインコンポーネント
│   ├── main.tsx          # エントリポイント
│   └── App.test.tsx      # Vitest サンプルテスト
├── e2e/
│   └── health.spec.ts    # Playwright サンプルテスト
├── Dockerfile
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── tsconfig.json
```

### 4. Docker 開発サーバー設定

- `host: '0.0.0.0'` でコンテナ外からアクセス可能に
- `watch.usePolling: true` で Docker ボリュームマウント時のファイル変更検知を確実に

### 5. プロキシ設定

Vite の `server.proxy` で `/api` を `http://backend:8080` に転送。Cookie のドメイン不一致を回避。

## Risks / Trade-offs

**[Vite の HMR が Docker 内で動作しない可能性]**
→ Mitigation: `usePolling: true` を設定し、ポーリングでファイル変更を検知

**[Playwright が Docker 内で動作しない可能性]**
→ Mitigation: E2E テストはホスト側で実行する想定。ヘッドレスモードをデフォルトに

**[Node.js バージョン不一致]**
→ Mitigation: Dockerfile で Node.js 20 LTS を指定
