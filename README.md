# 🎯 PUBG Tactical Mortar Computer & Interactive Battleground Map

A high-performance tactical companion application and precision mortar ballistics computer designed specifically for **dual-monitor PUBG setups** and competitive squad play.

Calculates exact mortar distances, azimuth bearings, shell flight times, and sprint times, with deep-zoom map navigation, built-in in-game scale calibration, customizable spawn markers, and complete offline capability.

---

## 🚀 Standalone Windows App (.exe) — No Browser Required!
* **Double-click:** Run **`PUBG-Tactical-Mortar-Map.exe`** (or the **`PUBG-Tactical-Mortar-Map`** shortcut).
* **Portable:** The entire folder or **`PUBG-Tactical-Mortar-Map-Portable.zip`** can be extracted to any directory, placed on Desktop, or shared on a USB drive with teammates.
* **Completely Offline:** All high-definition maps, tiles, Leaflet coordinate engines, and marker databases are bundled inside.
* **100% Anti-Cheat Safe:** Completely external companion. Does not read game memory, hook into processes, or interact with game files.

---

## 🗺️ Supported Maps
| Map | In-Game Dimensions | Grid Size | Current 2026 Version |
| :--- | :--- | :--- | :--- |
| **Deston** | 8000m x 8000m (8x8 km) | 1000m / 100m | Ripton, Wind Farm, Los Arcos, Hydro Dam |
| **Erangel** | 8000m x 8000m (8x8 km) | 1000m / 100m | Current Remastered Erangel (Pochinki, Rozhok, Sosnovka) |
| **Taego** | 8000m x 8000m (8x8 km) | 1000m / 100m | Official 8x8 Korean battleground (Ho San, Airport, Studio) |
| **Miramar** | 8000m x 8000m (8x8 km) | 1000m / 100m | Current Miramar Rework (Partona, Resort, Truck Stop, Pecado) |
| **Rondo** | 8000m x 8000m (8x8 km) | 1000m / 100m | Current 8x8 battleground (Jadena City, NEOX, Stadium) |
| **Vikendi** | 8000m x 8000m (8x8 km) | 1000m / 100m | Vikendi Reborn 8x8 km (Train Station, Observatory, Dinoland) |
| **Sanhok** | 4000m x 4000m (4x4 km) | 1000m / 100m | Current in-game Sanhok (Bootcamp, Paradise, Docks, Ruins) |
| **Karakin** | 2000m x 2000m (2x2 km) | 500m / 100m | 2x2 km Arid Island (Al Habar, Bashara, Cargo Ship) |
| **Paramo** | 3000m x 3000m (3x3 km) | 500m / 100m | 3x3 km Volcanic Plateau (Capaco, Atahul, Makalu) |

---

## 🎯 How to Use the Mortar Calculator
1. **Click 1 (Friendly Mortar Position):** Places a tactical green marker with a sleek pinpoint crosshair and draws dynamic range rings:
   * **Red Inner Circle (121m):** Mortar deadzone (cannot hit closer than 121m).
   * **Green Outer Circle (700m):** Maximum mortar range.
2. **Move Mouse (Live Telemetry):** A live dashed line follows your cursor with a real-time distance badge.
3. **Click 2 (Enemy Target):** Places a red pinpoint crosshair and locks the calculation.
4. **Midpoint Distance Badge:** Shows exact distance in meters (e.g. `🎯 350m (042°)`).
   * **Green Status:** Target is in range (`121m - 700m`). Ready to fire!
   * **Red Status:** Target is too close (`<121m`) or out of range (`>700m`).
5. **Click Same Spot to Remove Mark (PUBG In-Game Ping Style):**
   * If you click the same spot or click directly on the **Target pin**, the target mark is removed.
   * If you click the same spot or click directly on the **Mortar pin**, the mortar mark is removed and the measurement clears.
   * You can still **drag pins smoothly** across the map to fine-tune without removing them.

---

