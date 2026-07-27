# Go_repario — Website

A single-page React (Vite) site for Go_repario's plumbing and electrical repair
service in Etawah and Banda. No backend, no database — every "Book" action
opens WhatsApp directly.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

This outputs static files to `dist/` — plain HTML/CSS/JS, deployable anywhere.

## Change the WhatsApp number or messages

Everything lives in one file: `src/waConfig.js`. Edit the `PHONE` constant
and the message strings there — nothing else in the codebase needs to change.

## Deploying under a `.in` domain

### Option A — Vercel (recommended, easiest)

1. Push this project to a GitHub repo.
2. Go to vercel.com → New Project → import the repo. Vercel auto-detects
   Vite; no config needed.
3. Deploy. You'll get a `*.vercel.app` URL first.
4. Go to Project → Settings → Domains → add your `.in` domain
   (e.g. `go_repario.in`).
5. Vercel will show you a DNS record to add at your domain registrar
   (wherever you bought the `.in` domain — GoDaddy, BigRock, Namecheap, etc.):
   - Usually an **A record** pointing `@` to `76.76.21.21`, and
   - A **CNAME record** pointing `www` to `cname.vercel-dns.com`
   (Vercel shows the exact current values on the Domains page — use those.)
6. Wait for DNS to propagate (can take a few minutes to a few hours).

### Option B — GitHub Pages

1. Push this project to a GitHub repo.
2. Add a `homepage` field to `package.json` if needed, and use a tool like
   `gh-pages` to publish the `dist/` folder to a `gh-pages` branch — or use
   a GitHub Action that runs `npm run build` and deploys `dist/`.
3. In repo Settings → Pages, set the source to the `gh-pages` branch.
4. Add a `CNAME` file inside `public/` containing just your domain, e.g.:
   ```
   go_repario.in
   ```
   (Vite copies everything in `public/` into `dist/` on build, so this
   travels automatically.)
5. At your domain registrar, add:
   - An **A record** for `@` pointing to GitHub Pages' IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A **CNAME record** for `www` pointing to `<your-github-username>.github.io`
6. Back in repo Settings → Pages, enter your custom domain and enable
   "Enforce HTTPS" once DNS has propagated.

## Notes

- Service area and business name are intentionally consistent everywhere
  (site copy, meta tags, footer) — keep it that way across your Google
  Business Profile, WhatsApp Business name, and any signage so search
  engines and customers see one consistent brand.
- Consider adding 2–3 real photos of a technician or completed job to the
  Services or Why Us section once you have them — this will build more
  trust than any additional design work.
