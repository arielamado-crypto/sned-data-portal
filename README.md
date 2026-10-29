# SNEd Data Portal — Schools Division of Iloilo

Static website for Special Needs Education (SNEd) / Inclusive Education data. No database or server needed; it runs on GitHub Pages.

## Folder contents
```
index.html              the page
assets/css/style.css    design
assets/js/data.js       ALL the data (edit this file only)
assets/js/app.js        charts, tables, search, CSV export
assets/js/chart.umd.min.js  Chart.js (bundled, works offline)
assets/img/             logos
files/                  put downloadable PDFs / Excel here
.nojekyll               tells GitHub Pages to serve files as-is
```

## Publish on GitHub Pages
1. Sign in at github.com → **New repository** → name it e.g. `sned-iloilo` → Public → Create.
2. Click **uploading an existing file**, drag in everything inside this folder (including the `assets` and `files` folders and `.nojekyll`) → **Commit changes**.
3. Go to **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
4. After about a minute the site is live at `https://YOUR-USERNAME.github.io/sned-iloilo/`.

## Updating the data — Data Editor
1. Open `admin.html` on your site (or the "Data editor" link at the very bottom of the site).
2. Fill in the forms. You can copy cells from Excel and paste them into any table.
3. Click **Preview site** to check.
4. Click **Publish to GitHub**. The live site updates in about a minute.

### One-time setup: GitHub token
1. On github.com: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Repository access: **Only select repositories** → choose this site's repository.
3. Permissions → Repository permissions → **Contents: Read and write**. Choose an expiration (e.g. 90 days).
4. Generate and copy the token. In the Data Editor click **GitHub settings**, paste it, click **Test connection**, then **Save**.

Keep the token private, like a password. It is stored only in your own browser, never in the website files.
Leave "Remember the token on this computer" unticked on shared computers; the token is then forgotten when you close the tab.
If the token expires, create a new one and paste it again. **Forget token** removes it from the computer.

No token? Click **Download data.js**, then on GitHub open `assets` → `js` → **Add file** → **Upload files** → drag in data.js → **Commit changes**.

Without a token, nobody can change the live site from the editor, so it is safe for `admin.html` to be public.

## Updating the data — manual way
Open `assets/js/data.js` (on GitHub, click the file then the pencil icon), change the numbers, and commit.
- Set `isSampleData: false` once real figures are in — this hides the yellow "Sample data" notice.
- Add a school: copy one line in `schools`, paste it below, edit it. Keep the comma at the end of each line.
- Add a download: upload the file to `files/`, then set its `url` to `files/your-file.pdf`.

## Features
- Headline stat cards, 4 charts, data tables with totals and percentage share
- Searchable / filterable SNEd Center directory
- CSV download of every table, printable data report
- Accessibility: text resize, high-contrast mode, dark mode, skip link, keyboard focus, reduced-motion support
- Mobile-friendly

Developer: Ariel L. Amado, Master Teacher I
