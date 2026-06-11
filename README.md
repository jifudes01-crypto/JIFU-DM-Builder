# 共用模板系統

正式公開網址：

```text
https://jifudes01-crypto.github.io/JIFU-DM-Builder/
```

首頁整合模板製作與管理後台。所有團隊、Banner、Logo、模板、通訊錄與下載紀錄都來自 Supabase；如果資料不存在，畫面會顯示空狀態，不會自動建立示意資料。

## 技術

- Next.js App Router static export
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Konva / React Konva
- jsPDF
- qrcode
- xlsx
- Supabase Database
- Supabase Storage

## 安裝

```bash
npm install
npm run dev
```

瀏覽：

- 工作台：`http://localhost:3000/JIFU-DM-Builder`
- 後台：`http://localhost:3000/JIFU-DM-Builder/admin`

## GitHub Pages 部署

專案已設定 `.github/workflows/main.yml`，推送到 `main` 後會自動：

1. 安裝套件
2. 執行 `npm run typecheck`
3. 執行 `npm run build:pages`
4. 產生 `out/supabase-config.json`
5. 發布到 GitHub Pages

GitHub repository 的 `Settings > Secrets and variables > Actions` 需設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_ACCESS_CODE`

目前預設管理代碼為 `JIFU7513`。管理代碼是簡易門禁，不是高安全性登入；若未來需要正式權限控管，建議改回 Supabase Auth。

## Supabase

請在 Supabase SQL Editor 執行 `supabase/schema.sql`。Schema 會建立資料表、RLS policy 與 Storage bucket。

Storage bucket：

- `site-assets`：首頁 Banner、團隊 Logo。若舊環境尚未建立，程式會自動備援上傳到 `contact-assets`。
- `template-assets`：模板底圖。
- `contact-assets`：聯絡人頭像、聯絡人 QR Code、舊版團隊 Logo 備援。
- `dm-exports`：PNG / JPG / PDF 下載檔案與下載紀錄檔。

## 前台流程

1. 選擇團隊
2. 選擇後台上架且已完成區塊設定的模板
3. 填寫內容與選擇聯絡人
4. 即時預覽
5. 下載 PNG / JPG / PDF
6. 手機或 LINE 內可用專用儲存頁長按圖片保存

下載時會同步上傳檔案到 Supabase Storage，並在 `exports` 建立下載紀錄。

## 後台功能

- 首頁 Banner：上傳、更新，前台重新整理後同步。
- 團隊管理：CSV/Excel 匯入、手動新增、Logo 上傳、編輯簡易敘述、啟用/停用、刪除。
- 部門管理：手動新增、編輯、啟用/停用、刪除。
- 模板管理：多圖新增、編輯、上架/下架、複製、刪除。
- 模板區塊：人工框選可編輯區域，可拖曳、縮放、刪除，並提供同步預覽。
- 通訊錄：手動新增、編輯、啟用/停用、Excel/CSV 匯入。
- 下載紀錄：查看前台下載時間、團隊、模板、聯絡人、格式與檔案。

## GitHub Pages 限制

GitHub Pages 是靜態網站，無法執行 Next.js server actions，也不能安全使用 Supabase service role。

目前 GitHub Pages 版使用 Supabase Browser Client。前台公開讀取資料並製作下載；後台輸入管理代碼後可新增、編輯、刪除資料。正式部署時 GitHub Actions 會用 Secrets 產生公開的 `supabase-config.json`。

## 常用指令

```bash
npm run dev
npm run typecheck
npm run build:pages
```
