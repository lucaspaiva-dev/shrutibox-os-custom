# Vercel Deploy

This document covers everything related to hosting Shrutibox Digital on Vercel: first-time setup, how continuous delivery works, and how to manage deployments going forward.

## Why Vercel

Shrutibox Digital is a 100% static frontend app (React + Vite). There is no backend, no database, and no server-side logic. Vercel is optimized exactly for this: it builds the project, serves the resulting static files through a global CDN, and redeploys automatically on every push to `main`.

- Free tier is more than enough for a beta or small production app
- Zero server configuration required
- Automatic SSL (HTTPS) included
- Each deployment gets a unique preview URL
- Build logs are visible in real time

---

## First-Time Setup

### 1. Create a Vercel account

Go to [vercel.com](https://vercel.com) and click **Sign Up → Continue with GitHub**.

Vercel will ask to authorize access to your GitHub account. If you see the message *"Social Account is not yet connected to any Vercel user. Sign up?"*, that is expected — just confirm to create a new account linked to your GitHub identity.

### 2. Import the repository

1. In the Vercel dashboard, click **Add New… → Project**
2. Find `drishtilabz/shrutibox-os-custom` in the repository list
3. If it doesn't appear, click **Adjust GitHub App Permissions** and grant access to the repository or the `drishtilabz` organization
4. Click **Import**

### 3. Configure the project

Vercel detects Vite automatically. Confirm the following values (they should already be pre-filled):

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `vite build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

No changes needed. Click **Deploy**.

### 4. First deployment

The build process takes approximately 30–60 seconds. You can follow the live log in the dashboard. When it finishes, Vercel provides the live URL, typically:

```
https://shrutibox-os-custom.vercel.app
```

That URL is ready to share immediately.

---

## How Continuous Delivery Works

Once the project is connected, Vercel listens to the GitHub repository. Every push triggers an automatic deployment with no manual steps required.

```
Local change
    ↓
git add + git commit
    ↓
git push origin main
    ↓
Vercel detects the push (via GitHub webhook)
    ↓
Vercel runs: npm install → vite build
    ↓
New version goes live at the same URL (~30–60 seconds)
```

This means the live URL always reflects the latest state of the `main` branch. There is no FTP, no manual upload, and no separate deploy command to run.

### Branch previews

Every push to any branch other than `main` also generates a **unique preview URL** (e.g. `shrutibox-os-custom-git-feature-xyz.vercel.app`). This is useful for testing changes before merging to `main`.

---

## Day-to-Day Workflow

```bash
# Make changes to the code
# Then:
git add .
git commit -m "your commit message"
git push origin main
```

That's all. Vercel handles the rest. Check the dashboard to confirm the deployment completed successfully.

---

## SEO / Indexing Configuration

The app is configured to prevent indexing by search engines, suitable for a beta or private release.

**`index.html`** — meta tag that instructs browsers and crawlers not to index the page:

```html
<meta name="robots" content="noindex, nofollow">
```

**`public/robots.txt`** — instructs all crawlers not to access any route:

```
User-agent: *
Disallow: /
```

To enable indexing in the future (public production release), remove both of these and redeploy.

---

## Managing the Domain

### Default subdomain

By default Vercel assigns a free subdomain under `vercel.app`. You can customize it:

1. Go to the project in the Vercel dashboard
2. **Settings → Domains**
3. Edit the subdomain (e.g. change `shrutibox-os-custom` to `shrutibox`)

### Custom domain

If you own a domain, you can connect it in **Settings → Domains → Add**. Vercel provides the DNS records to configure in your registrar. SSL is provisioned automatically.

---

## Useful Limits (Free Tier)

| Resource | Limit |
|---|---|
| Bandwidth | 100 GB / month |
| Deployments | Unlimited |
| Static file size per deployment | 100 MB |
| Build time | 45 minutes max per build |
| Team members | 1 (personal account) |

The current project size (~16 MB of audio + app code) is well within all limits.

---

## Troubleshooting

**Build fails with "command not found: vite"**
Make sure `vite` is listed under `devDependencies` in `package.json` (it is). This usually means the install step failed — check the build log for npm errors.

**Audio files are not loading (404)**
The `public/sounds-mks/`, `public/sounds/`, and `public/sounds-mks-xfade/` folders must be committed to the repository. They were previously excluded from git but have since been added. If audio is missing after a fresh clone or deploy, verify those folders are present in the GitHub repository.

**The deployment completed but the old version is still showing**
Try a hard refresh in the browser (`Cmd + Shift + R` on Mac). Vercel may also have CDN propagation delays of a few seconds after a new deploy.

**I want to roll back to a previous version**
In the Vercel dashboard, go to **Deployments**, find the previous successful deployment, click the three-dot menu, and select **Promote to Production**. No code changes needed.
