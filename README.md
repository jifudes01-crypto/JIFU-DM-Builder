# 吉富 DM 快速製作系統正式版

這是正式公開使用版，採用 Next.js App Router + TypeScript + Tailwind + Supabase，部署建議使用 Vercel。首頁整合 `DM 製作` 與 `管理後台`，不同電腦、手機、瀏覽器都能透過 Supabase 同步資料。

## 技術

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Database / Storage
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

- 工作台：`http://localhost:3000`
- 後台相容入口：`http://localhost:3000/admin`

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

正式版需要 Next.js server actions，請部署到 Vercel 或其它支援 Next.js server runtime 的平台。GitHub Pages 只能作為舊版靜態展示，不適合正式送印同步。

## 前台流程

1. 在首頁工作台選擇 `DM 製作`
2. 選擇團隊
3. 選擇已上架且完成區塊設定的模板
4. 填寫內容與選擇聯絡人
5. 即時預覽
6. 下載 PNG / JPG / PDF，或用專用儲存頁長按圖片保存
7. 批量填寫印刷需求並送出

前台會用 `localStorage` 依 `teamId + templateId` 暫存填寫內容、圖片與批次資料；正式印刷需求會寫入 Supabase。

## 後台功能

- 團隊管理：CSV/Excel 匯入、手動新增、編輯簡易敘述、啟用/停用、刪除。
- 模板管理：多張上傳、新增、編輯、上架/下架、複製、刪除。
- 模板區塊：人工框選可編輯區域，可拖曳、縮放、刪除，並提供後台同步預覽。
- 通訊錄：手動新增、編輯、啟用/停用、Excel/CSV 匯入。
- 印刷選項：維護類別、材質尺寸、數量、廠商。
- 印刷需求：查看申請時間、批量明細、總件數、預覽圖、下載檔、更新狀態、匯出 CSV。

## 匯入格式

團隊匯入欄位：

- 團隊名稱
- 簡易敘述
- 排序
- 啟用

通訊錄匯入欄位：

- 姓名
- 職稱
- 手機
- 電話
- Email
- LINE
- 備註

前台批次匯入會用 Excel/CSV 欄名對應模板區塊的 `label`，例如：主標題、價格、地址、特色說明、主視覺圖片。

## 常用指令

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run build:pages
```

`npm run build:pages` 保留為相容指令，目前等同正式 build。正式版不再輸出 GitHub Pages 靜態 `out`。

## Vercel 部署

1. 將 GitHub repo 匯入 Vercel。
2. Framework preset 選 `Next.js`。
3. Build command 使用 `npm run build`。
4. 在 Vercel 設定環境變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 部署完成後，所有前台送印與後台管理資料會同步到 Supabase。

GitHub Actions 目前只做 `typecheck` 與 `build` 驗證，不再部署 GitHub Pages。

## 目前限制

- 正式上線前建議補 Supabase Auth 與管理者權限。
- 模板底圖支援 JPG / PNG / WebP，不做 PDF 模板頁面轉圖。
- 前台只允許填資料與上傳圖片，不允許移動版面。
- 如果沒有設定 Supabase 環境變數，系統不會建立預設團隊；請先到 Supabase 匯入或新增團隊。
