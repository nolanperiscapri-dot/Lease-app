# 🏠 Residential Lease Generator

AI-powered residential lease auto-fill app. Enter tenant/property info, let AI suggest missing fields, and download a completed California lease PDF.

## Tech Stack

- **Frontend**: React + Vite (served as static files)
- **Backend**: Express.js (API proxy for Anthropic)
- **PDF**: jsPDF (client-side generation)
- **AI**: Claude Sonnet via Anthropic API

## Local Development

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run both servers
```bash
# Terminal 1 – backend
cd server && node index.js

# Terminal 2 – frontend  
cd client && npm run dev
```

Open http://localhost:5173

---

## Deploy to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lease-app.git
git push -u origin main
```

### 2. Create Railway project
1. Go to [railway.com](https://railway.com) → **New Project**
2. Click **Deploy from GitHub repo**
3. Select your repo → **Deploy Now**

### 3. Add environment variable
1. In Railway dashboard → your service → **Variables**
2. Add: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)

### 4. Get your URL
1. Go to **Settings** → **Networking** → **Generate Domain**
2. Your app is live! 🎉

---

## Project Structure

```
lease-app/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx      # Main UI component
│   │   ├── app.css      # Styles
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/              # Express backend
│   ├── index.js         # API proxy + static file serving
│   └── package.json
├── railway.json         # Railway config
├── nixpacks.toml        # Build config
├── .env.example
└── .gitignore
```
