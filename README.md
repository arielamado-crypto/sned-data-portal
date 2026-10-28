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

## Updating the data — easy way (Data Editor)
1. Open `https://YOUR-USERNAME.github.io/sned-iloilo/admin.html` (or the "Data editor" link at the very bottom of the site).
2. Fill in the forms. You can copy cells from Excel and paste them into any table.
3. Click **Preview site** to check, then **Download data.js**.
4. On GitHub: `assets` → `js` → **Add file** → **Upload files** → drag in data.js → **Commit changes**.

Your work is kept in the browser as a draft until you download, so you can close the page and continue later on the same computer.
The editor cannot change the live site by itself, so it is safe to leave public: nothing changes until someone uploads a new data.js to your GitHub account.

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
