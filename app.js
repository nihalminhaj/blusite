/* PUBG Tactical Mortar Computer & Interactive Map System */

(function () {
  'use strict';

  // --- MAP CONFIGURATIONS ---
  const PUBG_MAPS = {
    deston: {
      id: 'deston',
      name: 'Deston',
      sizeMeters: 8000,
      image: 'maps/deston.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - Urban flooded metropolis, wind turbines & Ripton skyscrapers.'
    },
    erangel: {
      id: 'erangel',
      name: 'Erangel',
      sizeMeters: 8000,
      image: 'maps/erangel.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - Russian military island with Sosnovka base.'
    },
    taego: {
      id: 'taego',
      name: 'Taego',
      sizeMeters: 8000,
      image: 'maps/taego.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - 1980s South Korean countryside & temples.'
    },
    miramar: {
      id: 'miramar',
      name: 'Miramar',
      sizeMeters: 8000,
      image: 'maps/miramar.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - Vast desert, Los Leones & mountain canyons.'
    },
    rondo: {
      id: 'rondo',
      name: 'Rondo',
      sizeMeters: 8000,
      image: 'maps/rondo.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - Ancient temples paired with futuristic skyscrapers.'
    },
    vikendi: {
      id: 'vikendi',
      name: 'Vikendi',
      sizeMeters: 8000,
      image: 'maps/vikendi.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '8x8 km - Reborn winter battlefield, glaciers & bear caves.'
    },
    sanhok: {
      id: 'sanhok',
      name: 'Sanhok',
      sizeMeters: 4000,
      image: 'maps/sanhok.jpg',
      gridSize: 1000,
      subgridSize: 100,
      description: '4x4 km - Lush Southeast Asian jungle with Bootcamp.'
    },
    karakin: {
      id: 'karakin',
      name: 'Karakin',
      sizeMeters: 2000,
      image: 'maps/karakin.jpg',
      gridSize: 500,
      subgridSize: 100,
      description: '2x2 km - North African arid island with underground tunnels.'
    },
    paramo: {
      id: 'paramo',
      name: 'Paramo',
      sizeMeters: 3000,
      image: 'maps/paramo.jpg',
      gridSize: 500,
      subgridSize: 100,
      description: '3x3 km - Dynamic active volcanic plateau with secret rooms.'
    }
  };

  // --- STATE ---
  let currentMap = PUBG_MAPS.deston;
  let leafletMap = null;
  let imageOverlay = null;

  // Mortar & Measurement
  let mortarMarker = null;
  let targetMarker = null;
  let trajectoryLine = null;
  let distanceBadgeMarker = null;
  let minRangeCircle = null;
  let maxRangeCircle = null;
  let tempPreviewLine = null;

  // Modes
  let activeToolMode = 'mortar'; // 'mortar', 'calibrate_2shot', 'flightpath', 'edit'
  let calibPoints = []; // for 2-shot calibration: [mortar, impact121, impact700]
  let flightPathPoints = [];
  let flightPathLine = null;
  let flightPathCorridor = null;
  let gridLayerGroup = null;
  let isGridVisible = false;
  let isEditMode = false;

  // Markers
  let allMarkers = [];
  let layerGroups = {
    secret_room: null,
    glider: null,
    gas_station: null,
    special: null,
    custom: null
  };

  // --- ICONS (SVG) ---
  function getCustomSvgIcon(type, title, isLarge = false) {
    const size = isLarge ? 34 : 26;
    let bg = '#151b28';
    let border = '#00e5ff';
    let glyph = '📍';

    switch (type) {
      case 'secret_room':
        border = '#ffb703';
        bg = 'rgba(255, 183, 3, 0.2)';
        glyph = '🗝️';
        break;
      case 'glider':
        border = '#ffea00';
        bg = 'rgba(255, 234, 0, 0.2)';
        glyph = '🛩️';
        break;
      case 'gas_station':
        border = '#00e5ff';
        bg = 'rgba(0, 229, 255, 0.2)';
        glyph = '⛽';
        break;
      case 'special':
        border = '#ff5400';
        bg = 'rgba(255, 84, 0, 0.2)';
        glyph = '🐻';
        break;
      case 'custom':
      default:
        border = '#b5179e';
        bg = 'rgba(181, 23, 158, 0.2)';
        glyph = '📍';
        break;
    }

    const html = `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${bg};
        border: 2px solid ${border};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: ${size * 0.52}px;
        box-shadow: 0 0 10px ${border};
        backdrop-filter: blur(4px);
        cursor: pointer;
        transition: transform 0.15s ease;
      " title="${title || ''}">
        ${glyph}
      </div>
    `;

    return L.divIcon({
      className: 'custom-poi-marker',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  function getMortarIcon() {
    return L.divIcon({
      className: 'leaflet-mortar-icon',
      html: `
        <div class="tactical-endpoint-pin mortar-pin" title="🟢 Mortar Position (Click to remove, drag to move)">
          <div class="pin-ring"></div>
          <div class="pin-center"></div>
        </div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  function getTargetIcon() {
    return L.divIcon({
      className: 'leaflet-target-icon',
      html: `
        <div class="tactical-endpoint-pin target-pin" title="🎯 Target Position (Click to remove, drag to move)">
          <div class="pin-ring"></div>
          <div class="pin-center"></div>
        </div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  // --- INITIALIZATION ---
  function init() {
    initLeaflet();
    loadMap(PUBG_MAPS.deston);
    loadMarkers();
    setupEventListeners();
    updateCalibrationIndicator();
  }

  // --- LEAFLET SETUP ---
  function initLeaflet() {
    leafletMap = L.map('leaflet-map', {
      crs: L.CRS.Simple,
      minZoom: -3.5,
      maxZoom: 4.5,
      zoomSnap: 0.1,
      zoomDelta: 0.2,
      attributionControl: false,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(leafletMap);

    // Initialize layer groups for POIs (default off)
    const toggleMap = {
      secret_room: 'toggle-secret-rooms',
      glider: 'toggle-gliders',
      gas_station: 'toggle-gas-stations',
      special: 'toggle-special',
      custom: 'toggle-custom'
    };
    Object.keys(layerGroups).forEach(key => {
      layerGroups[key] = L.layerGroup();
      const chk = document.getElementById(toggleMap[key]);
      if (chk && chk.checked) {
        layerGroups[key].addTo(leafletMap);
      }
    });
    gridLayerGroup = L.layerGroup().addTo(leafletMap);

    // Mouse coordinates HUD
    leafletMap.on('mousemove', onMapMouseMove);
    leafletMap.on('click', onMapClick);
    leafletMap.on('contextmenu', onMapContextMenu);
    leafletMap.on('zoomend', updateZoomHud);
  }

  // Calculate the exact zoom level where the map fills the screen snugly
  function calculateFitZoom() {
    if (!leafletMap || !currentMap) return -3.0;
    const size = leafletMap.getSize();
    if (!size || size.x <= 0 || size.y <= 0) return -3.0;
    // Fit the square map into the viewport dimensions with clean padding
    const minDim = Math.min(size.x, size.y);
    const targetScale = (minDim - 16) / currentMap.sizeMeters;
    // Round to 1 decimal place
    return Math.floor(Math.log2(targetScale) * 10) / 10;
  }

  function fitMapToScreen(animate = false) {
    if (!leafletMap || !currentMap) return;
    leafletMap.invalidateSize();
    const fitZoom = calculateFitZoom();
    
    // LOCK minZoom to the exact screen-fit size so the user CANNOT zoom out into empty space
    leafletMap.setMinZoom(fitZoom);
    
    const center = [currentMap.sizeMeters / 2, currentMap.sizeMeters / 2];
    leafletMap.setView(center, fitZoom, { animate: animate });
  }

  // --- MAP STYLE (CLEAN VS GUIDE) ---
  // --- MAP SWITCHING ---
  function loadMap(mapConfig) {
    currentMap = mapConfig;

    // Reset mortar & active tools
    clearMeasurement();
    clearFlightPath();

    const bounds = [[0, 0], [mapConfig.sizeMeters, mapConfig.sizeMeters]];

    if (imageOverlay) {
      leafletMap.removeLayer(imageOverlay);
    }

    const imgUrl = mapConfig.image;
    imageOverlay = L.imageOverlay(imgUrl, bounds, {
      noWrap: true,
      bounds: bounds
    }).addTo(leafletMap);

    // Prevent dragging the map away into outer space
    const margin = mapConfig.sizeMeters * 0.12;
    leafletMap.setMaxBounds([
      [-margin, -margin],
      [mapConfig.sizeMeters + margin, mapConfig.sizeMeters + margin]
    ]);

    // Fit whole map snugly into screen
    setTimeout(() => fitMapToScreen(false), 50);

    // Update UI headers
    document.getElementById('map-size-label').textContent = `${(mapConfig.sizeMeters / 1000)}x${(mapConfig.sizeMeters / 1000)} KM`;
    document.getElementById('hud-map-name').textContent = mapConfig.name.toUpperCase();

    // Redraw grid if visible
    if (isGridVisible) {
      drawTacticalGrid();
    }

    // Refresh markers for this map
    renderMarkers();
    updateCalibrationIndicator();
  }

  // --- COORDINATE UTILITIES ---
  // In our L.CRS.Simple setup:
  // lat = Y in meters (0 to mapSize)
  // lng = X in meters (0 to mapSize)
  function getGridName(x, y) {
    const totalSize = currentMap.sizeMeters;
    const colSize = currentMap.gridSize;
    const colIdx = Math.floor(x / colSize);
    // Y runs from bottom to top, PUBG grid numbers run top to bottom
    const rowIdx = Math.floor((totalSize - y) / colSize);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const letter = letters[colIdx] || '?';
    const number = (rowIdx + 1) || '?';
    return `${letter}${number}`;
  }

  function onMapMouseMove(e) {
    const x = Math.round(Math.max(0, Math.min(currentMap.sizeMeters, e.latlng.lng)));
    const y = Math.round(Math.max(0, Math.min(currentMap.sizeMeters, e.latlng.lat)));

    document.getElementById('hud-xy-coord').textContent = `X: ${x}m | Y: ${y}m`;
    document.getElementById('hud-grid-coord').textContent = getGridName(x, y);

    // Live rubberband preview line if Mortar is placed but Target is not yet
    if (activeToolMode === 'mortar' && mortarMarker && !targetMarker) {
      const mortarLatLng = mortarMarker.getLatLng();
      const currentLatLng = e.latlng;
      const dist = calculateDistance(mortarLatLng, currentLatLng);

      if (!tempPreviewLine) {
        tempPreviewLine = L.polyline([mortarLatLng, currentLatLng], {
          color: '#00ff9d',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.7,
          interactive: false
        }).addTo(leafletMap);
      } else {
        tempPreviewLine.setLatLngs([mortarLatLng, currentLatLng]);
      }

      updateBallisticsDisplay(dist, mortarLatLng, currentLatLng);
    }
  }

  function updateZoomHud() {
    const zoom = leafletMap.getZoom();
    const pct = Math.round(Math.pow(2, zoom) * 100);
    document.getElementById('hud-zoom-val').textContent = `${pct}%`;
  }

  // --- CALIBRATION MATH ---
  function getActiveCalibration() {
    const stored = localStorage.getItem(`pubg_mortar_calib_${currentMap.id}`);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val > 0) return val;
    }
    return 1.0000;
  }

  function saveCalibration(factor) {
    localStorage.setItem(`pubg_mortar_calib_${currentMap.id}`, factor.toFixed(4));
    updateCalibrationIndicator();
    showToast(`Map scale calibrated to ${factor.toFixed(4)}x and saved!`);
    if (mortarMarker && targetMarker) {
      calculateAndRenderBallistics();
    }
  }

  function resetCalibration() {
    localStorage.removeItem(`pubg_mortar_calib_${currentMap.id}`);
    updateCalibrationIndicator();
    showToast(`Reset scale calibration to factory default (1.0000x)`);
    if (mortarMarker && targetMarker) {
      calculateAndRenderBallistics();
    }
  }

  function updateCalibrationIndicator() {
    const factor = getActiveCalibration();
    const ind = document.getElementById('calib-indicator');
    const disp = document.getElementById('current-calib-display');
    const manInput = document.getElementById('manual-scale-input');

    const txt = `${factor.toFixed(4)}x CALIB`;
    if (ind) ind.textContent = txt;
    if (disp) disp.textContent = `${factor.toFixed(4)}x`;
    if (manInput) manInput.value = factor.toFixed(4);
  }

  function calculateDistance(latlngA, latlngB) {
    const dx = latlngB.lng - latlngA.lng;
    const dy = latlngB.lat - latlngA.lat;
    const rawDist = Math.hypot(dx, dy);
    return Math.round(rawDist * getActiveCalibration());
  }

  function calculateBearing(latlngA, latlngB) {
    const dx = latlngB.lng - latlngA.lng;
    const dy = latlngB.lat - latlngA.lat; // Y is up (North)
    let deg = Math.atan2(dx, dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIdx = Math.round(deg / 45) % 8;
    return {
      degrees: Math.round(deg),
      direction: dirs[dirIdx]
    };
  }

  // --- SPOT / DISTANCE CHECK ---
  function isSameSpot(latlngA, latlngB, pixelThreshold = 10) {
    if (!leafletMap || !latlngA || !latlngB) return false;
    try {
      const pA = leafletMap.latLngToContainerPoint(latlngA);
      const pB = leafletMap.latLngToContainerPoint(latlngB);
      return Math.hypot(pA.x - pB.x, pA.y - pB.y) <= pixelThreshold;
    } catch (_) {
      return Math.hypot(latlngA.lat - latlngB.lat, latlngA.lng - latlngB.lng) <= 15;
    }
  }

  function removeTarget() {
    if (targetMarker) {
      leafletMap.removeLayer(targetMarker);
      targetMarker = null;
    }
    if (trajectoryLine) {
      leafletMap.removeLayer(trajectoryLine);
      trajectoryLine = null;
    }
    if (distanceBadgeMarker) {
      leafletMap.removeLayer(distanceBadgeMarker);
      distanceBadgeMarker = null;
    }
    if (tempPreviewLine) {
      leafletMap.removeLayer(tempPreviewLine);
      tempPreviewLine = null;
    }

    updateBallisticsDisplay(0, null, null);
    document.getElementById('bearing-val').textContent = '---°';
    document.getElementById('elevation-val').textContent = '--- mils';
    document.getElementById('flight-time-val').textContent = '~0.0 s';
    document.getElementById('sprint-time-val').textContent = '~0.0 s';

    showToast('Target mark removed');
  }

  // --- MORTAR & TARGET LOGIC ---
  function onMapClick(e) {
    // Only prevent placing mortar/target marks if replay mode is actively streaming or viewing replay tab
    const replayView = document.getElementById('replay-sidebar-view');
    const isReplayTab = replayView && replayView.style.display !== 'none' && replayView.classList.contains('active');
    let isReplayRunning = false;
    if (window.PUBG_REPLAY) {
      if (typeof window.PUBG_REPLAY.isReplayActive === 'function') {
        try {
          isReplayRunning = window.PUBG_REPLAY.isReplayActive();
        } catch (_) {}
      } else if (window.PUBG_REPLAY.getState) {
        try {
          const s = window.PUBG_REPLAY.getState();
          isReplayRunning = s && s.isReplayActive;
        } catch (_) {}
      }
    }

    if (isReplayRunning || isReplayTab) {
      return;
    }

    if (activeToolMode === 'calibrate_2shot') {
      handleCalibrationClick(e.latlng);
      return;
    }

    if (activeToolMode === 'flightpath') {
      handleFlightPathClick(e.latlng);
      return;
    }

    // Default: Mortar Fire Control
    // 1. If clicking same spot as Target, remove Target mark
    if (targetMarker && isSameSpot(e.latlng, targetMarker.getLatLng())) {
      removeTarget();
      return;
    }

    // 2. If clicking same spot as Mortar, remove Mortar mark (clearing measurement)
    if (mortarMarker && isSameSpot(e.latlng, mortarMarker.getLatLng())) {
      clearMeasurement();
      showToast('Mortar mark removed');
      return;
    }

    // 3. Place new mark
    if (!mortarMarker) {
      // Step 1: Place Mortar
      setMortarPosition(e.latlng);
    } else if (!targetMarker) {
      // Step 2: Place Target
      setTargetPosition(e.latlng);
    } else {
      // Both exist: clicking a different spot sets new Target
      setTargetPosition(e.latlng);
    }
  }

  function setMortarPosition(latlng) {
    if (mortarMarker) {
      leafletMap.removeLayer(mortarMarker);
    }
    if (minRangeCircle) leafletMap.removeLayer(minRangeCircle);
    if (maxRangeCircle) leafletMap.removeLayer(maxRangeCircle);

    mortarMarker = L.marker(latlng, {
      icon: getMortarIcon(),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(leafletMap);

    mortarMarker.on('click', (e) => {
      if (mortarMarker.dragging && mortarMarker.dragging.moved()) return;
      L.DomEvent.stopPropagation(e);
      clearMeasurement();
      showToast('Mortar mark removed');
    });

    mortarMarker.on('drag', onMortarDrag);
    mortarMarker.on('dragend', calculateAndRenderBallistics);

    // Range rings
    // PUBG Mortar: min 121m, max 700m
    minRangeCircle = L.circle(latlng, {
      radius: 121,
      color: '#ff3b5c',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#ff3b5c',
      fillOpacity: 0.1,
      interactive: false
    }).addTo(leafletMap);

    maxRangeCircle = L.circle(latlng, {
      radius: 700,
      color: '#00ff9d',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#00ff9d',
      fillOpacity: 0.05,
      interactive: false
    }).addTo(leafletMap);

    if (targetMarker) {
      calculateAndRenderBallistics();
    } else {
      showToast('Mortar set. Click enemy position to calculate distance!');
    }
  }

  function setTargetPosition(latlng) {
    if (tempPreviewLine) {
      leafletMap.removeLayer(tempPreviewLine);
      tempPreviewLine = null;
    }

    if (targetMarker) {
      leafletMap.removeLayer(targetMarker);
    }

    targetMarker = L.marker(latlng, {
      icon: getTargetIcon(),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(leafletMap);

    targetMarker.on('click', (e) => {
      if (targetMarker.dragging && targetMarker.dragging.moved()) return;
      L.DomEvent.stopPropagation(e);
      removeTarget();
    });

    targetMarker.on('drag', onTargetDrag);
    targetMarker.on('dragend', calculateAndRenderBallistics);

    calculateAndRenderBallistics();
  }

  function onMortarDrag() {
    const pos = mortarMarker.getLatLng();
    if (minRangeCircle) minRangeCircle.setLatLng(pos);
    if (maxRangeCircle) maxRangeCircle.setLatLng(pos);
    updateTrajectoryLine();
  }

  function onTargetDrag() {
    updateTrajectoryLine();
  }

  function updateTrajectoryLine() {
    if (!mortarMarker || !targetMarker) return;
    const mPos = mortarMarker.getLatLng();
    const tPos = targetMarker.getLatLng();
    const dist = calculateDistance(mPos, tPos);

    if (trajectoryLine) {
      trajectoryLine.setLatLngs([mPos, tPos]);
    }

    updateBallisticsDisplay(dist, mPos, tPos);
    updateDistanceBadge(mPos, tPos, dist);
  }

  function calculateAndRenderBallistics() {
    if (!mortarMarker || !targetMarker) return;
    const mPos = mortarMarker.getLatLng();
    const tPos = targetMarker.getLatLng();
    const dist = calculateDistance(mPos, tPos);

    // Draw solid trajectory line
    if (trajectoryLine) leafletMap.removeLayer(trajectoryLine);
    const inRange = dist >= 121 && dist <= 700;
    const lineColor = inRange ? '#00ff9d' : '#ff3b5c';

    trajectoryLine = L.polyline([mPos, tPos], {
      color: lineColor,
      weight: 3,
      opacity: 0.9,
      dashArray: '8, 8',
      interactive: false
    }).addTo(leafletMap);

    updateDistanceBadge(mPos, tPos, dist);
    updateBallisticsDisplay(dist, mPos, tPos);
  }

  function updateDistanceBadge(mPos, tPos, dist) {
    const midLatLng = L.latLng(
      (mPos.lat + tPos.lat) / 2,
      (mPos.lng + tPos.lng) / 2
    );

    const inRange = dist >= 121 && dist <= 700;
    const cls = inRange ? 'tactical-distance-badge' : 'tactical-distance-badge out';
    const bearing = calculateBearing(mPos, tPos);

    const html = `<div class="${cls}">🎯 ${dist}m (${bearing.degrees}°)</div>`;

    if (!distanceBadgeMarker) {
      distanceBadgeMarker = L.marker(midLatLng, {
        icon: L.divIcon({
          className: 'tactical-badge-wrapper',
          html: html,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        }),
        interactive: false
      }).addTo(leafletMap);
    } else {
      distanceBadgeMarker.setLatLng(midLatLng);
      distanceBadgeMarker.setIcon(L.divIcon({
        className: 'tactical-badge-wrapper',
        html: html,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      }));
    }
  }

  function updateBallisticsDisplay(dist, mPos, tPos) {
    const readout = document.getElementById('distance-readout');
    const badge = document.getElementById('range-status-badge');
    const panel = document.getElementById('ballistics-panel');
    const fill = document.getElementById('range-bar-fill');
    const bearingEl = document.getElementById('bearing-val');
    const elevEl = document.getElementById('elevation-val');
    const flightEl = document.getElementById('flight-time-val');
    const sprintEl = document.getElementById('sprint-time-val');

    readout.textContent = dist;

    // Mortar Range Check: 121m - 700m
    const minM = 121;
    const maxM = 700;
    const inRange = dist >= minM && dist <= maxM;

    panel.className = 'ballistics-panel';
    fill.className = 'range-bar-fill';

    if (dist === 0) {
      panel.classList.add('standby');
      badge.className = 'status-badge status-standby';
      badge.textContent = 'Standby';
      fill.style.width = '0%';
    } else if (dist < minM) {
      panel.classList.add('out-of-range');
      badge.className = 'status-badge status-out-range';
      badge.textContent = 'TOO CLOSE (Min 121m)';
      fill.classList.add('out');
      fill.style.width = `${(dist / maxM) * 100}%`;
    } else if (dist > maxM) {
      panel.classList.add('out-of-range');
      badge.className = 'status-badge status-out-range';
      badge.textContent = 'OUT OF RANGE (Max 700m)';
      fill.classList.add('out');
      fill.style.width = '100%';
    } else {
      badge.className = 'status-badge status-in-range';
      badge.textContent = 'IN RANGE (FIRE)';
      fill.style.width = `${((dist - minM) / (maxM - minM)) * 100}%`;
    }

    if (mPos && tPos) {
      const b = calculateBearing(mPos, tPos);
      bearingEl.textContent = `${b.degrees.toString().padStart(3, '0')}° ${b.direction}`;

      // In PUBG, elevation dial is adjusted in distance meters or mils
      // Travel time is high-angle ballistic curve: roughly 20-21.5s
      const flightTime = (20.0 + (dist / maxM) * 1.5).toFixed(1);
      flightEl.textContent = `~${flightTime} s`;

      // Sprinting unarmed speed in PUBG ~6.3 m/s
      const sprintTime = (dist / 6.3).toFixed(1);
      sprintEl.textContent = `~${sprintTime} s`;

      // In-game mortar pitch estimation (mils)
      const mils = Math.round(1100 - (dist / maxM) * 300);
      elevEl.textContent = `${dist}m (${mils} mil)`;
    }
  }

  function clearMeasurement() {
    if (mortarMarker) {
      leafletMap.removeLayer(mortarMarker);
      mortarMarker = null;
    }
    if (targetMarker) {
      leafletMap.removeLayer(targetMarker);
      targetMarker = null;
    }
    if (trajectoryLine) {
      leafletMap.removeLayer(trajectoryLine);
      trajectoryLine = null;
    }
    if (distanceBadgeMarker) {
      leafletMap.removeLayer(distanceBadgeMarker);
      distanceBadgeMarker = null;
    }
    if (minRangeCircle) {
      leafletMap.removeLayer(minRangeCircle);
      minRangeCircle = null;
    }
    if (maxRangeCircle) {
      leafletMap.removeLayer(maxRangeCircle);
      maxRangeCircle = null;
    }
    if (tempPreviewLine) {
      leafletMap.removeLayer(tempPreviewLine);
      tempPreviewLine = null;
    }

    updateBallisticsDisplay(0, null, null);
    document.getElementById('bearing-val').textContent = '---°';
    document.getElementById('elevation-val').textContent = '--- mils';
    document.getElementById('flight-time-val').textContent = '~0.0 s';
    document.getElementById('sprint-time-val').textContent = '~0.0 s';
  }

  // --- TWO-SHOT IN-GAME CALIBRATION ---
  function startTwoShotCalibration() {
    activeToolMode = 'calibrate_2shot';
    calibPoints = [];
    clearMeasurement();
    closeAllModals();

    setModeIndicator(true, '🎯 2-SHOT CALIBRATION: Click your Mortar location on map');
  }

  function handleCalibrationClick(latlng) {
    calibPoints.push(latlng);

    if (calibPoints.length === 1) {
      // Step 1 clicked: Mortar
      L.circleMarker(latlng, {
        radius: 8,
        color: '#00ff9d',
        fillColor: '#00ff9d',
        fillOpacity: 0.8
      }).addTo(leafletMap);
      setModeIndicator(true, '🎯 STEP 2: Click the 121m (Lowest shot) Impact point');
    } else if (calibPoints.length === 2) {
      // Step 2 clicked: 121m shot
      L.circleMarker(latlng, {
        radius: 6,
        color: '#ffb703',
        fillColor: '#ffb703',
        fillOpacity: 0.8
      }).addTo(leafletMap);
      setModeIndicator(true, '🎯 STEP 3: Click the 700m (Highest shot) Impact point');
    } else if (calibPoints.length === 3) {
      // Step 3 clicked: 700m shot
      const pMortar = calibPoints[0];
      const p121 = calibPoints[1];
      const p700 = calibPoints[2];

      const rawDist121 = Math.hypot(p121.lng - pMortar.lng, p121.lat - pMortar.lat);
      const rawDist700 = Math.hypot(p700.lng - pMortar.lng, p700.lat - pMortar.lat);

      if (rawDist121 <= 0 || rawDist700 <= 0) {
        showToast('Calibration error: Invalid click points', 'error');
        cancelActiveMode();
        return;
      }

      // Compute scale ratios
      const scale121 = 121.0 / rawDist121;
      const scale700 = 700.0 / rawDist700;
      const averageScale = (scale121 + scale700) / 2.0;

      saveCalibration(averageScale);
      showToast(`Calibrated with 2-shot test: ${averageScale.toFixed(4)}x scale applied!`);
      cancelActiveMode();
    }
  }

  // --- FLIGHT PATH & PARACHUTE CORRIDOR ---
  function startFlightPathTool() {
    activeToolMode = 'flightpath';
    flightPathPoints = [];
    clearFlightPath();
    setModeIndicator(true, '✈️ FLIGHT PATH: Click Plane Entry point, then Exit point');
  }

  function handleFlightPathClick(latlng) {
    flightPathPoints.push(latlng);

    if (flightPathPoints.length === 1) {
      L.circleMarker(latlng, {
        radius: 7,
        color: '#fff',
        fillColor: '#00e5ff',
        fillOpacity: 0.9
      }).addTo(leafletMap);
      setModeIndicator(true, '✈️ FLIGHT PATH: Click Plane Exit point');
    } else if (flightPathPoints.length === 2) {
      const p1 = flightPathPoints[0];
      const p2 = flightPathPoints[1];

      // Flight path line
      flightPathLine = L.polyline([p1, p2], {
        color: '#ffffff',
        weight: 3,
        dashArray: '8, 8'
      }).addTo(leafletMap);

      // Parachute corridor (1500m normal glide range on each side)
      // Vector perpendicular
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      const len = Math.hypot(dx, dy);
      const perpX = (-dy / len) * 1500;
      const perpY = (dx / len) * 1500;

      const polyPoints = [
        L.latLng(p1.lat + perpY, p1.lng + perpX),
        L.latLng(p2.lat + perpY, p2.lng + perpX),
        L.latLng(p2.lat - perpY, p2.lng - perpX),
        L.latLng(p1.lat - perpY, p1.lng - perpX)
      ];

      flightPathCorridor = L.polygon(polyPoints, {
        color: '#00e5ff',
        weight: 1,
        fillColor: '#00e5ff',
        fillOpacity: 0.12,
        interactive: false
      }).addTo(leafletMap);

      showToast('Flight path & 1500m drop corridor plotted!');
      cancelActiveMode();
    }
  }

  function clearFlightPath() {
    if (flightPathLine) {
      leafletMap.removeLayer(flightPathLine);
      flightPathLine = null;
    }
    if (flightPathCorridor) {
      leafletMap.removeLayer(flightPathCorridor);
      flightPathCorridor = null;
    }
    flightPathPoints = [];
  }

  // --- TACTICAL GRID OVERLAY ---
  function toggleTacticalGrid() {
    isGridVisible = !isGridVisible;
    const btn = document.getElementById('tool-grid-btn');
    if (btn) btn.classList.toggle('active', isGridVisible);

    if (isGridVisible) {
      drawTacticalGrid();
      showToast('1000m & 100m tactical grid enabled');
    } else {
      gridLayerGroup.clearLayers();
      showToast('Tactical grid hidden');
    }
  }

  function drawTacticalGrid() {
    gridLayerGroup.clearLayers();
    const mapSize = currentMap.sizeMeters;
    const major = currentMap.gridSize; // 1000m
    const minor = currentMap.subgridSize; // 100m

    // Minor lines (every 100m)
    for (let c = minor; c < mapSize; c += minor) {
      if (c % major === 0) continue; // skip major
      // Vertical
      L.polyline([[0, c], [mapSize, c]], {
        color: '#1a2942',
        weight: 0.75,
        opacity: 0.4,
        interactive: false
      }).addTo(gridLayerGroup);
      // Horizontal
      L.polyline([[c, 0], [c, mapSize]], {
        color: '#1a2942',
        weight: 0.75,
        opacity: 0.4,
        interactive: false
      }).addTo(gridLayerGroup);
    }

    // Major lines (every 1000m)
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let colIdx = 0;
    for (let m = 0; m <= mapSize; m += major) {
      // Vertical
      L.polyline([[0, m], [mapSize, m]], {
        color: '#00e5ff',
        weight: 1.5,
        opacity: 0.35,
        interactive: false
      }).addTo(gridLayerGroup);

      // Horizontal
      L.polyline([[m, 0], [m, mapSize]], {
        color: '#00e5ff',
        weight: 1.5,
        opacity: 0.35,
        interactive: false
      }).addTo(gridLayerGroup);

      // Column letter label at top
      if (m < mapSize) {
        const letter = letters[colIdx++];
        L.marker([mapSize - 50, m + major / 2], {
          icon: L.divIcon({
            className: 'grid-coord-label',
            html: `<div style="font-family: monospace; font-size: 13px; font-weight: bold; color: rgba(0, 229, 255, 0.6);">${letter}</div>`,
            iconSize: [30, 20],
            iconAnchor: [15, 10]
          }),
          interactive: false
        }).addTo(gridLayerGroup);
      }
    }
  }

  // --- MARKERS DATABASE & RENDERING ---
  function loadMarkers() {
    // 1. Load default markers from JS bundle
    const defaultData = window.PUBG_DEFAULT_MARKERS || {};
    allMarkers = [];

    Object.keys(defaultData).forEach(mapKey => {
      const list = defaultData[mapKey];
      if (Array.isArray(list)) {
        allMarkers.push(...list);
      }
    });

    // 2. Load custom user markers from localStorage
    const savedUserMarkers = localStorage.getItem('pubg_user_markers');
    if (savedUserMarkers) {
      try {
        const parsed = JSON.parse(savedUserMarkers);
        if (Array.isArray(parsed)) {
          allMarkers.push(...parsed);
        }
      } catch (err) {
        console.error('Error loading custom markers:', err);
      }
    }

    renderMarkers();
  }

  function saveCustomMarker(markerData) {
    let saved = [];
    try {
      const raw = localStorage.getItem('pubg_user_markers');
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      saved = [];
    }

    // Check if updating existing
    const existingIdx = saved.findIndex(m => m.id === markerData.id);
    if (existingIdx >= 0) {
      saved[existingIdx] = markerData;
    } else {
      saved.push(markerData);
    }

    localStorage.setItem('pubg_user_markers', JSON.stringify(saved));
    loadMarkers();
    showToast(`Marker "${markerData.title}" saved!`);
  }

  function deleteCustomMarker(markerId) {
    let saved = [];
    try {
      const raw = localStorage.getItem('pubg_user_markers');
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      saved = [];
    }

    saved = saved.filter(m => m.id !== markerId);
    localStorage.setItem('pubg_user_markers', JSON.stringify(saved));

    // Also filter from runtime
    allMarkers = allMarkers.filter(m => m.id !== markerId);
    renderMarkers();
    showToast('Marker deleted');
  }

  function renderMarkers() {
    // Clear existing
    Object.keys(layerGroups).forEach(k => layerGroups[k].clearLayers());

    const counts = { secret_room: 0, glider: 0, gas_station: 0, special: 0, custom: 0 };
    const mapId = currentMap.id;

    allMarkers.forEach(m => {
      if (m.map !== mapId) return;

      const type = m.type || 'custom';
      if (counts[type] !== undefined) counts[type]++;

      const group = layerGroups[type] || layerGroups.custom;
      const latlng = L.latLng(m.y, m.x);
      const icon = getCustomSvgIcon(type, m.title);

      const marker = L.marker(latlng, { icon: icon });

      // Popup
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 180px; color: #111;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #0b0e14;">${m.title}</h4>
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 6px;">
            ${type.replace('_', ' ')}
          </div>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #333; line-height: 1.4;">${m.desc || ''}</p>
          <div style="font-size: 10px; font-family: monospace; color: #777;">
            Coord: X ${Math.round(m.x)}m | Y ${Math.round(m.y)}m
          </div>
          ${isEditMode ? `<div style="margin-top: 8px;"><button style="cursor: pointer; padding: 4px 8px; font-size: 11px; background: #ff3b5c; color: #fff; border: none; border-radius: 4px;" onclick="window._editMarker('${m.id}')">Edit / Delete</button></div>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (isEditMode) {
          openEditMarkerModal(m);
        }
      });

      marker.addTo(group);
    });

    // Update count labels
    if (document.getElementById('count-secret-rooms')) document.getElementById('count-secret-rooms').textContent = counts.secret_room;
    if (document.getElementById('count-gliders')) document.getElementById('count-gliders').textContent = counts.glider;
    if (document.getElementById('count-gas-stations')) document.getElementById('count-gas-stations').textContent = counts.gas_station;
    if (document.getElementById('count-special')) document.getElementById('count-special').textContent = counts.special;
    if (document.getElementById('count-custom')) document.getElementById('count-custom').textContent = counts.custom;
  }

  // Window helper for popup edit button
  window._editMarker = function(id) {
    const m = allMarkers.find(x => x.id === id);
    if (m) openEditMarkerModal(m);
  };

  // --- MARKER EDIT / ADD MODAL ---
  function onMapContextMenu(e) {
    // Right click anywhere on map
    if (isEditMode) {
      openAddMarkerModal(e.latlng);
    }
  }

  function openAddMarkerModal(latlng) {
    const x = Math.round(latlng.lng);
    const y = Math.round(latlng.lat);

    document.getElementById('marker-modal-title').innerHTML = '<span>📍</span> Add New Tactical Marker';
    document.getElementById('marker-edit-id').value = `custom_${Date.now()}`;
    document.getElementById('marker-edit-x').value = x;
    document.getElementById('marker-edit-y').value = y;
    document.getElementById('marker-input-title').value = '';
    document.getElementById('marker-input-type').value = 'secret_room';
    document.getElementById('marker-input-desc').value = '';
    document.getElementById('marker-coords-preview').textContent = `X: ${x}m, Y: ${y}m (Grid: ${getGridName(x, y)})`;
    document.getElementById('marker-delete-btn').style.display = 'none';

    openModal('modal-marker');
  }

  function openEditMarkerModal(marker) {
    document.getElementById('marker-modal-title').innerHTML = '<span>✏️</span> Edit Tactical Marker';
    document.getElementById('marker-edit-id').value = marker.id;
    document.getElementById('marker-edit-x').value = marker.x;
    document.getElementById('marker-edit-y').value = marker.y;
    document.getElementById('marker-input-title').value = marker.title;
    document.getElementById('marker-input-type').value = marker.type;
    document.getElementById('marker-input-desc').value = marker.desc || '';
    document.getElementById('marker-coords-preview').textContent = `X: ${Math.round(marker.x)}m, Y: ${Math.round(marker.y)}m`;
    document.getElementById('marker-delete-btn').style.display = 'block';

    openModal('modal-marker');
  }

  // --- EXPORT / IMPORT ---
  function exportConfig() {
    const customMarkers = [];
    try {
      const raw = localStorage.getItem('pubg_user_markers');
      if (raw) customMarkers.push(...JSON.parse(raw));
    } catch (e) {}

    const calibrations = {};
    Object.keys(PUBG_MAPS).forEach(k => {
      const c = localStorage.getItem(`pubg_mortar_calib_${k}`);
      if (c) calibrations[k] = parseFloat(c);
    });

    const exportData = {
      version: '2.4',
      exportDate: new Date().toISOString(),
      calibrations: calibrations,
      customMarkers: customMarkers
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pubg_tactical_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Config file exported successfully!');
  }

  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.calibrations) {
          Object.keys(data.calibrations).forEach(k => {
            localStorage.setItem(`pubg_mortar_calib_${k}`, data.calibrations[k]);
          });
        }
        if (data.customMarkers && Array.isArray(data.customMarkers)) {
          localStorage.setItem('pubg_user_markers', JSON.stringify(data.customMarkers));
        }

        updateCalibrationIndicator();
        loadMarkers();
        closeAllModals();
        showToast('Tactical config imported and applied!');
      } catch (err) {
        showToast('Invalid JSON config file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // --- UI HELPERS & MODALS ---
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open'));
  }

  function setModeIndicator(active, text = '') {
    const el = document.getElementById('mode-indicator');
    const txtEl = document.getElementById('mode-indicator-text');
    if (active) {
      el.classList.add('active');
      txtEl.textContent = text;
    } else {
      el.classList.remove('active');
    }
  }

  function cancelActiveMode() {
    activeToolMode = 'mortar';
    calibPoints = [];
    flightPathPoints = [];
    setModeIndicator(false);
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Map Selector Buttons
    document.querySelectorAll('.map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mapKey = btn.getAttribute('data-map');
        if (PUBG_MAPS[mapKey]) {
          loadMap(PUBG_MAPS[mapKey]);
        }
      });
    });

    // Clear Button
    document.getElementById('clear-markers-btn').addEventListener('click', clearMeasurement);

    // Copy Distance Button
    document.getElementById('copy-distance-btn').addEventListener('click', () => {
      const val = document.getElementById('distance-readout').textContent;
      navigator.clipboard.writeText(`${val}m`).then(() => {
        showToast(`Copied ${val}m to clipboard!`);
      }).catch(() => {
        showToast(`Distance: ${val}m`);
      });
    });

    // POI Toggle Switches
    const toggles = {
      'toggle-secret-rooms': 'secret_room',
      'toggle-gliders': 'glider',
      'toggle-gas-stations': 'gas_station',
      'toggle-special': 'special',
      'toggle-custom': 'custom'
    };

    Object.keys(toggles).forEach(id => {
      const el = document.getElementById(id);
      const groupKey = toggles[id];
      if (el) {
        el.addEventListener('change', () => {
          const group = layerGroups[groupKey];
          if (el.checked) {
            if (!leafletMap.hasLayer(group)) leafletMap.addLayer(group);
          } else {
            if (leafletMap.hasLayer(group)) leafletMap.removeLayer(group);
          }
        });
      }
    });

    // Tools
    document.getElementById('tool-flightpath-btn').addEventListener('click', () => {
      if (activeToolMode === 'flightpath') {
        cancelActiveMode();
      } else {
        startFlightPathTool();
      }
    });

    document.getElementById('tool-grid-btn').addEventListener('click', toggleTacticalGrid);

    document.getElementById('tool-calibrate-btn').addEventListener('click', () => {
      openModal('modal-calibration');
    });

    document.getElementById('start-two-shot-calib-btn').addEventListener('click', startTwoShotCalibration);

    document.getElementById('apply-manual-scale-btn').addEventListener('click', () => {
      const val = parseFloat(document.getElementById('manual-scale-input').value);
      if (!isNaN(val) && val > 0.1 && val < 10) {
        saveCalibration(val);
      } else {
        showToast('Invalid scale multiplier (must be between 0.1 and 10)', 'error');
      }
    });

    document.getElementById('reset-calib-btn').addEventListener('click', resetCalibration);

    // Edit Mode Toggle
    document.getElementById('tool-editmode-btn').addEventListener('click', () => {
      isEditMode = !isEditMode;
      const btn = document.getElementById('tool-editmode-btn');
      btn.classList.toggle('active', isEditMode);

      if (isEditMode) {
        setModeIndicator(true, '✏️ EDIT MODE ACTIVE: Right-click map to place marker, or click marker to edit');
        showToast('Edit mode activated. Right-click map to add markers.');
      } else {
        setModeIndicator(false);
        showToast('Edit mode deactivated.');
      }
      renderMarkers();
    });

    // Share / Export Button
    document.getElementById('tool-export-btn').addEventListener('click', () => {
      openModal('modal-export');
    });

    document.getElementById('export-download-btn').addEventListener('click', exportConfig);

    document.getElementById('import-browse-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importConfig(e.target.files[0]);
      }
    });

    // Fullscreen Toggle
    document.getElementById('tool-fullscreen-btn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Cancel mode button
    document.getElementById('cancel-mode-btn').addEventListener('click', cancelActiveMode);

    // Modal Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close');
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('open');
      });
    });

    // Marker Save & Delete
    document.getElementById('marker-save-btn').addEventListener('click', () => {
      const id = document.getElementById('marker-edit-id').value;
      const x = parseFloat(document.getElementById('marker-edit-x').value);
      const y = parseFloat(document.getElementById('marker-edit-y').value);
      const title = document.getElementById('marker-input-title').value.trim() || 'Custom Waypoint';
      const type = document.getElementById('marker-input-type').value;
      const desc = document.getElementById('marker-input-desc').value.trim();

      saveCustomMarker({
        id: id,
        map: currentMap.id,
        x: x,
        y: y,
        title: title,
        type: type,
        desc: desc
      });

      closeAllModals();
    });

    document.getElementById('marker-delete-btn').addEventListener('click', () => {
      const id = document.getElementById('marker-edit-id').value;
      if (id) {
        deleteCustomMarker(id);
        closeAllModals();
      }
    });

    // Full Map View Button
    const fullMapBtn = document.getElementById('full-map-view-btn');
    if (fullMapBtn) {
      fullMapBtn.addEventListener('click', () => {
        fitMapToScreen(true);
        showToast('Reset to Full Map View');
      });
    }

    // Toggle Sidebar HUD Button
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const sidebarEl = document.getElementById('sidebar');
    const toggleText = document.getElementById('sidebar-toggle-text');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    if (toggleSidebarBtn && sidebarEl) {
      toggleSidebarBtn.addEventListener('click', () => {
        sidebarEl.classList.toggle('collapsed');
        const isCollapsed = sidebarEl.classList.contains('collapsed');
        if (toggleText) toggleText.textContent = isCollapsed ? 'Show HUD' : 'Hide HUD';
        if (toggleIcon) toggleIcon.textContent = isCollapsed ? '▶' : '◀';
        setTimeout(() => fitMapToScreen(true), 280);
      });
    }

    window.addEventListener('resize', () => {
      fitMapToScreen(false);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        closeAllModals();
        cancelActiveMode();
      } else if (e.key === 'c' || e.key === 'C') {
        clearMeasurement();
        showToast('Cleared Mortar and Target');
      } else if (e.key === 'm' || e.key === 'M') {
        fitMapToScreen(true);
        showToast('Full Map View (M)');
      } else if (e.key === 'h' || e.key === 'H') {
        if (toggleSidebarBtn) toggleSidebarBtn.click();
      } else if (e.key === 'e' || e.key === 'E') {
        document.getElementById('tool-editmode-btn').click();
      } else if (e.key === 'g' || e.key === 'G') {
        toggleTacticalGrid();
      } else if (e.key === 'f' || e.key === 'F') {
        document.getElementById('tool-flightpath-btn').click();
      } else if (e.key === 'r' || e.key === 'R') {
        if (window.PUBG_REPLAY) {
          window.PUBG_REPLAY.switchSidebarTab('replay');
        }
      }
    });
  }

  // Export interface for replay engine and integrations
  window.PUBG_APP = {
    getMap: () => currentMap,
    getLeafletMap: () => leafletMap,
    getMaps: () => PUBG_MAPS,
    loadMap: (config) => {
      document.querySelectorAll('.map-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-map') === config.id);
      });
      loadMap(config);
    },
    clearMeasurement: clearMeasurement,
    showToast: showToast
  };

  // Launch app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
