# 吉富 DM 快速製作系統 MVP

這個專案把原本靜態 Demo 轉成 Next.js App Router + TypeScript + Tailwind 的 MVP，包含前台 DM 製作與後台模板/通訊錄/印刷需求管理。

## 技術

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Database
- Supabase Storage
- React Hook Form
- Zod
- Konva / React Konva
- jsPDF
- qrcode
- xlsx

## 安裝

```bash
npm install
cp .env.example .env.local
npm run dev
```

瀏覽：

- 前台：`http://localhost:3000`
- 後台：`http://localhost:3000/admin`

## Supabase 設定

1. 建立 Supabase project。
2. 到 SQL Editor 執行 `supabase/schema.sql`。
3. 將 `.env.example` 複製成 `.env.local`，填入：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Storage buckets 會由 SQL 建立：
   - `template-assets`
   - `contact-assets`
   - `dm-exports`

> MVP 後台先不做登入。GitHub Pages 版本是靜態展示環境，不會執行 server actions；若要正式寫入 Supabase，請部署到支援 Next.js server runtime 的平台並加上 Supabase Auth 與 admin role。

## 前台流程

1. 選擇團隊
2. 選擇已上架且完成區塊設定的模板
3. 填寫內容與選擇聯絡人
4. 即時預覽
5. 下載 PNG / JPG / PDF
6. 選擇是否送出印刷需求

前台會用 `localStorage` 依 `teamId + templateId` 暫存填寫內容、圖片與批次資料。

## 後台功能

- 模板管理：多張上傳、新增、編輯、上架/下架、複製、刪除。
- 模板區塊：人工框選可編輯區域，可拖曳、縮放、刪除。
- 通訊錄：手動新增、編輯、啟用/停用、Excel/CSV 匯入。
- 印刷選項：維護數量、紙張、尺寸、急件、裁切。
- 印刷需求：查看預覽圖、下載 PNG/JPG/PDF、更新狀態與內部備註。

## 批次匯入格式

前台批次匯入會用 Excel/CSV 欄名對應模板區塊的 `label`。

例如模板區塊有：

- 主標題
- 價格
- 地址
- 特色說明
- 主視覺圖片

Excel 欄名就使用相同文字。圖片欄可以填 HTTPS 圖片網址；若下載時遇到瀏覽器跨來源限制，請改用手動上傳圖片。

通訊錄匯入支援欄位：

- 姓名
- 職稱
- 手機
- 電話
- Email
- LINE
- 備註

## 常用指令

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run build:pages
```

## GitHub Pages

此專案已設定 Next.js 靜態輸出，GitHub Pages 網址：

- 前台：`https://jifudes01-crypto.github.io/JIFU-DM-Builder/`
- 後台：`https://jifudes01-crypto.github.io/JIFU-DM-Builder/admin/`

GitHub Pages 是純靜態環境，後台寫入與正式送印不會連接 Supabase；畫面會保留操作流程並以本機暫存提示代替寫入。若要啟用真正資料庫寫入，請部署到支援 Next.js server runtime 的平台。

Workflow 會使用 `npm install --no-audit --no-fund --package-lock=false`，避免舊 `package-lock.json` 內的非公開 registry URL 讓 GitHub Actions 安裝失敗。

## 目前限制

- MVP 不做登入權限。
- 模板底圖支援 JPG / PNG / WebP，不做 PDF 模板頁面轉圖。
- 前台只允許填資料與上傳圖片，不允許移動版面。
- 如果沒有設定 Supabase 環境變數，前台會用內建 demo 資料預覽；後台寫入與送印會提示尚未連接 Supabase。
