# 📡 Tactical Ballistic Radar 
> **A real-time audiovisual sonification and visualization of simulated geopolitical ballistic events.**

This project is a Single Page Application (SPA) built with Angular that simulates a dystopian/cyberpunk tactical radar. It generates, visualizes, and sonifies simulated military events (Ballistic Missiles, Drone Swarms, Cyber Attacks) between the United States and the Islamic Republic of Iran using purely browser-based rendering and audio synthesis.

## ✨ Features

- **🗺️ Interactive Professional Map (Leaflet)**: Uses CartoDB's Dark Matter geographical layers to represent the globe with high-contrast tactical aesthetics.
- **🚀 Real-Time Trajectory Engine**: Computes realistic geographical arcs between military bases in the Middle East and surrounding areas.
- **🎵 Generative Sonification Engine (Tone.js)**: 
  - Zero pre-recorded audio files. 100% synthesized in the browser.
  - **Ambient Drone**: A continuous 65Hz FMSynth background drone that modulates based on attack intensity.
  - **TR-808 Inspired Kits**: Launches trigger math-modeled 808 Kicks (USA) and 808 Snares (Iran).
  - **Impact Acoustics**: Impacts trigger heavy Reverb and Delay layered MetalSynths (Crash sounds).
- **💻 Cyber-Terminal UI**: A right-side floating panel designed with Glassmorphism and Monospace fonts, acting as a live `.log` readout detailing origins, routes, and data sources.
- **⚡ Reactive Architecture (RxJS)**: All data events are simulated and streamed asynchronously using Angular Services.

## 🛠️ Technology Stack
- **Framework**: Angular v19 (SPA Mode - No SSR)
- **Mapping**: Leaflet.js (`@asymmetrik/ngx-leaflet`)
- **Web Audio**: Tone.js (Web Audio API wrapper)
- **Styling**: SCSS (CSS Grid, Flexbox, Glassmorphism, CSS Animations)
- **Deployment**: Configured out-of-the-box for Netlify via `netlify.toml`

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Noisk8/warsoundata.git
cd warsoundata
```

2. Install dependencies:
```bash
npm install
```

3. Start the Angular Development Server:
```bash
npm run start
```

4. Open your browser and navigate to `http://localhost:4200/`.
> **Note:** Browsers block audio from playing automatically without user interaction. You must click the **[ INITIALIZE ]** button on the screen to start the simulation and hear the Tone.js context.

## ☁️ Deployment (Netlify)
This repository includes a `netlify.toml` file optimized for deploying modern Angular Single Page Applications.

1. Connect this repository to your Netlify account.
2. Netlify will automatically detect the build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist/iran-usa-ballistics/browser`
3. Hit Deploy. The `netlify.toml` includes fallback redirects (`/* /index.html 200`) to ensure Angular's routing works flawlessly in a serverless environment.

## 🤝 Contributing
This is an open-source experimental piece of net-art/data-visualization. Pull requests addressing UI improvements, new audio synthesis models, or real-time data API integrations (like GDELT or SIPRI) are highly encouraged!

## 📜 License
MIT License. Created by Noisk8.
