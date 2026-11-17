# Uthao Dhaka — Local Development

## Requirements
- Windows 10/11
- Node.js 22.12 or newer (Node.js 22 LTS recommended)
- npm (included with Node.js)

## Run on localhost (Windows)
1. Extract the ZIP file to a folder, for example `D:\\Games\\uthao-dhaka`.
2. Open that folder in File Explorer.
3. Click the address bar, type `cmd`, and press Enter.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open **http://localhost:3000** in Chrome or Edge.
6. Keep the Command Prompt window open while playing. To stop the local server, press `Ctrl + C`.

If port 3000 is already in use, stop the other app using it, or change the `--port=3000` value in the `dev` script in `package.json`.

## Production build check
Run:

```bash
npm run build
```

Vite writes the production files into the `dist` folder.

## Environment variables
The current game source does not read a Gemini API key, so a `.env.local` file is not required to run this version locally.

## Changes in this revision
- Added a dedicated Hazrat Shahjalal International Airport scene: runway markings, terminal, aircraft, animated helicopter silhouettes, and Airport Railway Station with tracks.
- Added location-specific landmark structures and labels for major Dhaka stops, including Kuril, Kalshi, Mirpur-10, Gabtoli, Shyamoli, Banani, Mohakhali, Farmgate, Shahbagh, Motijheel, Sayedabad and Jatrabari.
- Retained the existing permanent traffic simulation, which initializes traffic across every horizontal and vertical road and adds gridlocked vehicles at intersections.
- Kept existing game routes, helicopter controls, passengers, fare negotiation and scoring logic unchanged.

## Multiplayer development

The project is being prepared for cross-platform multiplayer in stages. Stage 1 adds
client/server boundaries, JSON-safe multiplayer contracts, and a minimal Express
health-check server. The existing single-player / AI gameplay is intentionally left
unchanged.

See `src/features/multiplayer/README.md` and `server/README.md` for the planned structure.
