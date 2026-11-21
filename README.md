# Andrew Ung Wei En — Portfolio

A static, single-page portfolio plus data-driven case studies and a built-in content editor that publishes to GitHub. The site is light by default with a light/dark toggle in the header, and uses large, high-contrast Inter typography for readability.

## Run it locally

Double-click **`start.bat`**, or run:

```powershell
python -m http.server 8000
```

Then open:

- Site: <http://localhost:8000>
- Admin editor: <http://localhost:8000/admin.html>

The site loads its content from `data/portfolio.json`, so it must be served over HTTP. Opening `index.html` directly from disk will show a "content unavailable" message.

## Editing content

1. Open `admin.html`.
2. Enter the admin password from `js/admin-config.js` (default: `portfolio2026`).
3. Either connect a GitHub token to publish, or choose **Edit locally without publishing**.
4. Edit the sections in the left sidebar. Changes autosave to a draft in your browser.
5. Use **Preview** to see the real site update in a split panel.
6. Press **Publish** to commit `data/portfolio.json` to GitHub.

Every publish creates a GitHub commit, so older versions can always be restored. Use **Backup** to download the current JSON before large edits.

### Uploading images

Use the **Upload file** button next to any image field. When signed in with a token, the image is committed to `assets/uploads/`. In local mode the image is embedded in the draft as a data URL so you can preview it, but it is not a good long-term replacement for a real file - use GitHub mode for final images. Uploading an image also switches that project's cover type to **Image** automatically.

Images must be under 8 MB. PNG, JPG, WebP, GIF and SVG all work. Uploading a file is more reliable than pasting an external image URL, because some sites block their images from being shown on other domains.

Use **Image fit** to control how a cover fills its card:
- **Contain** shows the whole image on a soft blurred backdrop — best for logos, diagrams and screenshots.
- **Cover** fills the card edge to edge — best for photos.

### Admin security

The password in `js/admin-config.js` is a convenience lock, not real security — anyone can read it in the source. The real protection is the fine-grained GitHub token (Contents: Read and write for this repository only). The token is stored only in your browser and can be revoked on GitHub at any time.

`admin.html` is marked `noindex` and is disallowed in `robots.txt`, but it is still publicly reachable. Never put private information in the content file.

## GitHub Pages setup

1. Push these files to the root of `andrewung2009/portfolio`.
2. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`, then save.
4. Visit <https://andrewung2009.github.io/portfolio/> after the first deployment finishes.

The repository is already configured in `js/admin-config.js`:

```js
window.ADMIN_CONFIG = {
  password: "portfolio2026",
  repo: "andrewung2009/portfolio",
  branch: "main",
  contentPath: "data/portfolio.json",
  uploadPath: "assets/uploads",
  siteUrl: "https://andrewung2009.github.io/portfolio/"
};
```

### Creating the GitHub token

1. Open <https://github.com/settings/personal-access-tokens/new>.
2. Name it **Portfolio Admin** and set an expiry.
3. Repository access: **Only select repositories → portfolio**.
4. Permissions → Repository permissions → **Contents: Read and write**.
5. Generate and copy the token, then paste it into the admin login.

## Project structure

```
index.html            Homepage shell
project.html          Case-study shell (?id=<slug>)
admin.html            Content editor
data/portfolio.json   All site content
css/style.css         Public site styles
css/admin.css         Editor styles
js/ui.js              Shared icons, escaping, cover art
js/app.js             Homepage renderer
js/project.js         Case-study renderer
js/admin.js           Editor logic + GitHub publishing
js/admin-config.js    Repo, branch, password, site URL
assets/images/        Your source images
assets/uploads/       Images uploaded through the admin
start.bat             Local preview
```

## What to update before publishing

- **Email** — the current value is a placeholder (`hello@andrewung.dev`). Change it in the admin under **Site & hero**.
- **Portrait** — add a 3:4 photo, or keep the designed monogram.
- **Project covers** — the site currently uses designed category covers. Upload screenshots in the admin when ready.
- **Social links** — only GitHub is included so far. Add LinkedIn, Instagram or others under **Contact**.
- **Resume** — add a PDF link under **Site & hero** if you want a CV button.

## Notes

- `taskaiagent.html` redirects to `project.html?id=ai-logistics-agent` so old links keep working.
- The Planning Center deck files and drafts are left untouched and are not part of the website.
- The site uses Inter and JetBrains Mono from Google Fonts. All other assets are local.
- The light/dark toggle saves the choice in `localStorage` and applies to both the site and the admin.
