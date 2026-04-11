# Testing Borderline on Your Phone

This is a pure static site (no backend), so there are several ways to get it onto your phone. Easiest to hardest:

---

## Option 1 — Vercel (Recommended)

Free, takes ~2 minutes, gives you a permanent public URL that works anywhere.

### First-time setup

```bash
npm install -g vercel
```

Log in (creates a free account or links your GitHub):

```bash
vercel login
```

### Deploy

From the project root:

```bash
npm run build   # make sure it builds cleanly first
vercel          # follow the prompts
```

Vercel will ask a few questions — accept all defaults:
- Set up and deploy? **Y**
- Which scope? (your account)
- Link to existing project? **N**
- Project name? **borderline** (or anything)
- Directory? **./**
- Override build settings? **N**

It detects Vite automatically. Your production URL:

```
https://borderline-dipfjykgi-ram-ns-projects.vercel.app
```

Open that on your phone. Done.

### Subsequent deploys

```bash
vercel --prod
```

Or just push to GitHub — if you connect the repo in the Vercel dashboard it auto-deploys on every push to `main`.

---

## Option 2 — ngrok (Quick, No Account for Basic Use)

Good for a quick test without deploying. Requires both devices on internet, but not the same network.

```bash
# Terminal 1 — start the dev server
npm run dev

# Terminal 2 — expose it
npx ngrok http 5173
```

ngrok prints a public URL like `https://abc123.ngrok.io`. Open that on your phone.

**Note:** The free ngrok URL changes every session and shows a warning page first. Fine for testing.

---

## Option 3 — Local WiFi (Same Network Only)

Works without any accounts or internet, but your phone and computer must be on the same WiFi.

### The WSL2 complication

WSL2 has its own internal IP that Windows doesn't automatically expose. You need to:

**Step 1** — Find the WSL2 IP:
```bash
hostname -I   # e.g. 172.28.144.5
```

**Step 2** — Find your Windows machine's local IP (run in PowerShell on Windows):
```powershell
ipconfig | findstr "IPv4"   # e.g. 192.168.1.42
```

**Step 3** — Forward the port from Windows to WSL2 (run in PowerShell **as Administrator**):
```powershell
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.28.144.5
```
Replace `172.28.144.5` with your actual WSL2 IP from Step 1.

**Step 4** — Allow the port through Windows Firewall (PowerShell as Administrator):
```powershell
New-NetFirewallRule -DisplayName "Vite Dev" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

**Step 5** — Start Vite with host binding:
```bash
npm run dev -- --host
```

**Step 6** — On your phone, open:
```
http://192.168.1.42:5173
```
(your Windows IP from Step 2)

### Cleanup (optional)

Remove the port proxy when done:
```powershell
netsh interface portproxy delete v4tov4 listenport=5173 listenaddress=0.0.0.0
```

---

## Recommendation

**Just use Vercel.** It's free, the site is static so it's instant, and you get a permanent URL you can bookmark on your phone. The ngrok option is useful if you want to test a change quickly before deploying.
