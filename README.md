# 🎵 EchoBytes

A mobile-friendly, zero-cost, local-first music player with theming — built with React and hosted on GitHub Pages.

## About

EchoBytes is a personal music player that lets you listen to your own audio files directly in the browser — no subscriptions, no servers, and no cost. Simply upload your downloaded MP3s and enjoy your playlist with a beautiful, customizable interface.

## Features

- 📁 **Upload local audio files** — load your own MP3s and other audio files directly from your device; no backend or cloud storage required
- 🎨 **Custom themes** — switch between Dark, Light, and Synthwave themes with your preference saved automatically
- 📱 **Responsive UI** — mobile-friendly layout that works great on phones, tablets, and desktops
- 💾 **Persistent storage** — your uploaded songs and theme choice are remembered across sessions using the browser's local storage

## Running Locally

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the app.

## Deploying to GitHub Pages

Deployment is automated via a GitHub Actions workflow that runs on every push to the `master` branch — no manual steps needed.

If you ever want to deploy manually, run:

```bash
npm run deploy
```

This builds the app and publishes it to the `gh-pages` branch. The live site is available at [https://Yuvi-070.github.io/EchoBytes](https://Yuvi-070.github.io/EchoBytes).
