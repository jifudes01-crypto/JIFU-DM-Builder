# 吉富 DM 快速製作系統

這個版本改為直接部署到 GitHub Pages，正式公開網址：

```text
https://jifudes01-crypto.github.io/JIFU-DM-Builder/
```

首頁整合 `DM 製作` 與 `管理後台`，同一個網站即可進入前台與後台。

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
- Supabase schema 保留，可供後續資料同步使用

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
4. 將 `out/` 發布到 GitHub Pages

GitHub Pages 網址：

```text
https://jifudes01-crypto.github.io/JIFU-DM-Builder/
```

請先到 GitHub repository 的 `Settings > Secrets and variables > Actions` 新增：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_ACCESS_CODE`：預設管理代碼目前為 `JIFU7513`，若要改代碼可用這個 Secret 覆蓋。

GitHub Pages 不能使用 `SUPABASE_SERVICE_ROLE_KEY`。目前後台改用簡易管理代碼進入，資料同步由 Supabase Browser Client 負責。

## 管理代碼登入

1. 到 GitHub repository 的 `Settings > Secrets and variables > Actions`。
2. 新增 `NEXT_PUBLIC_ADMIN_ACCESS_CODE`，值就是後台管理代碼；目前預設為 `JIFU7513`。
3. 推送或重新執行 GitHub Actions 部署。
4. 開啟 `/admin`，輸入管理代碼即可進入後台。

管理代碼通過後會記在該裝置的瀏覽器中，按「登出」會清除。此方式操作簡單，但不是高安全性的登入；因為 `NEXT_PUBLIC_ADMIN_ACCESS_CODE` 會被打包到前端，懂技術的人仍可能看到。若未來需要正式權限控管，建議再改回 Supabase Auth。

## 前台流程

1. 選擇 `DM 製作`
2. 選擇團隊
3. 選擇模板
4. 填寫內容與選擇聯絡人
5. 即時預覽
6. 下載 PNG / JPG / PDF
7. 手機或 LINE 內可用專用儲存頁長按圖片保存

## 後台功能

- 團隊管理：CSV/Excel 匯入、手動新增、編輯簡易敘述、啟用/停用、刪除。
- 模板管理：新增、編輯、上架/下架、複製、刪除。
- 模板區塊：人工框選可編輯區域，可拖曳、縮放、刪除，並提供同步預覽。
- 通訊錄：手動新增、編輯、啟用/停用、Excel/CSV 匯入。

## GitHub Pages 限制

GitHub Pages 是靜態網站，無法執行 Next.js server actions，也不能安全使用 Supabase service role。

目前 GitHub Pages 版已改用 Supabase Browser Client。前台公開讀取資料並製作下載 DM，後台輸入管理代碼後即可新增、編輯、刪除資料。正式部署時 GitHub Actions 會用 Secrets 產生公開的 `supabase-config.json`，Supabase RLS 需套用 `supabase/schema.sql` 內的匿名寫入政策。

## 常用指令

```bash
npm run dev
npm run typecheck
npm run build:pages
```
