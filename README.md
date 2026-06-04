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

GitHub Pages 不能使用 `SUPABASE_SERVICE_ROLE_KEY`，後台管理改由 Google 登入 + Supabase RLS 控制。

## Google 管理員登入

1. 到 Supabase Dashboard 啟用 `Authentication > Providers > Google`。
2. Site URL 設為 `https://jifudes01-crypto.github.io`。
3. Redirect URL 加入 `https://jifudes01-crypto.github.io/JIFU-DM-Builder/admin/`。
4. 使用 Google 登入後，到 Supabase `auth.users` 找到該帳號。
5. 將該帳號加入 `admin_users`：

```sql
insert into admin_users (user_id, email, is_active)
values ('auth.users 的 id', '你的 Google Email', true);
```

只有 `admin_users.is_active = true` 的帳號可以操作後台。

## 前台流程

1. 選擇 `DM 製作`
2. 選擇團隊
3. 選擇模板
4. 填寫內容與選擇聯絡人
5. 即時預覽
6. 下載 PNG / JPG / PDF
7. 手機或 LINE 內可用專用儲存頁長按圖片保存
8. 可暫存印刷需求

## 後台功能

- 團隊管理：CSV/Excel 匯入、手動新增、編輯簡易敘述、啟用/停用、刪除。
- 模板管理：新增、編輯、上架/下架、複製、刪除。
- 模板區塊：人工框選可編輯區域，可拖曳、縮放、刪除，並提供同步預覽。
- 通訊錄：手動新增、編輯、啟用/停用、Excel/CSV 匯入。
- 印刷選項：維護類別、材質尺寸、數量、廠商。
- 印刷需求：查看批量明細、總件數、預覽圖、下載檔、匯出 CSV。

## GitHub Pages 限制

GitHub Pages 是靜態網站，無法執行 Next.js server actions，也不能安全使用 Supabase service role。

目前 GitHub Pages 版已改用 Supabase Browser Client。前台公開讀取資料與送出印刷需求，後台需 Google 管理員登入後才能新增、編輯、刪除資料。

## 常用指令

```bash
npm run dev
npm run typecheck
npm run build:pages
```
