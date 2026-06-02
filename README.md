# JIFU-DM-Builder 吉富 DM 快速製作系統

這是給 GitHub Pages 發布使用的版本。

## 網站網址

發布完成後網址會是：

```text
https://jifudes01-crypto.github.io/JIFU-DM-Builder/
```

後台：

```text
https://jifudes01-crypto.github.io/JIFU-DM-Builder/admin/
```

## GitHub Pages 設定

1. 到 GitHub repo：`JIFU-DM-Builder`
2. 進入 `Settings`
3. 左側點 `Pages`
4. `Build and deployment` 的 `Source` 選 `GitHub Actions`
5. 回到 `Actions` 等待部署完成

## Supabase 設定

到 Supabase 的 SQL Editor 執行：

```text
supabase/schema.sql
```

## GitHub Secrets 設定

到 GitHub repo：

```text
Settings → Secrets and variables → Actions → New repository secret
```

新增以下三個：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
```

> 注意：GitHub Pages 是靜態網站，正式公司使用前仍建議補登入權限與 RLS。

