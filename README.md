# 吉富 DM 快速製作系統

這是一個 Next.js + Supabase 的 DM 快速製作網站，包含前台製作與後台管理。

## 網站路徑

- 前台：`/`
- 後台：`/admin`

## 主要功能

### 前台

- 選擇團隊
- 選擇已上架模板
- 依後台區塊設定自動產生表單
- 填寫文字、上傳圖片、選擇聯絡人
- 即時預覽 DM
- 下載 PNG / JPG / PDF
- 送出印刷需求與留言

### 後台

- 多張模板上傳
- 模板上下架
- B 做法：人工框選可編輯區域
- 通訊錄手動新增與 Excel / CSV 匯入
- 印刷選項設定
- 印刷需求紀錄管理

## 本機安裝

```bash
npm install
cp .env.example .env.local
npm run dev
```

開啟：

```text
http://localhost:3000
http://localhost:3000/admin
```

## Supabase 設定

1. 建立 Supabase project。
2. 到 SQL Editor 執行 `supabase/schema.sql`。
3. 將 `.env.example` 複製成 `.env.local`，填入：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
```

Storage buckets 會由 SQL 建立：

- `template-assets`
- `contact-assets`
- `dm-exports`

## Vercel 部署

在 Vercel 專案的 Environment Variables 設定：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
```

Build Command：

```bash
npm run build
```

Install Command：

```bash
npm install
```

## 常用指令

```bash
npm run dev
npm run typecheck
npm run build
```

## 注意事項

- MVP 版本後台尚未加入登入權限，正式上線前建議加入 Supabase Auth 與 admin role。
- 前台只允許填資料與上傳圖片，不允許移動版面。
- 若未設定 Supabase 環境變數，前台會使用內建 demo 資料；後台寫入與送印會提示尚未連接 Supabase。