## 🛠️ In-Game Scale Calibration
If PUBG updates a map, alters mortar ballistics, or shifts grid scales, you can calibrate the tool yourself:

### Method: Two-Shot Mortar Test
1. In PUBG, deploy a mortar and fire a shell at the minimum distance (**121m**).
2. Fire a second shell at the maximum distance (**700m**).
3. In the application, click **`🎯 Calibrate`** on the left sidebar and select **`Start In-Game 2-Shot Calibration`**.
4. Click your **Mortar location**, then click the **121m shell crater**, then click the **700m shell crater**.
5. The tool compares your clicks against the in-game readings, computes the exact scale multiplier (e.g. `1.0182x`), and saves it automatically.

---

## ✏️ Customizable Markers & Edit Mode
* **Toggle Edit Mode:** Click **`✏️ Edit Markers`** or press **`E`**.
* **Add a Marker:** Right-click anywhere on the map to place a Secret Room, Vehicle Garage, Glider spawn, or custom note.
* **Edit or Delete a Marker:** In Edit Mode, click any marker on the map to modify its title, description, or click **Delete**.
* **Persistent:** All custom markers and edits are saved directly in local storage.

---

## 💾 Sharing with Friends & Teammates
1. Send them **`PUBG-Tactical-Mortar-Map-Portable.zip`**.
2. They unzip it anywhere and run **`PUBG-Tactical-Mortar-Map.exe`**.
3. To share custom pins and scale calibrations:
   * Click **`💾 Share / Export`** on the sidebar.
   * Click **`Download Config File (.json)`**.
   * Teammates click **`Share / Export`** -> **`Choose File to Import`**. All your calibrations and custom markers will instantly load onto their screen!

---

## 📍 Verified Map Intelligence
All points of interest and spawns are calibrated with official coordinate data:
* **🗝️ Secret Rooms, Vaults, Basements & Bunkers:** Exact in-game locations for Erangel secret basements, Deston security rooms, Miramar secret rooms, Karakin bunkers, Taego/Paramo/Rondo keycard rooms, and Vikendi security bunkers.
* **🛩️ Motor Gliders:** Confirmed glider spawn locations.
* **⛽ Gas Stations:** Refuel and repair stations.
* **🐻 Bear Caves & Lab Camps:** Vikendi special threat zones and loot camps.
* **📍 Custom Waypoints:** Add your own tactical markers and notes by pressing **`E`** (Edit Mode) or right-clicking anywhere.

---

## 🎬 2D Match Replays & Player Tracker (Official pubg.sh Integration)
* **Direct pubg.sh Engine:** Streams the authentic **pubg.sh** client directly inside the desktop app using native hardware acceleration.
* **100% Exact In-Game Data:**
  * Exact player positions, parachute drops, and safe zone circles.
  * Zero coordinate drift, zero dots in the sea, and clean purple player trails.
  * Real-time 2D playback timeline scrubber (1x, 2x, 5x, 10x, 20x, 40x speed).
  * Full squad and enemy roster with real-time health, kills, assists, and damage dealt.
* **Fast Navigation & Presets:**
  * Search any player on Steam, Kakao, Xbox, or PSN.
  * Built-in quick presets for `Nihal7heNoob` and recent matches.
  * Direct URL/Match ID bar with Back, Forward, Reload, and Maximize buttons.

---

## ⌨️ Keyboard Shortcuts
* **`M`**: Reset to **Full Map View** fitting the screen snugly.
* **`H`**: Toggle **Sidebar HUD** (hide/show) for maximum map viewing area.
* **`R`**: Toggle **2D Match Replay** (pubg.sh) mode.
* **`C` / `Space`**: Clear Mortar and Target points.
* **`E`**: Toggle Marker Edit Mode (add/remove POIs).
* **`G`**: Toggle 1000m & 100m Tactical Grid overlay.
* **`F`**: Toggle Plane Flight Path & Parachute Corridor tool.
* **`Escape`**: Cancel active tool mode or close open modals.

