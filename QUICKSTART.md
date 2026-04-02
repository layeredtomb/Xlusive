# 🚀 Quick Start Guide

Get the Phone Number Leak Checker running in 3 steps:

## Step 1: Install Dependencies

Open your terminal and run:

```bash
npm run install-deps
```

This will install all required packages for the server and client.

## Step 2: Start the Application

```bash
npm run dev
```

This will start both the backend and frontend:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

## Step 3: Open in Browser

- Open your browser and go to **http://localhost:3000**
- You should see the Phone Number Leak Checker interface

## ✅ You're Ready!

- Enter a phone number to check if it's been compromised
- View your check history
- Request removal from leaked databases

---

## 📋 Project Hierarchy

```
phonenumberchecker/
├── server/           # Backend API
├── client/           # React UI
├── package.json      # Root config
└── README.md         # Full documentation
```

## 🔧 Individual Commands

**Start only the backend:**
```bash
npm run server
```

**Start only the frontend:**
```bash
cd client && npm run dev
```

**Build for production:**
```bash
npm run build
```

---

## ⚠️ Troubleshooting

### Port 3000 or 5000 already in use?

Edit the config files:
- Server: `server/index.js` - change `PORT` variable
- Client: `client/vite.config.js` - change `port` value

### Stuck? 

1. Make sure Node.js 16+ is installed: `node --version`
2. Delete `node_modules` folders and reinstall: `npm run install-deps`
3. Check the main README.md for detailed docs

## 🎉 Done!

You now have a complete phone number data leak checker running locally!
