/* pubg.sh 2D Match Replay & Full Player/Squad Roster Integration */

(function () {
  'use strict';


  // Map ID Normalization from PUBG Telemetry / API mapName to local maps
  const PUBG_MAP_ID_MAP = {
    'Tiger_Main': 'taego',
    'Baltic_Main': 'erangel',
    'Erangel_Main': 'erangel',
    'Desert_Main': 'miramar',
    'Savage_Main': 'sanhok',
    'DihorOtok_Main': 'vikendi',
    'Kiki_Main': 'deston',
    'Neon_Main': 'rondo',
    'Chimera_Main': 'karakin',
    'Summerland_Main': 'karakin',
    'Heaven_Main': 'paramo',
    'Paramo': 'paramo'
  };

  const PUBG_MAP_DISPLAY_NAMES = {
    'Tiger_Main': 'Taego',
    'Baltic_Main': 'Erangel',
    'Erangel_Main': 'Erangel',
    'Desert_Main': 'Miramar',
    'Savage_Main': 'Sanhok',
    'DihorOtok_Main': 'Vikendi',
    'Kiki_Main': 'Deston',
    'Neon_Main': 'Rondo',
    'Chimera_Main': 'Karakin',
    'Summerland_Main': 'Karakin',
    'Heaven_Main': 'Paramo'
  };

  // Friendly PUBG Weapon Name Lookup
  function formatPubgWeapon(raw) {
    if (!raw) return 'Unknown';
    const clean = raw.replace(/^Weap/, '').replace(/^Proj/, '').replace(/_C(_0)?$/, '').replace(/^Item_/, '');
    const map = {
      'HK416': 'M416',
      'BerylM762': 'Beryl M762',
      'AK47': 'AKM',
      'FNFal': 'SLR',
      'Saiga12': 'S12K',
      'Berreta686': 'S686',
      'Winchester': 'Win94',
      'Kar98k': 'Kar98k',
      'M24': 'M24',
      'AWM': 'AWM',
      'Mk12': 'Mk12',
      'Mk14': 'Mk14',
      'Mini14': 'Mini14',
      'SCAR-L': 'SCAR-L',
      'ACE32': 'ACE32',
      'AUG': 'AUG',
      'M16A4': 'M16A4',
      'G36C': 'G36C',
      'QBZ95': 'QBZ',
      'K2': 'K2',
      'UMP': 'UMP45',
      'Vector': 'Vector',
      'Thompson': 'Tommy Gun',
      'UZI': 'Micro UZI',
      'MP5K': 'MP5K',
      'P90': 'P90',
      'DP28': 'DP-28',
      'M249': 'M249',
      'MG3': 'MG3',
      'RPD': 'RPD',
      'DSR': 'DSR-1',
      'Dragunov': 'Dragunov',
      'PanzerFaust100M': 'Panzerfaust',
      'Mortar': 'Mortar',
      'Crossbow': 'Crossbow',
      'Grenade': 'Frag Grenade',
      'Molotov': 'Molotov',
      'FlashBang': 'Stun Grenade',
      'SmokeBomb': 'Smoke Grenade',
      'C4': 'C4',
      'BluezoneBomb': 'Bluezone Grenade',
      'Sawnoff': 'Sawed-Off',
      'Rhino': 'R45',
      'NagantM1895': 'R1895',
      'M1911': 'P1911',
      'G18': 'P18C',
      'M9': 'P92',
      'Deagle': 'Desert Eagle',
      'TslGameModeBase_BattleRoyaleBP': 'Blue Zone',
      'Damage_BlueZone': 'Blue Zone',
      'Damage_Drown': 'Drowned',
      'Damage_Gun': 'Gunshot',
      'Uaz_B_01': 'UAZ',
      'Dacia_01': 'Dacia',
      'Buggy_01': 'Buggy',
      'Motorbike_01': 'Motorcycle',
      'Mirado_01': 'Mirado',
      'PickUp_01': 'Pickup Truck',
      'CoupeRB_01': 'Coupe RB',
      'Porter_01': 'Porter',
      'PonyCoupe_01': 'Pony Coupe',
      'Boat_PG117_01': 'PG-117 Speedboat',
      'Aquarail_01': 'Aquarail',
      'Airboat_01': 'Airboat'
    };
    return map[clean] || clean;
  }

  // Format seconds to mm:ss
  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Format seconds to mm:ss.s (pubg.sh precision)
  function formatTimePrecise(sec) {
    if (isNaN(sec) || sec < 0) return '00:00.0';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const tenths = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${tenths}`;
  }

  // Format Match Date e.g. "Sep 25th 8:14 am"
  function formatMatchDate(isoStr) {
    if (!isoStr) return 'Match Replay';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'Match Replay';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = d.getDate();
      const nth = (day === 1 || day === 21 || day === 31) ? 'st' : ((day === 2 || day === 22) ? 'nd' : ((day === 3 || day === 23) ? 'rd' : 'th'));
      let hours = d.getHours();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${month} ${day}${nth} ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return 'Match Replay';
    }
  }

  // Format Placement Rank e.g. "1st place"
  function formatRankPlacement(rank) {
    if (!rank || rank > 100) return 'Finished';
    if (rank === 1) return '1st place';
    if (rank === 2) return '2nd place';
    if (rank === 3) return '3rd place';
    return `${rank}th place`;
  }

  // REPLAY ENGINE STATE
  const state = {
    isReplayActive: false,
    isPlaying: false,
    currentTime: 0,
    maxDuration: 0,
    playbackSpeed: 1,
    lastFrameTime: null,
    animationFrameId: null,

    // Platform and search
    selectedShard: 'steam',
    searchedPlayerName: '',
    currentMatches: [],
    activeFilter: 'all',
    dateFilterDays: 0, // 0 = All Time, 1 = Today (24h), 7 = 7 Days, 30 = 30 Days, or custom slider days
    profileDateFilterDays: 0, // 0 = All Time, 1 = Today (24h), 7 = 7 Days, 30 = 30 Days for profile stats

    // Krafton Official API Data
    playerProfile: null,
    playerClan: null,
    lifetimeStats: null,
    rankedStats: null,
    activeProfileMode: 'squad',

    // Current Match & Roster
    currentMatch: null,
    focusPlayerName: '',
    focusTeamId: null,
    theme: localStorage.getItem('pubg_replay_theme') || 'new', // 'new' (minimalist white) or 'old' (tactical neon)
    squads: [], // sorted list of squads { teamId, rank, members: [playerObj] }

    // Parsed telemetry
    players: {}, // playerName -> { name, teamId, kills, rank, deadAt, killer, positions: [{ t, x, y, health, inVehicle }] }
    circles: [], // [{ t, safeX, safeY, safeRadius, blueX, blueY, blueRadius, alivePlayers }]
    kills: [], // [{ t, killer, victim, weapon, distance, victimX, victimY, killerX, killerY }]
    damages: [], // [{ t, attacker, victim, weapon, damage, ax, ay, vx, vy }]
    carePackages: [], // [{ t, x, y, state, items }]
    flightPath: null, // { startTime, endTime, vx, vy, bearing, waypoints }

    // Leaflet Layers
    replayLayerGroup: null,
    circleSafe: null,
    circleBlue: null,
    circleRed: null,
    trailPolyline: null,
    flightPolyline: null,
    planeDotMarker: null,
    tracerLayerGroup: null,
    playerMarkers: new Map(), // name -> L.marker
    killMarkers: [], // [{ t, marker, added }]
    carePackageMarkers: [] // [{ t, marker, added }]
  };

  // PUBG Unreal Engine Coordinate Sizes (cm) matching official pubg.sh standard
  const PUBG_MAP_UNREAL_SIZES = {
    // Krafton internal asset names
    'Baltic_Main': 816000,
    'Erangel_Main': 816000,
    'Desert_Main': 816000,
    'Savage_Main': 408000,
    'DihorOtok_Main': 816000,
    'Tiger_Main': 816000,
    'Kiki_Main': 816000,
    'Neon_Main': 816000,
    'Chimera_Main': 306000,
    'Summerland_Main': 204000,
    'Heaven_Main': 102000,
    'Paramo': 306000,
    // App map keys
    'erangel': 816000,
    'miramar': 816000,
    'taego': 816000,
    'deston': 816000,
    'rondo': 816000,
    'vikendi': 816000,
    'sanhok': 408000,
    'karakin': 204000,
    'paramo': 306000
  };

  function getUnrealMapSize(mapSize) {
    const rawMapName = state.currentMatch?.mapName || '';
    return PUBG_MAP_UNREAL_SIZES[rawMapName] || (mapSize * 100);
  }

  // Convert PUBG Telemetry Unreal coordinates (cm) to Leaflet CRS.Simple
  // Uses exact pubg.sh canvas-math formula: (unreal / unrealMapSize) * mapSize * (unrealMapSize === 816000 ? 0.99609375 : 1)
  function toLeafletLatLng(unrealX, unrealY, mapSize) {
    const rawMapName = state.currentMatch?.mapName || '';
    const unrealMapSize = PUBG_MAP_UNREAL_SIZES[rawMapName] || (mapSize * 100);
    const scaleRatio = (unrealMapSize === 816000) ? 0.99609375 : 1.0;
    const normX = Math.max(0, Math.min(1, (unrealX / unrealMapSize) * scaleRatio));
    const normY = Math.max(0, Math.min(1, (unrealY / unrealMapSize) * scaleRatio));
    const lng = normX * mapSize;
    const lat = (1.0 - normY) * mapSize;
    return L.latLng(lat, lng);
  }

  // Convert PUBG Telemetry Unreal circle radius (cm) to Leaflet CRS.Simple (meters)
  function toLeafletRadius(unrealRadius, mapSize) {
    if (!unrealRadius || unrealRadius <= 0) return 0;
    const rawMapName = state.currentMatch?.mapName || '';
    const unrealMapSize = PUBG_MAP_UNREAL_SIZES[rawMapName] || (mapSize * 100);
    const scaleRatio = (unrealMapSize === 816000) ? 0.99609375 : 1.0;
    return (unrealRadius / unrealMapSize) * scaleRatio * mapSize;
  }

  // Calculate exact border intersections of the flight line with the square map [0, mapSize]
  function getMapBorderIntersections(meanX, meanY, vx, vy, mapSize) {
    const candidates = [];
    if (Math.abs(vx) > 0.0001) {
      const dt0 = (0 - meanX) / vx;
      const y0 = meanY + vy * dt0;
      if (y0 >= -100 && y0 <= mapSize + 100) {
        candidates.push({ dt: dt0, x: 0, y: Math.max(0, Math.min(mapSize, y0)) });
      }
      const dtW = (mapSize - meanX) / vx;
      const yW = meanY + vy * dtW;
      if (yW >= -100 && yW <= mapSize + 100) {
        candidates.push({ dt: dtW, x: mapSize, y: Math.max(0, Math.min(mapSize, yW)) });
      }
    }
    if (Math.abs(vy) > 0.0001) {
      const dt0 = (0 - meanY) / vy;
      const x0 = meanX + vx * dt0;
      if (x0 >= -100 && x0 <= mapSize + 100) {
        candidates.push({ dt: dt0, x: Math.max(0, Math.min(mapSize, x0)), y: 0 });
      }
      const dtH = (mapSize - meanY) / vy;
      const xH = meanX + vx * dtH;
      if (xH >= -100 && xH <= mapSize + 100) {
        candidates.push({ dt: dtH, x: Math.max(0, Math.min(mapSize, xH)), y: mapSize });
      }
    }
    candidates.sort((a, b) => a.dt - b.dt);
    if (candidates.length >= 2) {
      return {
        entry: candidates[0],
        exit: candidates[candidates.length - 1]
      };
    }
    return null;
  }

  // Official Krafton PUBG Developer API with Smart Client Cache
  const KRAFTON_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwMmVhZDk2MC05YWMzLTAxM2YtNTY3MS00YTAwMGQxY2I3NjQiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNzkwMzA4NTg5LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6Ii1hOGY5M2JlYS1hMTBmLTQ1YTMtYmFjYy00MDk3YjU2ZTNkZGMifQ.Z1RkfLvS9PEGcNROrYIPBZcERLZgYa4hn9Oh6vdSdxc';

  const KRAFTON_CACHE = {
    get(key, maxAgeMs = 30 * 60 * 1000) {
      try {
        const item = localStorage.getItem('kcache_' + key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.ts > maxAgeMs) return null;
        return parsed.data;
      } catch (e) {
        return null;
      }
    },
    getStale(key) {
      try {
        const item = localStorage.getItem('kcache_' + key);
        if (!item) return null;
        return JSON.parse(item).data;
      } catch (e) {
        return null;
      }
    },
    set(key, data) {
      try {
        localStorage.setItem('kcache_' + key, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {}
    }
  };

  async function fetchKraftonApi(endpoint, shardId = 'steam', maxAgeMs = 30 * 60 * 1000) {
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const cacheKey = `${shardId}_${cleanEndpoint}`;

    // 1. Check cache first
    const cached = KRAFTON_CACHE.get(cacheKey, maxAgeMs);
    if (cached) return cached;

    const url = `https://api.pubg.com/shards/${shardId}/${cleanEndpoint}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KRAFTON_API_KEY}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (!res.ok) {
        if (res.status === 429) {
          // If rate limited, fall back to any stale cache
          const stale = KRAFTON_CACHE.getStale(cacheKey);
          if (stale) return stale;
          throw new Error('Krafton API rate limit (10 req/min). Please wait a moment.');
        }
        if (res.status === 404) {
          throw new Error('Player/Resource not found on official Krafton API.');
        }
        throw new Error(`Krafton API Error (${res.status})`);
      }

      const data = await res.json();
      KRAFTON_CACHE.set(cacheKey, data);
      return data;
    } catch (err) {
      const stale = KRAFTON_CACHE.getStale(cacheKey);
      if (stale) return stale;
      throw err;
    }
  }

  // Fetch Official Player Profile
  async function fetchKraftonPlayer(playerName, shardId = 'steam') {
    const json = await fetchKraftonApi(`players?filter[playerNames]=${encodeURIComponent(playerName)}`, shardId);
    if (!json.data || json.data.length === 0) {
      throw new Error(`Player "${playerName}" not found on platform ${shardId.toUpperCase()}`);
    }
    return json.data[0];
  }

  // Fetch Official Clan Info
  async function fetchKraftonClan(clanId, shardId = 'steam') {
    if (!clanId) return null;
    try {
      const json = await fetchKraftonApi(`clans/${clanId}`, shardId);
      return json.data ? json.data.attributes : null;
    } catch (e) {
      console.warn('Clan lookup failed:', e.message);
      return null;
    }
  }

  // Fetch Official Lifetime Career Stats
  async function fetchKraftonLifetimeStats(accountId, shardId = 'steam') {
    try {
      const json = await fetchKraftonApi(`players/${accountId}/seasons/lifetime`, shardId);
      return json.data?.attributes?.gameModeStats || null;
    } catch (e) {
      console.warn('Lifetime stats lookup failed:', e.message);
      return null;
    }
  }

  // Fetch Official Ranked Stats for Current Season
  async function fetchKraftonRankedStats(accountId, shardId = 'steam') {
    try {
      const seasonsJson = await fetchKraftonApi('seasons', shardId);
      const curSeason = seasonsJson.data?.find(s => s.attributes?.isCurrentSeason);
      if (!curSeason) return null;
      const rankedJson = await fetchKraftonApi(`players/${accountId}/seasons/${curSeason.id}/ranked`, shardId);
      return rankedJson.data?.attributes?.rankedGameModeStats || null;
    } catch (e) {
      console.warn('Ranked stats lookup failed:', e.message);
      return null;
    }
  }

  // Fetch Official Survival Mastery (Player Level & Prestige Tier)
  async function fetchKraftonSurvivalMastery(accountId, shardId = 'steam') {
    if (!accountId) return null;
    try {
      const json = await fetchKraftonApi(`players/${accountId}/survival_mastery`, shardId);
      return json.data ? json.data.attributes : null;
    } catch (e) {
      console.warn('Survival mastery lookup failed:', e.message);
      return null;
    }
  }

  // Get authentic PUBG Tier Badge Icon for Tiers 1 through 5
  function getSurvivalTierIcon(tier = 1) {
    const t = Math.max(1, Math.min(5, parseInt(tier, 10) || 1));
    if (t === 2) return 'assets/tier_2.png';
    return `assets/tier_${t}.svg`;
  }

  // Fetch Official Match Details (including direct CDN Telemetry asset URL)
  async function fetchKraftonMatch(matchId, shardId = 'steam') {
    const json = await fetchKraftonApi(`matches/${matchId}`, shardId);
    return json;
  }

  // Fetch Recent Official Krafton Matches directly with real-time matchType & telemetry CDN URLs
  async function fetchRecentKraftonMatches(kPlayer, shardId = 'steam', count = 10) {
    if (!kPlayer) return [];
    const matchRefs = kPlayer.relationships?.matches?.data || [];
    if (matchRefs.length === 0) return [];

    const topRefs = matchRefs.slice(0, count);
    const results = await Promise.all(
      topRefs.map(ref => fetchKraftonMatch(ref.id, shardId).catch(err => {
        console.warn(`Failed to fetch match ${ref.id}:`, err.message);
        return null;
      }))
    );

    const playerNameLower = (kPlayer.attributes?.name || '').toLowerCase();
    const playerId = kPlayer.id;
    const parsedMatches = [];

    for (const res of results) {
      if (!res || !res.data) continue;
      const mData = res.data;
      const matchId = mData.id;
      const matchAttrs = mData.attributes || {};
      const matchType = matchAttrs.matchType || 'official';
      const gameMode = matchAttrs.gameMode || 'squad';
      const playedAt = matchAttrs.createdAt || new Date().toISOString();
      const mapName = matchAttrs.mapName || 'Baltic_Main';
      const durationSeconds = matchAttrs.duration || 1800;

      // Extract telemetry asset URL
      let telemetryUrl = null;
      const assetRefs = mData.relationships?.assets?.data || [];
      if (assetRefs.length > 0 && Array.isArray(res.included)) {
        const assetId = assetRefs[0].id;
        const assetObj = res.included.find(inc => inc.type === 'asset' && inc.id === assetId);
        if (assetObj?.attributes?.URL) {
          telemetryUrl = assetObj.attributes.URL;
        }
      }

      // Extract full participant stats for this player and squad roster
      let pStats = { kills: 0, winPlace: 100, damageDealt: 0 };
      let squad = [];
      let playerParticipantId = null;

      if (Array.isArray(res.included)) {
        const participant = res.included.find(inc =>
          inc.type === 'participant' &&
          (((inc.attributes?.stats?.name || '').toLowerCase() === playerNameLower) ||
           (inc.attributes?.stats?.playerId === playerId))
        );
        if (participant?.attributes?.stats) {
          playerParticipantId = participant.id;
          pStats = { ...participant.attributes.stats };
        }

        // Find squad roster and teammates
        if (playerParticipantId) {
          const roster = res.included.find(x => x.type === 'roster' && x.relationships?.participants?.data?.some(d => d.id === playerParticipantId));
          if (roster) {
            const teammateIds = new Set((roster.relationships?.participants?.data || []).map(d => d.id));
            squad = res.included
              .filter(x => x.type === 'participant' && teammateIds.has(x.id))
              .map(tp => ({
                id: tp.id,
                name: tp.attributes?.stats?.name || 'Unknown',
                kills: tp.attributes?.stats?.kills || 0,
                damageDealt: Math.round(tp.attributes?.stats?.damageDealt || 0),
                dBNOs: tp.attributes?.stats?.DBNOs || tp.attributes?.stats?.dBNOs || 0,
                assists: tp.attributes?.stats?.assists || 0,
                revives: tp.attributes?.stats?.revives || 0,
                timeSurvived: tp.attributes?.stats?.timeSurvived || 0,
                deathType: tp.attributes?.stats?.deathType || 'alive',
                isSelf: tp.id === playerParticipantId
              }));
          }
        }
      }

      parsedMatches.push({
        id: matchId,
        shardId: shardId,
        gameMode: gameMode,
        matchType: matchType,
        playedAt: playedAt,
        mapName: mapName,
        durationSeconds: durationSeconds,
        telemetryUrl: telemetryUrl,
        stats: pStats,
        squad: squad,
        isEnriched: true
      });
    }

    return parsedMatches;
  }

  // On-demand enrichment for any match (e.g. from pubg.sh) to fetch full Krafton participant and roster stats
  async function enrichMatchWithKraftonData(match, shardId = state.selectedShard || 'steam') {
    if (!match || match.isEnriched || (match.stats && match.stats.damageDealt !== undefined && match.squad)) {
      return match;
    }
    try {
      const matchData = await fetchKraftonMatch(match.id, shardId);
      const playerNameLower = (state.searchedPlayerName || '').toLowerCase();
      const playerId = state.playerProfile?.id;

      if (Array.isArray(matchData.included)) {
        const participant = matchData.included.find(inc =>
          inc.type === 'participant' &&
          (((inc.attributes?.stats?.name || '').toLowerCase() === playerNameLower) ||
           (inc.attributes?.stats?.playerId === playerId))
        );
        if (participant?.attributes?.stats) {
          match.stats = { ...match.stats, ...participant.attributes.stats };
          const roster = matchData.included.find(x => x.type === 'roster' && x.relationships?.participants?.data?.some(d => d.id === participant.id));
          if (roster) {
            const teammateIds = new Set((roster.relationships?.participants?.data || []).map(d => d.id));
            match.squad = matchData.included
              .filter(x => x.type === 'participant' && teammateIds.has(x.id))
              .map(tp => ({
                id: tp.id,
                name: tp.attributes?.stats?.name || 'Unknown',
                kills: tp.attributes?.stats?.kills || 0,
                damageDealt: Math.round(tp.attributes?.stats?.damageDealt || 0),
                dBNOs: tp.attributes?.stats?.DBNOs || tp.attributes?.stats?.dBNOs || 0,
                assists: tp.attributes?.stats?.assists || 0,
                revives: tp.attributes?.stats?.revives || 0,
                timeSurvived: tp.attributes?.stats?.timeSurvived || 0,
                deathType: tp.attributes?.stats?.deathType || 'alive',
                isSelf: tp.id === participant.id
              }));
          }
        }
      }
      match.isEnriched = true;
    } catch (e) {
      console.warn(`Could not enrich match ${match.id}:`, e.message);
    }
    return match;
  }

  // GraphQL Client for pubg.sh
  async function fetchPubgShPlayerMatches(playerName, shardId = 'steam') {
    const query = `
      query GetPlayer($name: String!, $shardId: String!) {
        player(name: $name, shardId: $shardId) {
          id
          name
          lastFetchedAt
          matches {
            id
            shardId
            gameMode
            playedAt
            mapName
            durationSeconds
            telemetryUrl
            stats {
              kills
              winPlace
            }
          }
        }
      }
    `;

    const res = await fetch('https://api.pubg.sh/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        variables: { name: playerName, shardId: shardId }
      })
    });

    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || 'GraphQL Error');
    }
    if (!data.data || !data.data.player) {
      throw new Error(`Player "${playerName}" not found on platform ${shardId.toUpperCase()}`);
    }
    return data.data.player;
  }

  // Parse Armor, Helmet, and Backpack gear tiers
  function parseGearItem(itemId) {
    if (!itemId) return null;
    const clean = itemId.replace(/^Item_/, '');
    if (clean.includes('Head')) {
      const lv = clean.includes('Lv3') ? 3 : (clean.includes('Lv2') ? 2 : 1);
      const names = { 1: 'Motorcycle Helmet', 2: 'Military Helmet', 3: 'Spetsnaz Helmet' };
      return { type: 'helmet', level: lv, name: `Lv.${lv} ${names[lv] || 'Helmet'}` };
    }
    if (clean.includes('Armor')) {
      const lv = clean.includes('Lv3') ? 3 : (clean.includes('Lv2') ? 2 : 1);
      const names = { 1: 'Police Vest', 2: 'Police Vest', 3: 'Military Vest' };
      return { type: 'vest', level: lv, name: `Lv.${lv} ${names[lv] || 'Vest'}` };
    }
    if (clean.includes('Back')) {
      const lv = clean.includes('Lv3') ? 3 : (clean.includes('Lv2') ? 2 : 1);
      return { type: 'backpack', level: lv, name: `Lv.${lv} Backpack` };
    }
    return null;
  }

  // Parse Telemetry JSON from Krafton CDN
  function parseTelemetryData(events, focusPlayerName, matchData = null) {
    const matchStart = events.find(e => e._T === 'LogMatchStart');
    const startTime = matchStart ? new Date(matchStart._D).getTime() : 0;

    const players = {};
    const planeJumps = {};
    const planeJumpLocations = {};
    const playerLandingTimes = {};
    const inPlanePoints = [];

    // 1. Initial characters
    if (matchStart && matchStart.characters) {
      matchStart.characters.forEach(c => {
        const char = c.character || c;
        if (char && char.name) {
          const accId = char.accountId || '';
          const isBot = accId.startsWith('ai.') || accId.startsWith('account.ai') || accId.startsWith('npc.');
          players[char.name] = {
            name: char.name,
            teamId: char.teamId,
            accountId: accId,
            isBot: isBot,
            kills: 0,
            rank: 999,
            deadAt: null,
            killer: null,
            jumpTime: null,
            gear: { helmet: null, vest: null, backpack: null },
            weapons: [],
            boost: 0,
            damageDealt: 0,
            headshots: 0,
            longestKill: 0,
            longestKillWeapon: '',
            positions: []
          };
        }
      });
    }

    // 2. Scan TransportAircraft Jumps & Parachute Events
    events.forEach(e => {
      // Discard all pre-match lobby events before LogMatchStart
      if (e._D && startTime && new Date(e._D).getTime() < startTime) return;

      let t = e.elapsedTime;
      if (t === undefined && e._D && startTime) {
        t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
      }

      const pName = e.character && e.character.name;
      if (!pName) return;

      // Primary: LogVehicleLeave from TransportAircraft (strictly initial match drop phase t <= 85)
      if (e._T === 'LogVehicleLeave' && e.vehicle && e.vehicle.vehicleType === 'TransportAircraft' && t <= 85) {
        if (planeJumps[pName] === undefined || t < planeJumps[pName]) {
          planeJumps[pName] = t;
        }
        if (e.character && e.character.location) {
          const loc = e.character.location;
          if (loc.x !== 0 || loc.y !== 0) {
            inPlanePoints.push({
              t: t,
              x: loc.x,
              y: loc.y,
              z: loc.z || 0
            });
            if (!planeJumpLocations[pName]) {
              planeJumpLocations[pName] = { t: t, x: loc.x, y: loc.y, z: loc.z || 0 };
            }
          }
        }
      }

      // Fallback: LogParachuteLanding (initial drop landings occur at t <= 140)
      if (e._T === 'LogParachuteLanding' && t <= 140) {
        if (planeJumps[pName] === undefined) {
          planeJumps[pName] = Math.max(0, t - 20);
        }
        playerLandingTimes[pName] = t;
      }
    });

    // 3. Player positions
    events.forEach(e => {
      // Discard pre-match lobby positions
      if (e._D && startTime && new Date(e._D).getTime() < startTime) return;

      if (e._T === 'LogPlayerPosition' && e.character) {
        const c = e.character;
        const name = c.name;
        if (!players[name]) {
          const accId = c.accountId || '';
          const isBot = accId.startsWith('ai.') || accId.startsWith('account.ai') || accId.startsWith('npc.');
          players[name] = {
            name: name,
            teamId: c.teamId,
            accountId: accId,
            isBot: isBot,
            kills: 0,
            rank: 999,
            deadAt: null,
            killer: null,
            jumpTime: null,
            gear: { helmet: null, vest: null, backpack: null },
            weapons: [],
            boost: 0,
            damageDealt: 0,
            headshots: 0,
            longestKill: 0,
            longestKillWeapon: '',
            positions: []
          };
        }

        let t = e.elapsedTime;
        if (t === undefined && e._D && startTime) {
          t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
        }

        const z = c.location ? c.location.z : 0;
        const isAircraft = (e.vehicle && (e.vehicle.vehicleType === 'TransportAircraft' || e.vehicle.vehicleId === 'TransportAircraft'));
        const jumpT = planeJumps[name];
        // IN-PLANE is strictly valid ONLY during the initial match drop phase (t <= 85)
        const isInPlane = (t <= 85) && (isAircraft || (jumpT !== undefined ? t < jumpT : (t < 40 && z > 30000)));

        if (isInPlane && c.location && (c.location.x !== 0 || c.location.y !== 0)) {
          inPlanePoints.push({
            t: t,
            x: c.location.x,
            y: c.location.y,
            z: z
          });
        }

        players[name].positions.push({
          t: t,
          x: c.location.x,
          y: c.location.y,
          z: z,
          health: c.health,
          inPlane: isInPlane,
          inVehicle: !!(e.vehicle && e.vehicle.vehicleType !== 'TransportAircraft')
        });
      }

      // Equipment, Weapon loadout, and Boost telemetry
      if (e._T === 'LogItemEquip' && e.character && e.item) {
        const name = e.character.name;
        if (players[name]) {
          const gear = parseGearItem(e.item.itemId);
          if (gear) {
            players[name].gear[gear.type] = gear;
          } else if (e.item.category === 'Weapon') {
            const wName = formatPubgWeapon(e.item.itemId);
            if (!players[name].weapons.includes(wName)) {
              players[name].weapons.push(wName);
              if (players[name].weapons.length > 3) players[name].weapons.shift();
            }
          }
        }
      }
      if (e._T === 'LogItemUnequip' && e.character && e.item) {
        const name = e.character.name;
        if (players[name]) {
          const gear = parseGearItem(e.item.itemId);
          if (gear && players[name].gear[gear.type] && players[name].gear[gear.type].level === gear.level) {
            players[name].gear[gear.type] = null;
          }
        }
      }
      if (e._T === 'LogItemUse' && e.character && e.item) {
        const name = e.character.name;
        if (players[name]) {
          const id = e.item.itemId || '';
          if (id.includes('EnergyDrink')) players[name].boost = Math.min(100, (players[name].boost || 0) + 40);
          else if (id.includes('PainKiller')) players[name].boost = Math.min(100, (players[name].boost || 0) + 60);
          else if (id.includes('AdrenalineSyringe')) players[name].boost = 100;
        }
      }
    });

    // Sort and strictly deduplicate positions by time for each player to guarantee monotonic interpolation
    Object.keys(players).forEach(k => {
      const p = players[k];
      p.positions.sort((a, b) => a.t - b.t);

      const deduped = [];
      p.positions.forEach(pos => {
        const last = deduped[deduped.length - 1];
        if (!last || last.t !== pos.t) {
          deduped.push({ ...pos });
        } else {
          // If multiple packets at same second, merge with non-zero location and newest health
          if (pos.x !== 0 || pos.y !== 0) {
            last.x = pos.x;
            last.y = pos.y;
            last.z = pos.z;
          }
          last.health = pos.health;
          last.inVehicle = last.inVehicle || pos.inVehicle;
          last.inPlane = pos.inPlane;
        }
      });
      p.positions = deduped;
    });

    // Extract Flight Path strictly from initial drop points (5 <= t <= 85)
    const validInPlane = inPlanePoints.filter(p => p.t >= 5 && p.t <= 85 && (p.x !== 0 || p.y !== 0));
    const planeByT = {};
    validInPlane.forEach(p => {
      if (!planeByT[p.t]) planeByT[p.t] = [];
      planeByT[p.t].push(p);
    });

    const pTimes = Object.keys(planeByT).map(Number).sort((a, b) => a - b);
    let flightPath = null;
    if (pTimes.length >= 2) {
      const waypoints = pTimes.map(t => ({
        t,
        x: Math.round(planeByT[t].reduce((s, p) => s + p.x, 0) / planeByT[t].length),
        y: Math.round(planeByT[t].reduce((s, p) => s + p.y, 0) / planeByT[t].length)
      }));

      const n = waypoints.length;
      const meanT = waypoints.reduce((s, w) => s + w.t, 0) / n;
      const meanX = waypoints.reduce((s, w) => s + w.x, 0) / n;
      const meanY = waypoints.reduce((s, w) => s + w.y, 0) / n;

      let numX = 0, numY = 0, denT = 0;
      waypoints.forEach(w => {
        const dt = w.t - meanT;
        numX += dt * (w.x - meanX);
        numY += dt * (w.y - meanY);
        denT += dt * dt;
      });

      const vx = denT > 0.001 ? numX / denT : (waypoints[n - 1].x - waypoints[0].x) / ((waypoints[n - 1].t - waypoints[0].t) || 1);
      const vy = denT > 0.001 ? numY / denT : (waypoints[n - 1].y - waypoints[0].y) / ((waypoints[n - 1].t - waypoints[0].t) || 1);
      const bearing = (Math.atan2(vx, -vy) * 180 / Math.PI + 360) % 360;

      const getPlanePos = (t) => ({
        t: t,
        x: Math.round(meanX + vx * (t - meanT)),
        y: Math.round(meanY + vy * (t - meanT))
      });

      const rawMapName = matchData?.mapName || '';
      const unrealMapSize = PUBG_MAP_UNREAL_SIZES[rawMapName] || 816000;
      const borders = getMapBorderIntersections(meanX, meanY, vx, vy, unrealMapSize);

      // Determine flight start and end times across map bounds
      let startTime = Math.max(0, waypoints[0].t - 5);
      let endTime = Math.min(85, waypoints[n - 1].t + 10);

      if (borders && borders.entry && borders.exit) {
        let t0, t1;
        if (Math.abs(vx) >= Math.abs(vy) && Math.abs(vx) > 0.01) {
          t0 = Math.round(meanT + (borders.entry.x - meanX) / vx);
          t1 = Math.round(meanT + (borders.exit.x - meanX) / vx);
        } else if (Math.abs(vy) > 0.01) {
          t0 = Math.round(meanT + (borders.entry.y - meanY) / vy);
          t1 = Math.round(meanT + (borders.exit.y - meanY) / vy);
        }
        if (t0 !== undefined && t1 !== undefined) {
          const enterT = Math.min(t0, t1);
          const exitT = Math.max(t0, t1);
          startTime = Math.max(0, Math.min(20, enterT));
          endTime = Math.max(startTime + 30, Math.min(85, exitT));
        }
      }

      // Parachute landings: strictly from initial drop phase (capped at 140s max)
      const validLandings = Object.values(playerLandingTimes).filter(t => t >= 20 && t <= 140);
      let allLandedTime = validLandings.length > 0
        ? Math.min(140, Math.max(...validLandings) + 5)
        : Math.min(130, endTime + 35);
      allLandedTime = Math.max(endTime + 10, allLandedTime);

      flightPath = {
        startTime,
        endTime,
        allLandedTime,
        meanX,
        meanY,
        meanT,
        vx,
        vy,
        bearing,
        borderEntry: borders ? borders.entry : null,
        borderExit: borders ? borders.exit : null,
        waypoints,
        getPlanePos
      };
    }

    // Assign jump times and guarantee every initial jumping player starts directly on the flight path
    Object.keys(players).forEach(k => {
      const p = players[k];
      if (planeJumps[k] !== undefined && planeJumps[k] <= 85) {
        p.jumpTime = planeJumps[k];
      } else {
        const firstGround = p.positions.find(pos => !pos.inPlane && pos.t > 0 && pos.t <= 90);
        p.jumpTime = firstGround ? firstGround.t : null;
      }

      if (p.jumpTime !== null && p.jumpTime <= 85) {
        const jumpPos = (flightPath && flightPath.getPlanePos) ? flightPath.getPlanePos(p.jumpTime) : planeJumpLocations[k];
        if (jumpPos) {
          const existing = p.positions.find(pos => pos.t === p.jumpTime);
          if (!existing) {
            p.positions.push({
              t: p.jumpTime,
              x: jumpPos.x,
              y: jumpPos.y,
              z: jumpPos.z || 15000,
              health: 100,
              inPlane: false,
              inVehicle: false
            });
            p.positions.sort((a, b) => a.t - b.t);
          } else {
            existing.x = jumpPos.x;
            existing.y = jumpPos.y;
          }
        }
      }
    });

    // 4. Kills and Deaths
    const kills = [];
    events.forEach(e => {
      if (e._D && startTime && new Date(e._D).getTime() < startTime) return;

      if (e._T === 'LogPlayerKill' || e._T === 'LogPlayerKillV2') {
        let t = 0;
        if (e._D && startTime) {
          t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
        }
        const killerName = (e.killer && e.killer.name) || (e.dBNOMaker && e.dBNOMaker.name) || 'Unknown';
        const victimName = (e.victim && e.victim.name) || 'Unknown';
        const weaponRaw = (e.killerDamageInfo && e.killerDamageInfo.damageCauserName) || (e.finishDamageInfo && e.finishDamageInfo.damageCauserName) || '';
        const dist = (e.killerDamageInfo && e.killerDamageInfo.distance) ? Math.round(e.killerDamageInfo.distance / 100) : 0;

        if (e.killer && players[e.killer.name]) {
          players[e.killer.name].kills++;
          if (dist > (players[e.killer.name].longestKill || 0)) {
            players[e.killer.name].longestKill = dist;
            players[e.killer.name].longestKillWeapon = formatPubgWeapon(weaponRaw);
          }
          const damageReason = (e.killerDamageInfo && e.killerDamageInfo.damageReason) || (e.finishDamageInfo && e.finishDamageInfo.damageReason);
          if (damageReason === 'HeadShot') {
            players[e.killer.name].headshots = (players[e.killer.name].headshots || 0) + 1;
          }
        }
        if (e.victim && players[e.victim.name]) {
          players[e.victim.name].deadAt = t;
          players[e.victim.name].killer = killerName;
          if (e.victimGameResult && e.victimGameResult.rank) {
            players[e.victim.name].rank = e.victimGameResult.rank;
          }
        }

        const vx = e.victim && e.victim.location ? e.victim.location.x : 0;
        const vy = e.victim && e.victim.location ? e.victim.location.y : 0;
        if (vx > 0 || vy > 0) {
          kills.push({
            t: t,
            killer: killerName,
            victim: victimName,
            weapon: formatPubgWeapon(weaponRaw),
            distance: dist,
            victimX: vx,
            victimY: vy,
            killerX: e.killer && e.killer.location ? e.killer.location.x : 0,
            killerY: e.killer && e.killer.location ? e.killer.location.y : 0
          });
        }
      }
    });
    kills.sort((a, b) => a.t - b.t);

    // 5. Bullet / Combat damage events for live tracers
    const damages = [];
    events.forEach(e => {
      if (e._D && startTime && new Date(e._D).getTime() < startTime) return;

      if (e._T === 'LogPlayerTakeDamage' && e.attacker && e.victim) {
        let t = 0;
        if (e._D && startTime) {
          t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
        }
        if (players[e.attacker.name]) {
          players[e.attacker.name].damageDealt = (players[e.attacker.name].damageDealt || 0) + Math.round(e.damage || 0);
        }
        damages.push({
          t: t,
          attacker: e.attacker.name,
          victim: e.victim.name,
          weapon: formatPubgWeapon(e.damageCauserName),
          damage: Math.round(e.damage),
          ax: e.attacker.location ? e.attacker.location.x : 0,
          ay: e.attacker.location ? e.attacker.location.y : 0,
          vx: e.victim.location ? e.victim.location.x : 0,
          vy: e.victim.location ? e.victim.location.y : 0
        });
      }
    });

    // 6. Circles (Blue Zone, Safe Zone, and Red Zone - matching pubg.sh & PUBG API specification)
    const circles = [];
    events.forEach(e => {
      if (e._T === 'LogGameStatePeriodic' && e.gameState) {
        const gs = e.gameState;
        circles.push({
          t: gs.elapsedTime !== undefined ? gs.elapsedTime : 0,
          alivePlayers: gs.numAlivePlayers,
          blueX: gs.safetyZonePosition ? gs.safetyZonePosition.x : 0,
          blueY: gs.safetyZonePosition ? gs.safetyZonePosition.y : 0,
          blueRadius: gs.safetyZoneRadius || 0,
          safeX: gs.poisonGasWarningPosition ? gs.poisonGasWarningPosition.x : 0,
          safeY: gs.poisonGasWarningPosition ? gs.poisonGasWarningPosition.y : 0,
          safeRadius: gs.poisonGasWarningRadius || 0,
          redX: gs.redZonePosition ? gs.redZonePosition.x : 0,
          redY: gs.redZonePosition ? gs.redZonePosition.y : 0,
          redRadius: gs.redZoneRadius || 0
        });
      }
    });
    circles.sort((a, b) => a.t - b.t);

    // 7. Care Packages (Airdrops) - paired via pubg.sh standard algorithm
    const spawnedPackages = [];
    const landedPackages = [];

    events.forEach((e, idx) => {
      if (e._D && startTime && new Date(e._D).getTime() < startTime) return;

      if (e._T === 'LogCarePackageSpawn' && e.itemPackage) {
        let t = e.elapsedTime;
        if (t === undefined && e._D && startTime) {
          t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
        }
        if (t === undefined) t = 0;

        const loc = e.itemPackage.location || {};
        const items = (e.itemPackage.items || []).map(i => {
          const rawId = typeof i === 'string' ? i : (i.itemId || '');
          return formatPubgWeapon(rawId) || rawId;
        });

        spawnedPackages.push({
          key: `spawn_${idx}`,
          t: t,
          x: loc.x || 0,
          y: loc.y || 0,
          items: items,
          landed: false,
          landT: null
        });
      }

      if (e._T === 'LogCarePackageLand' && e.itemPackage) {
        if (e.itemPackage.itemPackageId === 'Uaz_Armored_C') return;

        let t = e.elapsedTime;
        if (t === undefined && e._D && startTime) {
          t = Math.max(0, Math.round((new Date(e._D).getTime() - startTime) / 1000));
        }
        if (t === undefined) t = 0;

        const loc = e.itemPackage.location || {};
        const items = (e.itemPackage.items || []).map(i => {
          const rawId = typeof i === 'string' ? i : (i.itemId || '');
          return formatPubgWeapon(rawId) || rawId;
        });

        landedPackages.push({
          key: `land_${idx}`,
          t: t,
          x: loc.x || 0,
          y: loc.y || 0,
          items: items
        });
      }
    });

    // Pair landed packages with their corresponding spawned package (matching pubg.sh minBy distance)
    const carePackages = [];

    landedPackages.forEach(land => {
      let bestSpawn = null;
      let minDistance = Infinity;

      spawnedPackages.forEach(spawn => {
        if (!spawn.landed && spawn.t <= land.t) {
          const dist = (spawn.x > 0 && land.x > 0)
            ? Math.hypot(spawn.x - land.x, spawn.y - land.y)
            : Math.abs((land.t - 35) - spawn.t) * 100;

          if (dist < minDistance) {
            minDistance = dist;
            bestSpawn = spawn;
          }
        }
      });

      const finalX = (land.x > 1000) ? land.x : (bestSpawn && bestSpawn.x > 1000 ? bestSpawn.x : 0);
      const finalY = (land.y > 1000) ? land.y : (bestSpawn && bestSpawn.y > 1000 ? bestSpawn.y : 0);
      const spawnT = bestSpawn ? bestSpawn.t : Math.max(0, land.t - 35);
      const items = (land.items && land.items.length > 0) ? land.items : (bestSpawn ? bestSpawn.items : []);

      if (bestSpawn) {
        bestSpawn.landed = true;
      }

      // Strictly filter out any uninitialized (0, 0) origin coordinates
      if (finalX > 1000 && finalY > 1000) {
        carePackages.push({
          id: `cp_${Math.round(finalX)}_${Math.round(finalY)}_${land.t}`,
          spawnT: spawnT,
          landT: land.t,
          x: finalX,
          y: finalY,
          items: items
        });
      }
    });

    // Keep valid spawned packages that didn't record a landing event before match end
    spawnedPackages.forEach(spawn => {
      if (!spawn.landed && spawn.x > 1000 && spawn.y > 1000) {
        carePackages.push({
          id: `cp_${Math.round(spawn.x)}_${Math.round(spawn.y)}_${spawn.t}`,
          spawnT: spawn.t,
          landT: spawn.t + 40,
          x: spawn.x,
          y: spawn.y,
          items: spawn.items
        });
      }
    });

    carePackages.sort((a, b) => a.spawnT - b.spawnT);

    // 7b. Resolve true rankings from LogMatchEnd and gameResultOnFinished
    const matchEnd = events.find(e => e._T === 'LogMatchEnd');
    if (matchEnd) {
      if (matchEnd.characters) {
        matchEnd.characters.forEach(c => {
          const char = c.character || c;
          if (char && char.name && players[char.name]) {
            if (char.ranking > 0) players[char.name].rank = char.ranking;
          }
        });
      }
      if (matchEnd.gameResultOnFinished && matchEnd.gameResultOnFinished.results) {
        matchEnd.gameResultOnFinished.results.forEach(res => {
          if (res.teamId && res.rank > 0) {
            Object.values(players).forEach(p => {
              if (p.teamId === res.teamId) p.rank = res.rank;
            });
          }
        });
      }
    }

    // Also apply match stats if available (e.g. from pubg.sh match API)
    if (matchData && matchData.stats && matchData.stats.winPlace > 0) {
      const p = players[focusPlayerName];
      if (p) {
        p.rank = matchData.stats.winPlace;
        if (p.teamId) {
          Object.values(players).forEach(op => {
            if (op.teamId === p.teamId) op.rank = matchData.stats.winPlace;
          });
        }
      }
    }

    // 8. Build Squads Roster
    const teamMap = {};
    Object.values(players).forEach(p => {
      if (!p.teamId) return;
      teamMap[p.teamId] = teamMap[p.teamId] || { teamId: p.teamId, rank: 999, members: [] };
      teamMap[p.teamId].members.push(p);
      if (p.rank > 0 && p.rank < teamMap[p.teamId].rank) {
        teamMap[p.teamId].rank = p.rank;
      }
    });

    const squads = Object.values(teamMap).sort((a, b) => a.rank - b.rank);

    // Identify focus team
    let focusTeamId = null;
    if (players[focusPlayerName]) {
      focusTeamId = players[focusPlayerName].teamId;
    }

    return { players, circles, kills, damages, carePackages, squads, focusTeamId, flightPath };
  }

  // Interpolate airplane flight position at time T
  function getFlightPositionAtTime(waypoints, T) {
    if (!waypoints || waypoints.length === 0) return null;
    if (T <= waypoints[0].t) return waypoints[0];
    const last = waypoints[waypoints.length - 1];
    if (T >= last.t) return last;

    for (let i = 0; i < waypoints.length - 1; i++) {
      if (T >= waypoints[i].t && T <= waypoints[i + 1].t) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const factor = (T - p1.t) / (p2.t - p1.t || 1);
        return {
          t: T,
          x: p1.x + (p2.x - p1.x) * factor,
          y: p1.y + (p2.y - p1.y) * factor
        };
      }
    }
    return last;
  }

  // Interpolate player position at time T (smooth movement, eliminates jumping/teleporting)
  function getPlayerPositionAtTime(playerOrPositions, T, isWinner = false) {
    if (!playerOrPositions) return null;
    const positions = Array.isArray(playerOrPositions) ? playerOrPositions : (playerOrPositions.positions || []);
    const deadAt = Array.isArray(playerOrPositions) ? null : playerOrPositions.deadAt;

    if (!positions || positions.length === 0) return null;
    if (T < positions[0].t) return null;

    const last = positions[positions.length - 1];
    // If past last recorded position, maintain the final position (victory spot or death location)
    if (T > last.t) {
      return last;
    }

    let low = 0;
    let high = positions.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (positions[mid].t === T) return positions[mid];
      if (positions[mid].t < T) low = mid + 1;
      else high = mid - 1;
    }

    const p1 = positions[high];
    const p2 = positions[low];
    if (!p1) return p2;
    if (!p2) return last;

    // Check Blue Chip Recall gap:
    // If player actually died and was recalled, p1 is at/before death and p2 is post-recall drop
    if (deadAt !== null && deadAt !== undefined && p1.t <= deadAt && p2.t > deadAt) {
      if (T <= deadAt + 5) {
        return p1; // Show death spot for 5s
      }
      return null; // Awaiting recall redeploy
    }

    const dt = p2.t - p1.t;
    const isBot = !Array.isArray(playerOrPositions) && !!playerOrPositions.isBot;
    const distMeters = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 100;
    const speed = dt > 0 ? distMeters / dt : 0;

    // Detect PUBG Server AI Bot relocation (server teleports bot when far from action or deep in blue)
    if (isBot && speed > 45 && !p1.inVehicle && !p2.inVehicle) {
      const rawFactor = dt > 0 ? (T - p1.t) / dt : 0;
      const target = rawFactor < 0.5 ? p1 : p2;
      return {
        t: T,
        x: target.x,
        y: target.y,
        z: target.z,
        health: rawFactor < 0.5 ? p1.health : p2.health,
        inVehicle: false,
        inPlane: false,
        isRelocating: true
      };
    }

    const factor = dt > 0 ? Math.max(0, Math.min(1, (T - p1.t) / dt)) : 0;
    return {
      t: T,
      x: p1.x + (p2.x - p1.x) * factor,
      y: p1.y + (p2.y - p1.y) * factor,
      z: p1.z + ((p2.z || p1.z) - p1.z) * factor,
      health: p1.health + (p2.health - p1.health) * factor,
      inVehicle: (factor > 0.5 ? p2.inVehicle : p1.inVehicle),
      inPlane: p1.inPlane || p2.inPlane
    };
  }

  // Get circle state at time T (Blue Zone, Safe Zone, Red Zone)
  function getCircleAtTime(circles, T) {
    if (!circles || circles.length === 0) return null;
    if (T <= circles[0].t) return circles[0];
    const last = circles[circles.length - 1];
    if (T >= last.t) return last;

    for (let i = 0; i < circles.length - 1; i++) {
      if (T >= circles[i].t && T <= circles[i + 1].t) {
        const c1 = circles[i];
        const c2 = circles[i + 1];
        const dt = c2.t - c1.t;
        const factor = dt > 0 ? (T - c1.t) / dt : 0;
        return {
          t: T,
          alivePlayers: factor > 0.5 ? c2.alivePlayers : c1.alivePlayers,
          safeX: c1.safeX + (c2.safeX - c1.safeX) * factor,
          safeY: c1.safeY + (c2.safeY - c1.safeY) * factor,
          safeRadius: c1.safeRadius + (c2.safeRadius - c1.safeRadius) * factor,
          blueX: c1.blueX + (c2.blueX - c1.blueX) * factor,
          blueY: c1.blueY + (c2.blueY - c1.blueY) * factor,
          blueRadius: c1.blueRadius + (c2.blueRadius - c1.blueRadius) * factor,
          redX: c1.redX + (c2.redX - c1.redX) * factor,
          redY: c1.redY + (c2.redY - c1.redY) * factor,
          redRadius: (c1.redRadius > 0 && c2.redRadius > 0)
            ? (c1.redRadius + (c2.redRadius - c1.redRadius) * factor)
            : (factor > 0.5 ? c2.redRadius : c1.redRadius)
        };
      }
    }
    return last;
  }

  // LOAD MATCH REPLAY ON MAP
  async function loadMatchReplay(match, preferredFocusName) {
    const app = window.PUBG_APP;
    if (!app) return;
    if (app.clearMeasurement) {
      app.clearMeasurement();
    }
    state.currentMatch = match;

    const mapKey = PUBG_MAP_ID_MAP[match.mapName] || 'taego';
    const maps = app.getMaps();
    const targetMap = maps[mapKey] || maps.taego;

    // Switch map if needed
    const currentMap = app.getMap();
    if (!currentMap || currentMap.id !== targetMap.id) {
      app.loadMap(targetMap);
    }

    const leafletMap = app.getLeafletMap();
    if (!leafletMap) return;

    app.showToast(`Loading 2D Telemetry Replay for ${targetMap.name}...`);

    try {
      // 1. Resolve Telemetry URL (from pubg.sh or directly from Krafton Official API asset)
      let telemetryUrl = match.telemetryUrl;
      if (!telemetryUrl && match.id) {
        app.showToast('Fetching official Krafton match telemetry...');
        const matchData = await fetchKraftonMatch(match.id, state.selectedShard);
        const asset = matchData.included?.find(x => x.type === 'asset');
        if (!asset || !asset.attributes?.URL) {
          throw new Error('Telemetry replay data not available for this match.');
        }
        telemetryUrl = asset.attributes.URL;
        match.telemetryUrl = telemetryUrl;
        if (matchData.data?.attributes) {
          match.mapName = matchData.data.attributes.mapName || match.mapName;
          match.gameMode = matchData.data.attributes.gameMode || match.gameMode;
          match.durationSeconds = matchData.data.attributes.duration || match.durationSeconds;
        }
      }

      if (!telemetryUrl) {
        throw new Error('No telemetry URL available for this match.');
      }

      // Download Telemetry
      const res = await fetch(telemetryUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching telemetry`);
      const events = await res.json();

      // 2. Parse Telemetry
      const initialFocus = preferredFocusName || state.searchedPlayerName || Object.keys(events.find(e => e._T === 'LogMatchStart')?.characters || {})[0] || '';
      const parsed = parseTelemetryData(events, initialFocus, match);

      // Clean up previous replay
      exitReplayMode(false);

      // Setup state
      state.isReplayActive = true;
      state.isPlaying = true;
      state.currentTime = 0;
      state.maxDuration = match.durationSeconds || 1800;
      state.playbackSpeed = 1;
      state.currentMatch = match;
      state.focusPlayerName = initialFocus;
      state.focusTeamId = parsed.focusTeamId;
      state.players = parsed.players;
      state.circles = parsed.circles;
      state.kills = parsed.kills;
      state.damages = parsed.damages;
      state.carePackages = parsed.carePackages || [];
      state.squads = parsed.squads;
      state.lastFrameTime = performance.now();

      // If initial focus wasn't found in players, pick first player in squad #1
      if (!state.players[state.focusPlayerName] && parsed.squads.length > 0 && parsed.squads[0].members.length > 0) {
        state.focusPlayerName = parsed.squads[0].members[0].name;
        state.focusTeamId = parsed.squads[0].teamId;
      }

      // Setup Leaflet layers
      state.replayLayerGroup = L.layerGroup().addTo(leafletMap);
      state.tracerLayerGroup = L.layerGroup().addTo(state.replayLayerGroup);

      // 1. Blue Zone Circle (Clean royal blue outline matching pubg.sh)
      state.circleBlue = L.circle([0, 0], {
        radius: 0,
        color: '#0055ff',
        weight: 2,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false
      });

      // 2. Safe Zone Circle (Dashed white outline matching pubg.sh)
      state.circleSafe = L.circle([0, 0], {
        radius: 0,
        color: '#ffffff',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false
      });

      // 2b. Red Zone Circle (Artillery bombing danger zone matching pubg.sh)
      state.circleRed = L.circle([0, 0], {
        radius: 0,
        color: '#ff2222',
        weight: 1.5,
        fillColor: '#ff0000',
        fillOpacity: 0.15,
        interactive: false
      });

      // 3. Focus player route trail
      updateFocusPlayerTrail();

      // 4. Kill Markers - pubg.sh does not place skulls on map; dead players remain as dead dots
      state.killMarkers = [];

      // 5. Pre-create Care Package (Airdrop) Markers using authentic pubg.sh sprites
      state.carePackageMarkers = (parsed.carePackages || []).map(cp => {
        const latlng = toLeafletLatLng(cp.x, cp.y, targetMap.sizeMeters);
        const icon = L.divIcon({
          className: 'replay-care-package-marker airdrop-descending',
          html: `<img src="assets/custom_airdrop_parachute.png" class="airdrop-sprite-parachute" alt="Airdrop">`,
          iconSize: [32, 32],
          iconAnchor: [16, 30]
        });
        const marker = L.marker(latlng, { icon: icon, interactive: true });
        const itemsList = cp.items && cp.items.length > 0 ? cp.items.join(', ') : 'Special Weapons & Lv.3 Gear';
        marker.bindTooltip(`<b>AIRDROP CRATE</b><br>${itemsList}`, {
          direction: 'top',
          offset: [0, -18],
          className: 'pubgsh-tooltip'
        });
        return {
          id: cp.id,
          spawnT: cp.spawnT,
          landT: cp.landT,
          items: cp.items,
          x: cp.x,
          y: cp.y,
          marker: marker,
          visualState: 'hidden'
        };
      });

      // 5.5 Flight Path Route Line (Corridor edge-to-edge; plane represented as moving dot)
      state.flightPath = parsed.flightPath || null;
      if (state.planeDotMarker && state.replayLayerGroup) {
        state.replayLayerGroup.removeLayer(state.planeDotMarker);
        state.planeDotMarker = null;
      }
      if (state.flightPolyline && state.replayLayerGroup) {
        state.replayLayerGroup.removeLayer(state.flightPolyline);
        state.flightPolyline = null;
      }

      if (state.flightPath) {
        const fp = state.flightPath;
        let p1, p2;
        if (fp.borderEntry && fp.borderExit) {
          p1 = toLeafletLatLng(fp.borderEntry.x, fp.borderEntry.y, targetMap.sizeMeters);
          p2 = toLeafletLatLng(fp.borderExit.x, fp.borderExit.y, targetMap.sizeMeters);
        } else if (fp.getPlanePos) {
          const startPt = fp.getPlanePos(fp.startTime);
          const endPt = fp.getPlanePos(fp.endTime);
          p1 = toLeafletLatLng(startPt.x, startPt.y, targetMap.sizeMeters);
          p2 = toLeafletLatLng(endPt.x, endPt.y, targetMap.sizeMeters);
        } else if (fp.waypoints && fp.waypoints.length >= 2) {
          const wp = fp.waypoints;
          p1 = toLeafletLatLng(wp[0].x, wp[0].y, targetMap.sizeMeters);
          p2 = toLeafletLatLng(wp[wp.length - 1].x, wp[wp.length - 1].y, targetMap.sizeMeters);
        }

        if (p1 && p2) {
          state.flightPolyline = L.polyline([p1, p2], {
            color: 'rgba(255, 255, 255, 0.45)',
            weight: 2,
            dashArray: '6, 8',
            interactive: false
          }).addTo(state.replayLayerGroup);
        }
      }

      // Show Replay Controller HUD Bar at top
      const replayBar = document.getElementById('replay-controller-bar');
      if (replayBar) replayBar.style.display = 'flex';

      const aliveHud = document.getElementById('replay-alive-hud');
      if (aliveHud) aliveHud.style.display = 'flex';

      const replayKillfeed = document.getElementById('replay-killfeed');
      if (replayKillfeed) {
        replayKillfeed.style.display = 'flex';
        replayKillfeed.innerHTML = '';
      }

      // Setup Scrub slider
      const slider = document.getElementById('replay-scrub-slider');
      if (slider) {
        slider.min = '0';
        slider.max = state.maxDuration.toString();
        slider.step = '0.1';
        slider.value = '0';
      }

      // Update match metadata & timeline kill marks (pubg.sh style)
      const dateEl = document.getElementById('replay-match-date');
      if (dateEl) dateEl.textContent = formatMatchDate(match.createdAt);
      updateTopBarPlacement();
      updateTimelineKillMarks();
      updatePlayPauseButton();

      // Switch Sidebar View to Roster
      showRosterSubpane(match);

      // Start animation loop
      state.animationFrameId = requestAnimationFrame(replayAnimationLoop);

      app.showToast(`Replay Active: Spectating ${state.focusPlayerName}`);

    } catch (err) {
      console.error('Failed to load replay:', err);
      app.showToast(`Error loading replay: ${err.message}`);
    }
  }

  // UPDATE FOCUS PLAYER TRAIL
  function updateFocusPlayerTrail() {
    const app = window.PUBG_APP;
    if (!app) return;
    const currentMap = app.getMap();
    if (!currentMap) return;

    if (state.trailPolyline && state.replayLayerGroup) {
      state.replayLayerGroup.removeLayer(state.trailPolyline);
      state.trailPolyline = null;
    }

    const p = state.players[state.focusPlayerName];
    if (p && p.positions.length > 0) {
      const jumpT = (p.jumpTime !== null && p.jumpTime !== undefined) ? p.jumpTime : 0;
      // Filter out pre-jump positions, transport planes, and dead corpse states
      const validPositions = p.positions.filter(pos => pos.t >= jumpT && !pos.inPlane && (pos.health > 0 || pos.t <= jumpT + 5));

      // Group into continuous segments separated by recall gaps (> 30s)
      const segments = [];
      let currentSeg = [];

      for (let i = 0; i < validPositions.length; i++) {
        const cur = validPositions[i];
        if (currentSeg.length > 0) {
          const prev = validPositions[i - 1];
          if (cur.t - prev.t > 30) {
            if (currentSeg.length > 1) segments.push(currentSeg);
            currentSeg = [];
          }
        }
        const ll = toLeafletLatLng(cur.x, cur.y, currentMap.sizeMeters);
        if (ll.lat >= 0 && ll.lat <= currentMap.sizeMeters && ll.lng >= 0 && ll.lng <= currentMap.sizeMeters) {
          currentSeg.push(ll);
        }
      }
      if (currentSeg.length > 1) segments.push(currentSeg);

      if (segments.length > 0) {
        state.trailPolyline = L.polyline(segments, {
          color: '#8d79f3',
          weight: 3,
          dashArray: '6, 4',
          opacity: 0.85
        });

        const trailCheckbox = document.getElementById('replay-toggle-trail');
        if (!trailCheckbox || trailCheckbox.checked) {
          state.trailPolyline.addTo(state.replayLayerGroup);
        }
      }
    }
  }

  // Update placement and kill count in top timeline bar (matching pubg.sh)
  function updateTopBarPlacement() {
    const rankEl = document.getElementById('replay-meta-rank');
    const killsEl = document.getElementById('replay-meta-kills');
    const p = state.players[state.focusPlayerName];
    if (rankEl) {
      rankEl.textContent = p ? formatRankPlacement(p.rank) : '--';
    }
    if (killsEl) {
      const kCount = p ? p.kills : 0;
      killsEl.textContent = `${kCount} kill${kCount === 1 ? '' : 's'}`;
    }
  }

  // Render kill marks on playhead track (pubg.sh red notches & clusters)
  function updateTimelineKillMarks() {
    const container = document.getElementById('replay-kill-marks');
    if (!container || !state.maxDuration) return;

    const focusKills = state.kills.filter(k => k.killer === state.focusPlayerName);

    // Cluster kills within 2.0 seconds of each other (pubg.sh precision)
    const clusters = [];
    focusKills.forEach(k => {
      const lastCluster = clusters[clusters.length - 1];
      if (lastCluster && (k.t - lastCluster.kills[lastCluster.kills.length - 1].t) <= 2.0) {
        lastCluster.kills.push(k);
      } else {
        clusters.push({ kills: [k] });
      }
    });

    let html = clusters.map(c => {
      const firstT = c.kills[0].t;
      const avgT = c.kills.reduce((sum, k) => sum + k.t, 0) / c.kills.length;
      const leftPct = Math.max(0.5, Math.min(99.5, (avgT / state.maxDuration) * 100));
      const count = c.kills.length;
      const victimsList = c.kills.map(k => `${k.victim} (${k.weapon}, ${k.distance}m at ${formatTime(k.t)})`).join('\n');
      const tooltip = `${count} Kill${count > 1 ? 's' : ''}:\n${victimsList}`;

      if (count === 1) {
        return `
          <div class="timeline-kill-mark single" style="left: ${leftPct}%;" data-t="${firstT}" title="${tooltip}">
            <div class="kill-tick"></div>
          </div>
        `;
      } else {
        const ticksHtml = c.kills.map(() => `<span class="kill-tick"></span>`).join('');
        return `
          <div class="timeline-kill-mark cluster" style="left: ${leftPct}%;" data-t="${firstT}" title="${tooltip}">
            <div class="cluster-ticks">${ticksHtml}</div>
            <div class="cluster-label">(${count})</div>
          </div>
        `;
      }
    }).join('');

    // Check if focused player died during this match, and if so add death marker
    const focusPlayer = state.players[state.focusPlayerName];
    if (focusPlayer && focusPlayer.deadAt !== null && focusPlayer.deadAt !== undefined && focusPlayer.deadAt <= state.maxDuration) {
      const deathPct = Math.max(0.5, Math.min(99.5, (focusPlayer.deadAt / state.maxDuration) * 100));
      const killerInfo = focusPlayer.killer ? `by ${focusPlayer.killer}` : 'by Playzone';
      html += `
        <div class="timeline-death-mark" style="left: ${deathPct}%;" data-t="${focusPlayer.deadAt}" title="Eliminated at ${formatTime(focusPlayer.deadAt)} ${killerInfo}"></div>
      `;
    }

    container.innerHTML = html;

    // Clicking on kill mark or death mark jumps directly to that timestamp
    container.querySelectorAll('.timeline-kill-mark, .timeline-death-mark').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = parseFloat(el.getAttribute('data-t'));
        if (!isNaN(t)) {
          state.currentTime = t;
          renderReplayFrame(t);
        }
      });
    });
  }

  // Anti-Cheat / Normal vs Abnormal Combat Behavior Heuristics
  function evaluatePlayerIntegrity(p) {
    if (!p) return { status: 'NORMAL', label: '🛡️ NORMAL', cssClass: 'normal', hsRate: 0, longestKill: 0, damageDealt: 0, flags: [] };
    const kills = p.kills || 0;
    const headshots = p.headshots || 0;
    const hsRate = kills > 0 ? Math.round((headshots / kills) * 100) : 0;
    const longest = p.longestKill || 0;
    const damage = p.damageDealt || 0;

    const flags = [];
    let isSuspicious = false;

    if (kills >= 4 && hsRate >= 60) {
      isSuspicious = true;
      flags.push(`Abnormal Headshot Ratio (${hsRate}%)`);
    }
    if (longest >= 450 && p.longestKillWeapon && !p.longestKillWeapon.match(/AWM|M24|Kar98k|Mosin|DSR|Lynx/i)) {
      isSuspicious = true;
      flags.push(`Extreme Range Kill (${longest}m with ${p.longestKillWeapon})`);
    }
    if (kills >= 12 && hsRate >= 50) {
      isSuspicious = true;
      flags.push(`Extreme Kill & Headshot Outlier (${kills} Kills, ${hsRate}% HS)`);
    }

    return {
      status: isSuspicious ? 'SUSPICIOUS' : 'NORMAL',
      label: isSuspicious ? '⚠️ ANOMALOUS COMBAT BEHAVIOR' : '🛡️ VERIFIED NORMAL PLAYSTYLE',
      cssClass: isSuspicious ? 'suspicious' : 'normal',
      hsRate: hsRate,
      longestKill: longest,
      damageDealt: damage,
      flags: flags
    };
  }

  // UPDATE OPERATIVE DOSSIER (DEEP TELEMETRY & EQUIPMENT PANEL)
  function updatePlayerDossier(name, currentTime = state.currentTime) {
    const dossierEl = document.getElementById('roster-player-dossier');
    if (!dossierEl) return;

    const p = state.players[name];
    if (!p) {
      dossierEl.style.display = 'none';
      return;
    }

    dossierEl.style.display = 'block';

    // Live status at time T
    const isWinner = (p.rank === 1);
    const pos = getPlayerPositionAtTime(p.positions, currentTime, isWinner);
    const isEliminated = (p.deadAt !== null && p.deadAt <= currentTime && !isWinner);
    const isKnocked = (!isEliminated && pos && pos.health === 0);

    const nameEl = document.getElementById('dossier-name');
    if (nameEl) nameEl.textContent = p.name;

    const lvlEl = document.getElementById('dossier-survival-level');
    if (lvlEl) {
      if (p.name === state.searchedPlayerName && state.survivalMastery && state.survivalMastery.level) {
        const tier = state.survivalMastery.tier || 1;
        lvlEl.style.display = 'inline-flex';
        lvlEl.innerHTML = `<img src="${getSurvivalTierIcon(tier)}" class="survival-tier-img" alt="Tier ${tier}" /> LVL ${state.survivalMastery.level}`;
        lvlEl.title = `Survival Mastery Tier ${tier} - Level ${state.survivalMastery.level}`;
      } else {
        lvlEl.style.display = 'none';
      }
    }

    const tagEl = document.getElementById('dossier-tag');
    if (tagEl) {
      const clan = (p.name === state.focusPlayerName && state.playerClan) ? `[${state.playerClan.clanTag}] ` : '';
      tagEl.textContent = `${clan}Squad #${p.teamId || 1} • Rank #${p.rank || '--'}`;
    }

    const statusEl = document.getElementById('dossier-status');
    if (statusEl) {
      if (isEliminated) {
        statusEl.textContent = 'ELIMINATED';
        statusEl.className = 'dossier-status-pill eliminated';
      } else if (isKnocked) {
        statusEl.textContent = 'KNOCKED';
        statusEl.className = 'dossier-status-pill knocked';
      } else {
        statusEl.textContent = 'ALIVE';
        statusEl.className = 'dossier-status-pill alive';
      }
    }

    // Health Bar
    const hp = (!isEliminated && pos) ? Math.max(0, Math.min(100, Math.round(pos.health))) : 0;
    const hpValEl = document.getElementById('dossier-hp-val');
    if (hpValEl) hpValEl.textContent = `${hp} / 100`;

    const hpBarEl = document.getElementById('dossier-hp-bar');
    if (hpBarEl) {
      hpBarEl.style.width = `${hp}%`;
      hpBarEl.className = hp <= 25 ? 'vital-bar-fill hp danger' : (hp <= 55 ? 'vital-bar-fill hp warning' : 'vital-bar-fill hp');
    }

    // Boost Bar (decays slowly over match)
    let currentBoost = p.boost || 0;
    if (p.deadAt && currentTime > p.deadAt) currentBoost = 0;
    else if (currentTime > 0) {
      currentBoost = Math.max(0, Math.round(currentBoost - (currentTime / 30)));
    }
    const boostValEl = document.getElementById('dossier-boost-val');
    if (boostValEl) boostValEl.textContent = `${currentBoost}%`;

    const boostBarEl = document.getElementById('dossier-boost-bar');
    if (boostBarEl) boostBarEl.style.width = `${currentBoost}%`;

    // Equipment
    const helmetEl = document.getElementById('dossier-helmet');
    if (helmetEl) {
      helmetEl.textContent = p.gear?.helmet?.name || 'None';
      helmetEl.className = p.gear?.helmet ? `gear-name lv-${p.gear.helmet.level}` : 'gear-name';
    }

    const vestEl = document.getElementById('dossier-vest');
    if (vestEl) {
      vestEl.textContent = p.gear?.vest?.name || 'None';
      vestEl.className = p.gear?.vest ? `gear-name lv-${p.gear.vest.level}` : 'gear-name';
    }

    const backpackEl = document.getElementById('dossier-backpack');
    if (backpackEl) {
      backpackEl.textContent = p.gear?.backpack?.name || 'None';
      backpackEl.className = p.gear?.backpack ? `gear-name lv-${p.gear.backpack.level}` : 'gear-name';
    }

    // Weapons
    const weaponsEl = document.getElementById('dossier-weapons-list');
    if (weaponsEl) {
      if (p.weapons && p.weapons.length > 0) {
        weaponsEl.innerHTML = p.weapons.map(w => `<span class="weapon-chip">${w}</span>`).join('');
      } else {
        weaponsEl.innerHTML = '<span class="empty-weapon-text">Standard Loadout</span>';
      }
    }

    // Anti-Cheat / Anomaly Report
    const integrity = evaluatePlayerIntegrity(p);
    const badgeEl = document.getElementById('dossier-integrity-badge');
    if (badgeEl) {
      badgeEl.className = `integrity-badge ${integrity.cssClass}`;
      const iconEl = document.getElementById('dossier-integrity-icon');
      if (iconEl) iconEl.textContent = integrity.status === 'SUSPICIOUS' ? '⚠️' : '🛡️';
      const titleEl = document.getElementById('dossier-integrity-title');
      if (titleEl) titleEl.textContent = integrity.label;
    }

    const hsEl = document.getElementById('dossier-hs-rate');
    if (hsEl) hsEl.textContent = `${integrity.hsRate}%`;

    const longEl = document.getElementById('dossier-longest-kill');
    if (longEl) longEl.textContent = `${integrity.longestKill}m`;

    const dmgEl = document.getElementById('dossier-total-dmg');
    if (dmgEl) dmgEl.textContent = `${integrity.damageDealt}`;
  }

  // CHANGE SPECTATED / FOCUSED PLAYER (ANY SQUAD MEMBER OR ENEMY)
  function setFocusPlayer(playerName) {
    const p = state.players[playerName];
    if (!p) return;

    state.focusPlayerName = playerName;
    state.focusTeamId = p.teamId;

    // Update trail
    updateFocusPlayerTrail();

    // Pan camera to player's current position
    const app = window.PUBG_APP;
    const leafletMap = app ? app.getLeafletMap() : null;
    const currentMap = app ? app.getMap() : null;

    if (leafletMap && currentMap) {
      const pos = getPlayerPositionAtTime(p.positions, state.currentTime);
      if (pos) {
        const latlng = toLeafletLatLng(pos.x, pos.y, currentMap.sizeMeters);
        leafletMap.panTo(latlng, { animate: true, duration: 0.5 });
      }
    }

    // Update roster highlights
    document.querySelectorAll('.roster-player-row').forEach(row => {
      row.classList.toggle('active-tracked', row.getAttribute('data-name') === playerName);
    });

    const trackingEl = document.getElementById('tracking-player-name');
    if (trackingEl) trackingEl.textContent = playerName;

    const statsEl = document.getElementById('tracking-player-stats');
    if (statsEl) statsEl.textContent = `🎯 ${p.kills} Kills`;

    // Update Operative Dossier
    updatePlayerDossier(playerName, state.currentTime);

    // Update Top Timeline bar placement & kill marks (pubg.sh)
    updateTopBarPlacement();
    updateTimelineKillMarks();

    if (app) app.showToast(`Spectating ${playerName}`);
  }

  // ANIMATION LOOP (Runs at 60 FPS)
  function replayAnimationLoop(now) {
    if (!state.isReplayActive) return;

    if (state.isPlaying && state.lastFrameTime) {
      const dt = (now - state.lastFrameTime) / 1000;
      state.currentTime += dt * state.playbackSpeed;

      if (state.currentTime >= state.maxDuration) {
        state.currentTime = state.maxDuration;
        state.isPlaying = false;
        updatePlayPauseButton();
      }
    }
    state.lastFrameTime = now;

    renderReplayFrame(state.currentTime);

    state.animationFrameId = requestAnimationFrame(replayAnimationLoop);
  }

  // RENDER REPLAY FRAME
  function renderReplayFrame(T) {
    const app = window.PUBG_APP;
    if (!app) return;
    const currentMap = app.getMap();
    if (!currentMap) return;
    const mapSize = currentMap.sizeMeters;
    const leafletMap = app.getLeafletMap();

    // Update timeline readouts (precise pubg.sh format mm:ss.s)
    const timeDisplay = document.getElementById('replay-current-time');
    if (timeDisplay) timeDisplay.textContent = formatTimePrecise(T);

    const slider = document.getElementById('replay-scrub-slider');
    if (slider && !slider.matches(':active')) {
      slider.value = T.toFixed(1);
    }

    // 1. Circles (Safe Zone, Blue Zone, Red Zone)
    const circleState = getCircleAtTime(state.circles, T);
    if (circleState) {
      // Safe Zone (White Dashed Circle - Next safe area)
      if (state.circleSafe) {
        if (circleState.safeRadius > 0) {
          const safeLatLng = toLeafletLatLng(circleState.safeX, circleState.safeY, mapSize);
          const safeRad = toLeafletRadius(circleState.safeRadius, mapSize);
          state.circleSafe.setLatLng(safeLatLng);
          state.circleSafe.setRadius(Math.max(0, safeRad));
          if (!state.replayLayerGroup.hasLayer(state.circleSafe)) {
            state.circleSafe.addTo(state.replayLayerGroup);
          }
        } else {
          if (state.replayLayerGroup.hasLayer(state.circleSafe)) {
            state.replayLayerGroup.removeLayer(state.circleSafe);
          }
        }
      }

      // Blue Zone (Clean royal blue outline matching pubg.sh)
      if (state.circleBlue) {
        if (circleState.blueRadius > 0) {
          const blueLatLng = toLeafletLatLng(circleState.blueX, circleState.blueY, mapSize);
          const blueRad = toLeafletRadius(circleState.blueRadius, mapSize);
          state.circleBlue.setLatLng(blueLatLng);
          state.circleBlue.setRadius(Math.max(0, blueRad));
          if (!state.replayLayerGroup.hasLayer(state.circleBlue)) {
            state.circleBlue.addTo(state.replayLayerGroup);
          }
        } else {
          if (state.replayLayerGroup.hasLayer(state.circleBlue)) {
            state.replayLayerGroup.removeLayer(state.circleBlue);
          }
        }
      }

      // Red Zone (Artillery Bombing Area)
      if (state.circleRed) {
        if (circleState.redRadius > 0) {
          const redLatLng = toLeafletLatLng(circleState.redX, circleState.redY, mapSize);
          const redRad = toLeafletRadius(circleState.redRadius, mapSize);
          state.circleRed.setLatLng(redLatLng);
          state.circleRed.setRadius(Math.max(0, redRad));
          if (!state.replayLayerGroup.hasLayer(state.circleRed)) {
            state.circleRed.addTo(state.replayLayerGroup);
          }
        } else {
          if (state.replayLayerGroup.hasLayer(state.circleRed)) {
            state.replayLayerGroup.removeLayer(state.circleRed);
          }
        }
      }

      const aliveEl = document.getElementById('replay-alive-count');
      if (aliveEl) aliveEl.textContent = circleState.alivePlayers || '--';
    }

    // 1.5 Flight Path Route Line & Moving Plane Dot (vanishes after all players have landed, max 140s)
    if (state.flightPath) {
      const fp = state.flightPath;
      const allLanded = Math.min(140, fp.allLandedTime || (fp.endTime + 25));

      if (T > allLanded) {
        // All players have landed: vanish the flight line and plane dot completely
        if (state.flightPolyline && state.replayLayerGroup && state.replayLayerGroup.hasLayer(state.flightPolyline)) {
          state.replayLayerGroup.removeLayer(state.flightPolyline);
        }
        if (state.planeDotMarker && state.replayLayerGroup && state.replayLayerGroup.hasLayer(state.planeDotMarker)) {
          state.replayLayerGroup.removeLayer(state.planeDotMarker);
        }
      } else {
        // Flight or parachute descent phase: keep flight line visible
        if (state.flightPolyline && state.replayLayerGroup && !state.replayLayerGroup.hasLayer(state.flightPolyline)) {
          state.flightPolyline.addTo(state.replayLayerGroup);
        }

        // Plane Dot: active ONLY while aircraft is physically traversing airspace (T <= fp.endTime <= 85s)
        const planeFlightEnd = Math.min(85, fp.endTime || (fp.startTime + 60));
        if (T >= fp.startTime && T <= planeFlightEnd && fp.getPlanePos) {
          const planePos = fp.getPlanePos(T);
          const planeLatLng = toLeafletLatLng(planePos.x, planePos.y, mapSize);

          if (!state.planeDotMarker) {
            const planeIcon = L.divIcon({
              className: 'pubgsh-plane-dot',
              html: `<div class="pubgsh-dot-wrap plane-dot-wrap"><div class="pubgsh-dot-inner plane-dot-inner"></div><span class="plane-dot-badge">PLANE</span></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            state.planeDotMarker = L.marker(planeLatLng, {
              icon: planeIcon,
              zIndexOffset: 2500,
              interactive: false
            });
            if (state.replayLayerGroup) {
              state.planeDotMarker.addTo(state.replayLayerGroup);
            }
          } else {
            state.planeDotMarker.setLatLng(planeLatLng);
            if (state.replayLayerGroup && !state.replayLayerGroup.hasLayer(state.planeDotMarker)) {
              state.planeDotMarker.addTo(state.replayLayerGroup);
            }
          }
        } else {
          // Plane has completed flight and left airspace
          if (state.planeDotMarker && state.replayLayerGroup && state.replayLayerGroup.hasLayer(state.planeDotMarker)) {
            state.replayLayerGroup.removeLayer(state.planeDotMarker);
          }
        }
      }
    }

    // 2. Care Packages (Authentic pubg.sh airdrop sprites: Flying vs Normal Landed)
    if (state.carePackageMarkers) {
      state.carePackageMarkers.forEach(cp => {
        if (T < cp.spawnT) {
          // Not dropped yet
          if (cp.visualState !== 'hidden') {
            state.replayLayerGroup.removeLayer(cp.marker);
            cp.visualState = 'hidden';
          }
        } else if (T >= cp.spawnT && T < cp.landT) {
          // Descending from sky with parachute!
          if (cp.visualState !== 'descending') {
            const descIcon = L.divIcon({
              className: 'replay-care-package-marker airdrop-descending',
              html: `<img src="assets/custom_airdrop_parachute.png" class="airdrop-sprite-parachute" alt="Airdrop Falling" />`,
              iconSize: [32, 32],
              iconAnchor: [16, 30]
            });
            cp.marker.setIcon(descIcon);
            if (!state.replayLayerGroup.hasLayer(cp.marker)) {
              cp.marker.addTo(state.replayLayerGroup);
            }
            cp.visualState = 'descending';
          }
        } else {
          // Landed on ground (parachute detaches / removed!)
          if (cp.visualState !== 'landed') {
            const landIcon = L.divIcon({
              className: 'replay-care-package-marker airdrop-landed',
              html: `<img src="assets/custom_airdrop_crate.png" class="airdrop-sprite-crate" alt="Airdrop Landed" />`,
              iconSize: [18, 16],
              iconAnchor: [9, 8]
            });
            cp.marker.setIcon(landIcon);
            if (!state.replayLayerGroup.hasLayer(cp.marker)) {
              cp.marker.addTo(state.replayLayerGroup);
            }
            cp.visualState = 'landed';
          }
        }
      });
    }

    // 3. Bullet Tracers
    const showTracers = document.getElementById('replay-toggle-tracers') ? document.getElementById('replay-toggle-tracers').checked : true;
    if (state.tracerLayerGroup) {
      state.tracerLayerGroup.clearLayers();
      if (showTracers) {
        const activeDamages = state.damages.filter(d => d.t <= T && d.t >= (T - 1.2));
        activeDamages.forEach(d => {
          const start = toLeafletLatLng(d.ax, d.ay, mapSize);
          const end = toLeafletLatLng(d.vx, d.vy, mapSize);
          L.polyline([start, end], {
            color: '#ffffff',
            weight: 2,
            opacity: 0.85,
            dashArray: '4, 4'
          }).addTo(state.tracerLayerGroup);
        });
      }
    }

    // 4. Killfeed Ticker (events within last 8s of T)
    const killfeedEl = document.getElementById('replay-killfeed');
    if (killfeedEl) {
      const activeKills = state.kills.filter(k => k.t <= T && k.t >= (T - 8));
      killfeedEl.innerHTML = activeKills.slice(-4).map(k => `
        <div class="killfeed-item ${k.killer === state.focusPlayerName ? 'focus-kill' : ''}">
          <span class="kf-killer">${k.killer}</span>
          <span class="kf-weapon">${k.weapon} (${k.distance}m)</span>
          <span class="kf-victim">${k.victim}</span>
        </div>
      `).join('');
    }

    // 5. Player Markers (Authentic pubg.sh 7.5px Minimalist Dots & Health Encoding)
    const activePlayerNames = new Set();
    const followCamera = document.getElementById('replay-toggle-follow') ? document.getElementById('replay-toggle-follow').checked : false;
    const squadOnly = document.getElementById('replay-toggle-squad-only') ? document.getElementById('replay-toggle-squad-only').checked : false;
    const isNewTheme = (state.theme !== 'old');

    Object.keys(state.players).forEach(name => {
      const p = state.players[name];

      // A. If player has no positions or hasn't spawned yet
      if (!p.positions || p.positions.length === 0) return;
      if (T < p.positions[0].t) return;

      // B. Check if player hasn't jumped from initial plane yet
      if (p.jumpTime === Infinity || (p.jumpTime !== null && p.jumpTime !== undefined && T < p.jumpTime)) {
        return; // Still inside transport plane
      }

      const isWinner = (p.rank === 1);
      const lastPos = p.positions[p.positions.length - 1];
      const isDead = (p.deadAt !== null && p.deadAt !== undefined && T >= p.deadAt) || (T > lastPos.t && !isWinner);

      // C. Squad-only filter
      const isFocus = (name === state.focusPlayerName);
      const isTeam = (state.focusTeamId !== null && p.teamId === state.focusTeamId);
      if (squadOnly && !isFocus && !isTeam) return;

      // D. Resolve position (if dead, holds final death position without disappearing)
      const pos = isDead ? lastPos : getPlayerPositionAtTime(p, T, isWinner);
      if (!pos || pos.inPlane) return;

      const latlng = toLeafletLatLng(pos.x, pos.y, mapSize);
      if (latlng.lat < 0 || latlng.lat > mapSize || latlng.lng < 0 || latlng.lng > mapSize) {
        return;
      }

      activePlayerNames.add(name);

      let marker = state.playerMarkers.get(name);

      if (isFocus && followCamera && leafletMap) {
        leafletMap.panTo(latlng, { animate: false });
      }

      // E. Color & Health Ring Encoding based on Theme:
      let dotColor;
      let dotBg;
      let markerClass = 'replay-player-marker';
      let zIndex;
      let tooltipHtml;

      if (isDead) {
        if (isFocus) {
          // Selected dead player is RED
          dotColor = '#ff3b5c';
          dotBg = '#ff3b5c';
          markerClass += ' dead-player focus-player';
          zIndex = 20;
        } else if (isTeam) {
          // Teammate dead: subtle grey in new theme, pink in old
          dotColor = isNewTheme ? 'rgba(180, 185, 195, 0.4)' : '#FF5ABA';
          dotBg = dotColor;
          markerClass += ' dead-player team-player';
          zIndex = 10;
        } else {
          // Non-selected deads: gray almost transparent but visible
          dotColor = isNewTheme ? 'rgba(180, 185, 195, 0.35)' : '#d96f6f';
          dotBg = dotColor;
          markerClass += ' dead-player enemy-player';
          zIndex = 5;
        }
        const deathT = p.deadAt || lastPos.t;
        tooltipHtml = `<b>${p.isBot ? '[BOT] ' : ''}${name}</b><br><span style="color:#d96f6f;">Eliminated</span> at ${formatTime(deathT)}${p.killer ? ' by ' + p.killer : ''}`;
      } else if (pos.health === 0) {
        // Knocked down - YELLOW
        dotColor = '#FDFE0B';
        dotBg = dotColor;
        markerClass += ' knocked-player' + (isFocus ? ' focus-player' : '') + (isTeam ? ' team-player' : '');
        zIndex = isFocus ? 1000 : (isTeam ? 600 : 300);
        tooltipHtml = `<b>${p.isBot ? '[BOT] ' : ''}${name}</b><br><span style="color:#FDFE0B;font-weight:bold;">KNOCKED</span> | Kills: ${p.kills || 0}`;
      } else {
        // Alive & Active
        if (isNewTheme) {
          // New theme: white players, bot AI badge, focus player has focus halo
          dotColor = '#FFFFFF';
          dotBg = '#FFFFFF';
          if (isFocus) {
            markerClass += ' focus-player';
            zIndex = 1000;
          } else if (isTeam) {
            markerClass += ' team-player';
            zIndex = 600;
          } else if (p.isBot) {
            markerClass += ' bot-player';
            zIndex = 50;
          } else {
            markerClass += ' enemy-player';
            zIndex = 200;
          }
        } else {
          // Old theme: Tactical colors
          if (isFocus) {
            dotColor = '#8D79F3';
            markerClass += ' focus-player';
            zIndex = 1000;
          } else if (isTeam) {
            dotColor = '#31D499';
            markerClass += ' team-player';
            zIndex = 600;
          } else if (p.isBot) {
            dotColor = '#94a3b8';
            markerClass += ' bot-player';
            zIndex = 50;
          } else {
            dotColor = '#FFFFFF';
            markerClass += ' enemy-player';
            zIndex = 200;
          }

          const hp = Math.max(0, Math.min(100, Math.round(pos.health)));
          if (hp < 100) {
            const deg = Math.round(hp * 3.6);
            dotBg = `conic-gradient(${dotColor} ${deg}deg, #161a23 ${deg}deg)`;
          } else {
            dotBg = dotColor;
          }
        }

        const hp = Math.max(0, Math.min(100, Math.round(pos.health)));
        tooltipHtml = `<b>${p.isBot ? '[BOT] ' : ''}${name}</b><br>HP: ${hp}% | Kills: ${p.kills || 0}`;
      }

      const aiBadgeHtml = (!isDead && p.isBot && isNewTheme) ? '<span class="bot-ai-badge">AI</span>' : '';
      const iconHtml = `<div class="pubgsh-dot-wrap"><div class="pubgsh-dot-inner" style="background: ${dotBg};"></div>${aiBadgeHtml}</div>`;

      if (!marker) {
        const icon = L.divIcon({
          className: markerClass,
          html: iconHtml,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        marker = L.marker(latlng, { icon: icon, zIndexOffset: zIndex });
        marker.on('click', () => setFocusPlayer(name));
        marker.bindTooltip(tooltipHtml, {
          direction: 'top',
          offset: [0, -6],
          className: 'pubgsh-tooltip'
        });
        marker.addTo(state.replayLayerGroup);
        state.playerMarkers.set(name, marker);
      } else {
        marker.setLatLng(latlng);
        marker.setZIndexOffset(zIndex);

        const el = marker.getElement();
        if (el) {
          const dotEl = el.querySelector('.pubgsh-dot-inner');
          if (dotEl) {
            dotEl.style.background = dotBg;
          }
          let badgeEl = el.querySelector('.bot-ai-badge');
          if (!isDead && p.isBot && isNewTheme) {
            if (!badgeEl) {
              const wrapEl = el.querySelector('.pubgsh-dot-wrap') || el;
              const b = document.createElement('span');
              b.className = 'bot-ai-badge';
              b.textContent = 'AI';
              wrapEl.appendChild(b);
            }
          } else if (badgeEl) {
            badgeEl.remove();
          }

          if (el.className !== `${markerClass} leaflet-marker-icon leaflet-zoom-animated leaflet-interactive`) {
            el.className = `${markerClass} leaflet-marker-icon leaflet-zoom-animated leaflet-interactive`;
          }
        }
        marker.setTooltipContent(tooltipHtml);
      }

      if (isFocus) {
        updatePlayerDossier(name, T);
      }
    });

    // Remove absent markers (eliminated or filtered players)
    state.playerMarkers.forEach((marker, name) => {
      if (!activePlayerNames.has(name)) {
        state.replayLayerGroup.removeLayer(marker);
        state.playerMarkers.delete(name);
      }
    });

    // 6. Update squad roster status indicators (alive vs dead) in sidebar
    updateRosterAliveStates(T);
  }

  // UPDATE ROSTER LIVE STATES IN SIDEBAR
  function updateRosterAliveStates(T) {
    document.querySelectorAll('.roster-player-row').forEach(row => {
      const name = row.getAttribute('data-name');
      const p = state.players[name];
      const dot = row.querySelector('.roster-status-dot');
      if (p && dot) {
        const isWinner = (p.rank === 1);
        const pos = getPlayerPositionAtTime(p.positions, T, isWinner);
        const isAlive = (pos !== null && pos.health > 0);
        dot.className = `roster-status-dot ${isAlive ? 'alive' : 'dead'}`;
        dot.title = isAlive ? 'Alive' : (p.killer ? `Eliminated by ${p.killer}` : 'Eliminated');
      }
    });
  }

  // PLAY / PAUSE CONTROLS
  function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    state.lastFrameTime = performance.now();
    updatePlayPauseButton();
  }

  function updatePlayPauseButton() {
    const btn = document.getElementById('replay-play-btn');
    if (btn) {
      btn.textContent = state.isPlaying ? '⏸' : '▶';
      btn.title = state.isPlaying ? 'Pause (Space)' : 'Play (Space)';
    }
  }

  function setReplaySpeed(speed) {
    state.playbackSpeed = speed;
    document.querySelectorAll('.replay-speed-btn').forEach(btn => {
      const s = parseFloat(btn.getAttribute('data-speed'));
      btn.classList.toggle('active', s === speed);
    });
  }

  // EXIT REPLAY MODE
  function exitReplayMode(resetSidebar = true) {
    state.isReplayActive = false;
    state.isPlaying = false;
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    const app = window.PUBG_APP;
    const leafletMap = app ? app.getLeafletMap() : null;

    if (state.replayLayerGroup && leafletMap) {
      leafletMap.removeLayer(state.replayLayerGroup);
      state.replayLayerGroup = null;
    }

    state.playerMarkers.clear();
    state.killMarkers = [];
    state.carePackageMarkers = [];
    state.carePackages = [];
    state.flightPolyline = null;
    state.circleSafe = null;
    state.circleBlue = null;
    state.circleRed = null;
    state.trailPolyline = null;
    state.tracerLayerGroup = null;

    const replayBar = document.getElementById('replay-controller-bar');
    if (replayBar) replayBar.style.display = 'none';

    const aliveHud = document.getElementById('replay-alive-hud');
    if (aliveHud) aliveHud.style.display = 'none';

    const killfeed = document.getElementById('replay-killfeed');
    if (killfeed) killfeed.style.display = 'none';

    if (resetSidebar) {
      showMatchesSubpane();
      if (app) app.showToast('Exited Replay mode');
    }
  }

  // SIDEBAR SUB-VIEW SWITCHING
  function showMatchesSubpane() {
    const vMatches = document.getElementById('replay-view-matches');
    const vRoster = document.getElementById('replay-view-roster');
    if (vMatches) vMatches.style.display = 'block';
    if (vRoster) vRoster.style.display = 'none';
  }

  function showRosterSubpane(match) {
    const vMatches = document.getElementById('replay-view-matches');
    const vRoster = document.getElementById('replay-view-roster');
    if (vMatches) vMatches.style.display = 'none';
    if (vRoster) vRoster.style.display = 'block';

    const mapName = PUBG_MAP_DISPLAY_NAMES[match.mapName] || match.mapName || 'TAEGO';
    document.getElementById('active-match-map').textContent = mapName;
    document.getElementById('active-match-mode').textContent = (match.gameMode || 'SQUAD').toUpperCase();
    document.getElementById('active-match-time').textContent = formatTime(match.durationSeconds);
    document.getElementById('tracking-player-name').textContent = state.focusPlayerName;

    const p = state.players[state.focusPlayerName];
    document.getElementById('tracking-player-stats').textContent = `🎯 ${p ? p.kills : 0} Kills`;

    renderSidebarRoster();
  }

  // RENDER SQUAD ROSTER IN SIDEBAR
  function renderSidebarRoster(filterText = '') {
    const listEl = document.getElementById('sidebar-roster-list');
    if (!listEl) return;

    const q = filterText.toLowerCase().trim();

    const allPlayersList = Object.values(state.players);
    const totalPlayers = allPlayersList.length;
    const botCount = allPlayersList.filter(p => p.isBot).length;
    const realCount = totalPlayers - botCount;

    const summaryHtml = `
      <div class="roster-lobby-summary">
        <span class="roster-lobby-chip real" title="Real human players in match">👤 Real: <b>${realCount}</b></span>
        <span class="roster-lobby-chip bot" title="AI bots in match">🤖 Bots: <b>${botCount}</b></span>
        <span class="roster-lobby-chip total">Total: <b>${totalPlayers}</b></span>
      </div>
    `;

    const squadsHtml = state.squads.map(sq => {
      const filteredMembers = sq.members.filter(m => !q || m.name.toLowerCase().includes(q));
      if (filteredMembers.length === 0) return '';

      const isWinner = (sq.rank === 1);
      const isMySquad = (sq.teamId === state.focusTeamId);
      const isBotSquad = sq.members.every(m => m.isBot);

      let squadTypeTag = '';
      if (isBotSquad) {
        squadTypeTag = `<span class="roster-team-bot-tag">AI Squad</span>`;
      }

      const headerTitle = isWinner ? `🏆 SQUAD #1 (WINNER)` : `SQUAD #${sq.rank} (Team ${sq.teamId})`;

      const membersHtml = filteredMembers.map(m => {
        const isTracked = (m.name === state.focusPlayerName);
        return `
          <div class="roster-player-row ${isTracked ? 'active-tracked' : ''} ${m.isBot ? 'is-bot-row' : 'is-human-row'}" data-name="${m.name}" title="Click to spectate ${m.name} (${m.isBot ? 'AI Bot' : 'Human Player'})">
            <div class="roster-player-left">
              <span class="roster-status-dot alive"></span>
              <span class="roster-player-name">${m.name === state.searchedPlayerName ? '⭐ ' : ''}${m.name}</span>
              ${m.isBot ? '<span class="roster-bot-tag">BOT</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="roster-player-kills ${m.kills > 0 ? 'has-kills' : ''}">🎯 ${m.kills}</span>
              <button class="roster-inspect-btn" data-inspect="${m.name}" title="Inspect Classified Intel for ${m.name}">ℹ️</button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="roster-team-card ${isBotSquad ? 'is-bot-team' : ''}" style="${isWinner ? 'border-color: rgba(255, 234, 0, 0.4);' : (isMySquad ? 'border-color: rgba(0, 229, 255, 0.4);' : '')}">
          <div class="roster-team-header" style="${isWinner ? 'color: #ffea00;' : (isMySquad ? 'color: var(--accent-cyan);' : '')}">
            <span>${headerTitle} ${squadTypeTag}</span>
            <span>${sq.members.length} Players</span>
          </div>
          <div class="roster-team-members">
            ${membersHtml}
          </div>
        </div>
      `;
    }).join('');

    listEl.innerHTML = summaryHtml + squadsHtml;

    // Attach click listeners to spectate
    listEl.querySelectorAll('.roster-player-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.roster-inspect-btn')) return;
        const name = row.getAttribute('data-name');
        setFocusPlayer(name);
      });
    });

    // Attach click listeners to inspect classified dossier
    listEl.querySelectorAll('.roster-inspect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.getAttribute('data-inspect');
        openPlayerClassifiedIntel(name, state.selectedShard);
      });
    });
  }

  // ==========================================================================
  // CLASSIFIED OPERATIVE INTEL & HIDDEN ACCOUNT TELEMETRY CONTROLLER
  // ==========================================================================

  const intelModalState = {
    playerName: '',
    shardId: 'steam',
    category: 'normal', // 'normal' or 'ranked'
    activeMode: 'squad',
    accountData: null,
    clanData: null,
    lifetimeStats: null,
    rankedStats: null,
    survivalMastery: null,
    isBot: false,
    pInMatch: null
  };

  async function openPlayerClassifiedIntel(playerName, shardId = state.selectedShard || 'steam') {
    if (!playerName) return;
    const modal = document.getElementById('modal-player-intel');
    if (!modal) return;

    intelModalState.playerName = playerName;
    intelModalState.shardId = shardId;
    intelModalState.category = 'normal'; // default to normal career on open

    modal.classList.add('open');

    // Reset category switcher pills to active 'normal'
    document.querySelectorAll('.intel-category-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-icategory') === 'normal');
    });

    const titleEl = document.getElementById('intel-modal-title');
    const nameEl = document.getElementById('intel-player-name');
    const avatarEl = document.getElementById('intel-avatar-icon');
    const typePill = document.getElementById('intel-account-type');
    const clanTagEl = document.getElementById('intel-clan-tag');
    const accIdEl = document.getElementById('intel-account-id');
    const platformEl = document.getElementById('intel-platform');
    const loadingEl = document.getElementById('intel-loading-indicator');
    const contentEl = document.getElementById('intel-content-sections');

    if (titleEl) titleEl.textContent = `CLASSIFIED OPERATIVE DOSSIER - ${playerName}`;
    if (nameEl) nameEl.textContent = playerName;
    if (platformEl) platformEl.textContent = shardId.toUpperCase();
    if (avatarEl) avatarEl.textContent = (playerName === state.searchedPlayerName) ? '⭐' : '🪖';

    const matchSlider = document.getElementById('match-date-slider');
    const intelSlider = document.getElementById('intel-date-slider');
    if (matchSlider && intelSlider && matchSlider.max) {
      intelSlider.max = matchSlider.max;
    }

    const pInMatch = state.players ? state.players[playerName] : null;
    intelModalState.pInMatch = pInMatch;

    const isBot = pInMatch ? !!pInMatch.isBot : (playerName.startsWith('ai.') || playerName.startsWith('account.ai') || playerName.startsWith('npc.'));
    intelModalState.isBot = isBot;

    if (isBot) {
      if (typePill) {
        typePill.textContent = 'PUBG OFFICIAL AI BOT';
        typePill.className = 'intel-verdict-pill is-bot';
      }
      if (clanTagEl) clanTagEl.style.display = 'none';
      if (accIdEl) accIdEl.textContent = pInMatch?.accountId || `ai.bot.${playerName}`;
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';

      renderBotClassifiedIntel(pInMatch);
      return;
    }

    if (typePill) {
      typePill.textContent = 'VERIFIED STEAM HUMAN';
      typePill.className = 'intel-verdict-pill';
    }

    if (loadingEl) {
      loadingEl.style.display = 'block';
      loadingEl.innerHTML = `
        <div class="intel-spinner"></div>
        <span style="font-size: 12px; letter-spacing: 1px;">DECRYPTING KRAFTON CLASSIFIED TELEMETRY & LIFETIME LOGS...</span>
      `;
    }
    if (contentEl) contentEl.style.display = 'none';

    try {
      // If we already have the searched player's data cached in state
      let kPlayer = (playerName === state.searchedPlayerName && state.playerProfile)
        ? state.playerProfile
        : null;

      let clan = (playerName === state.searchedPlayerName) ? state.playerClan : null;
      let lifetime = (playerName === state.searchedPlayerName) ? state.lifetimeStats : null;
      let ranked = (playerName === state.searchedPlayerName) ? state.rankedStats : null;
      let survival = (playerName === state.searchedPlayerName) ? state.survivalMastery : null;

      if (!kPlayer || !lifetime) {
        kPlayer = await fetchKraftonPlayer(playerName, shardId);
        const accountId = kPlayer.id;

        const [fetchedClan, fetchedLifetime, fetchedRanked, fetchedSurvival] = await Promise.all([
          kPlayer.attributes?.clanId ? fetchKraftonClan(kPlayer.attributes.clanId, shardId) : null,
          fetchKraftonLifetimeStats(accountId, shardId),
          fetchKraftonRankedStats(accountId, shardId),
          fetchKraftonSurvivalMastery(accountId, shardId)
        ]);

        clan = fetchedClan;
        lifetime = fetchedLifetime;
        ranked = fetchedRanked;
        survival = fetchedSurvival;
      }

      intelModalState.accountData = kPlayer;
      intelModalState.clanData = clan;
      intelModalState.lifetimeStats = lifetime;
      intelModalState.rankedStats = ranked;
      intelModalState.survivalMastery = survival;

      if (accIdEl) accIdEl.textContent = kPlayer.id || 'account.verified';

      const intelLvlBadge = document.getElementById('intel-survival-badge');
      if (survival && survival.level) {
        const tier = survival.tier || 1;
        if (intelLvlBadge) {
          intelLvlBadge.style.display = 'inline-flex';
          intelLvlBadge.innerHTML = `<img src="${getSurvivalTierIcon(tier)}" class="survival-tier-img" alt="Tier ${tier}" /> LVL ${survival.level}`;
          intelLvlBadge.title = `Survival Mastery Tier ${tier} - Level ${survival.level}`;
        }
      } else {
        if (intelLvlBadge) intelLvlBadge.style.display = 'none';
      }

      if (clan && clan.clanTag) {
        if (clanTagEl) {
          clanTagEl.style.display = 'inline';
          clanTagEl.textContent = `[${clan.clanTag}] ${clan.clanName || ''} (LVL ${clan.clanLevel || 1})`;
        }
      } else {
        if (clanTagEl) clanTagEl.style.display = 'none';
      }

      // Pick best mode
      if (lifetime) {
        const modes = ['squad', 'squad-fpp', 'duo', 'solo'];
        let bestMode = 'squad';
        let maxRounds = -1;
        modes.forEach(m => {
          if (lifetime[m] && lifetime[m].roundsPlayed > maxRounds) {
            maxRounds = lifetime[m].roundsPlayed;
            bestMode = m;
          }
        });
        intelModalState.activeMode = bestMode;
      }

      document.querySelectorAll('.intel-mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-imode') === intelModalState.activeMode);
      });

      renderIntelModalMode(intelModalState.activeMode);

      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';

    } catch (err) {
      console.warn('Failed to load full account intel:', err.message);
      if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.innerHTML = `<span style="color: #ff3b5c; font-size: 11px;">⚠️ Notice: ${err.message}. Showing active match telemetry dossier instead:</span>`;
      }
      if (contentEl) contentEl.style.display = 'block';
      if (pInMatch) renderBotClassifiedIntel(pInMatch);
    }
  }

  function renderIntelModalMode(mode) {
    const normalSections = document.getElementById('intel-normal-sections');
    const rankedSections = document.getElementById('intel-ranked-sections');

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val !== undefined && val !== null) ? val : '--';
    };

    if (intelModalState.category === 'ranked') {
      if (normalSections) normalSections.style.display = 'none';
      if (rankedSections) rankedSections.style.display = 'block';

      // 1. Custom Date Window (e.g. Today, 7 Days, Slider)
      if (intelModalState.intelDateFilterDays > 0) {
        const agg = aggregateMatchesStats(state.currentMatches, mode, true, intelModalState.intelDateFilterDays);
        const rounds = agg.roundsPlayed;

        if (rounds === 0) {
          setVal('intel-rk-tier-title', 'NO MATCHES');
          setVal('intel-rk-rp-display', '-- RP');
          setVal('intel-rk-best-rp', `No Ranked games in ${mode.toUpperCase()} for selected time window`);
          setVal('intel-rk-rounds', '0');
          setVal('intel-rk-win-rate', '0%');
          setVal('intel-rk-top10-rate', '0%');
          setVal('intel-rk-kd', '0.00');
          setVal('intel-rk-adr', '0');
          setVal('intel-rk-wins', '0');
          setVal('intel-rk-top10s', '0');
          setVal('intel-rk-kills', '0');
          setVal('intel-rk-deaths', '0');
          setVal('intel-rk-assists', '0');
          setVal('intel-rk-dbnos', '0');
          setVal('intel-rk-revives', '0');
          setVal('intel-rk-damage', '0');
          setVal('intel-rk-headshot-rate', '0%');
          setVal('intel-rk-hs-kills', '0');
          setVal('intel-rk-longest-kill', '0m');
          setVal('intel-rk-round-most-kills', '0');
          setVal('intel-rk-avg-rank', '--');
          return;
        }

        const kd = agg.kda.toFixed(2);
        const winRate = `${Math.round(agg.winRatio * 100)}%`;
        const top10Rate = `${Math.round(agg.top10Ratio * 100)}%`;
        const adr = Math.round(agg.damageDealt / Math.max(1, rounds));
        const hsRate = agg.kills > 0 ? `${Math.round((agg.headshotKills / agg.kills) * 100)}%` : '0%';
        const avgRank = agg.avgRank ? `#${agg.avgRank.toFixed(1)}` : '--';

        setVal('intel-rk-tier-title', 'WINDOW PERFORMANCE');
        setVal('intel-rk-rp-display', `${rounds} Matches`);
        setVal('intel-rk-best-rp', `Aggregated over ${intelModalState.intelDateFilterDays === 1 ? 'Today' : `Past ${intelModalState.intelDateFilterDays} Days`}`);
        setVal('intel-rk-rounds', rounds.toLocaleString());
        setVal('intel-rk-win-rate', winRate);
        setVal('intel-rk-top10-rate', top10Rate);
        setVal('intel-rk-kd', kd);
        setVal('intel-rk-adr', adr);
        setVal('intel-rk-wins', agg.wins.toLocaleString());
        setVal('intel-rk-top10s', agg.top10s.toLocaleString());
        setVal('intel-rk-kills', agg.kills.toLocaleString());
        setVal('intel-rk-deaths', agg.deaths.toLocaleString());
        setVal('intel-rk-assists', agg.assists.toLocaleString());
        setVal('intel-rk-dbnos', agg.dBNOs.toLocaleString());
        setVal('intel-rk-revives', agg.revives.toLocaleString());
        setVal('intel-rk-damage', Math.round(agg.damageDealt).toLocaleString());
        setVal('intel-rk-headshot-rate', hsRate);
        setVal('intel-rk-hs-kills', agg.headshotKills.toLocaleString());
        setVal('intel-rk-longest-kill', `${Math.round(agg.longestKill)}m`);
        setVal('intel-rk-round-most-kills', agg.roundMostKills);
        setVal('intel-rk-avg-rank', avgRank);
        return;
      }

      // 2. All Time Season Ranked
      const rStats = intelModalState.rankedStats ? intelModalState.rankedStats[mode] : null;

      if (!rStats || rStats.roundsPlayed === 0) {
        setVal('intel-rk-tier-title', 'UNRANKED');
        setVal('intel-rk-rp-display', '-- RP');
        setVal('intel-rk-best-rp', 'No Ranked Matches in this Mode');
        setVal('intel-rk-rounds', '0');
        setVal('intel-rk-win-rate', '0%');
        setVal('intel-rk-top10-rate', '0%');
        setVal('intel-rk-kd', '0.00');
        setVal('intel-rk-adr', '0');
        setVal('intel-rk-wins', '0');
        setVal('intel-rk-top10s', '0');
        setVal('intel-rk-kills', '0');
        setVal('intel-rk-deaths', '0');
        setVal('intel-rk-assists', '0');
        setVal('intel-rk-dbnos', '0');
        setVal('intel-rk-revives', '0');
        setVal('intel-rk-damage', '0');
        setVal('intel-rk-headshot-rate', '0%');
        setVal('intel-rk-hs-kills', '0');
        setVal('intel-rk-longest-kill', '0m');
        setVal('intel-rk-round-most-kills', '0');
        setVal('intel-rk-avg-rank', '--');
        return;
      }

      const tierTitle = (rStats.currentTier && rStats.currentTier.tier && rStats.currentTier.tier !== 'Unranked')
        ? `${rStats.currentTier.tier.toUpperCase()} ${rStats.currentTier.subTier || ''}`.trim()
        : 'UNRANKED';

      const bestTierTitle = (rStats.bestTier && rStats.bestTier.tier)
        ? `${rStats.bestTier.tier.toUpperCase()} ${rStats.bestTier.subTier || ''}`.trim()
        : 'Unranked';

      const rounds = rStats.roundsPlayed || 0;
      const wins = rStats.wins || 0;
      const kills = rStats.kills || 0;
      const deaths = rStats.deaths || Math.max(1, rounds - wins);
      const kd = (rStats.kda || (kills / Math.max(1, deaths))).toFixed(2);
      const winRate = `${Math.round(((rStats.winRatio || (wins / Math.max(1, rounds))) * 100))}%`;
      const top10Rate = `${Math.round((rStats.top10Ratio || 0) * 100)}%`;
      const top10s = Math.round((rStats.top10Ratio || 0) * rounds);
      const adr = Math.round((rStats.damageDealt || 0) / Math.max(1, rounds));
      const hsRate = kills > 0 ? `${Math.round(((rStats.headshotKills || 0) / kills) * 100)}%` : '0%';

      setVal('intel-rk-tier-title', tierTitle);
      setVal('intel-rk-rp-display', `${rStats.currentRankPoint || 0} RP`);
      setVal('intel-rk-best-rp', `Season Peak: ${rStats.bestRankPoint || 0} RP (${bestTierTitle})`);
      setVal('intel-rk-rounds', rounds.toLocaleString());
      setVal('intel-rk-win-rate', winRate);
      setVal('intel-rk-top10-rate', top10Rate);
      setVal('intel-rk-kd', kd);
      setVal('intel-rk-adr', adr);
      setVal('intel-rk-wins', wins.toLocaleString());
      setVal('intel-rk-top10s', top10s.toLocaleString());
      setVal('intel-rk-kills', kills.toLocaleString());
      setVal('intel-rk-deaths', deaths.toLocaleString());
      setVal('intel-rk-assists', (rStats.assists || 0).toLocaleString());
      setVal('intel-rk-dbnos', (rStats.dBNOs || 0).toLocaleString());
      setVal('intel-rk-revives', (rStats.revives || 0).toLocaleString());
      setVal('intel-rk-damage', Math.round(rStats.damageDealt || 0).toLocaleString());
      setVal('intel-rk-headshot-rate', hsRate);
      setVal('intel-rk-hs-kills', (rStats.headshotKills || 0).toLocaleString());
      setVal('intel-rk-longest-kill', `${Math.round(rStats.longestKill || 0)}m`);
      setVal('intel-rk-round-most-kills', rStats.roundMostKills || 0);
      setVal('intel-rk-avg-rank', rStats.avgRank ? `#${rStats.avgRank.toFixed(1)}` : '--');

    } else {
      // Normal Career Dossier
      if (normalSections) normalSections.style.display = 'block';
      if (rankedSections) rankedSections.style.display = 'none';

      // 1. Custom Date Window (e.g. Today, 7 Days, Slider)
      if (intelModalState.intelDateFilterDays > 0) {
        const agg = aggregateMatchesStats(state.currentMatches, mode, false, intelModalState.intelDateFilterDays);
        const rounds = agg.roundsPlayed;

        if (rounds === 0) {
          setVal('intel-team-kills', '0');
          setVal('intel-suicides', '0');
          setVal('intel-road-kills', '0');
          setVal('intel-veh-destroys', '0');
          setVal('intel-dbnos', '0');
          setVal('intel-weapons-looted', '0');
          setVal('intel-heals', '0');
          setVal('intel-boosts', '0');
          setVal('intel-revives', '0');
          setVal('intel-walk-dist', '0.0 km');
          setVal('intel-ride-dist', '0.0 km');
          setVal('intel-swim-dist', '0.0 km');
          setVal('intel-time-survived', '0 hrs');
          setVal('intel-longest-survived', '--');
          setVal('intel-avg-survival', '--');
          setVal('intel-kd', '0.00');
          setVal('intel-adr', '0');
          setVal('intel-win-rate', '0%');
          setVal('intel-wins', '0');
          setVal('intel-top10-rate', '0%');
          setVal('intel-kills', '0');
          setVal('intel-headshot-rate', '0%');
          setVal('intel-hs-kills', '0');
          setVal('intel-longest-kill', '0m');
          setVal('intel-round-most-kills', '0');
          return;
        }

        const kd = agg.kda.toFixed(2);
        const winRate = `${Math.round(agg.winRatio * 100)}%`;
        const top10Rate = `${Math.round(agg.top10Ratio * 100)}%`;
        const adr = Math.round(agg.damageDealt / Math.max(1, rounds));
        const hsRate = agg.kills > 0 ? `${Math.round((agg.headshotKills / agg.kills) * 100)}%` : '0%';

        // Hidden incidents
        setVal('intel-team-kills', agg.teamKills || 0);
        setVal('intel-suicides', agg.suicides || 0);
        setVal('intel-road-kills', agg.roadKills || 0);
        setVal('intel-veh-destroys', agg.vehicleDestroys || 0);
        setVal('intel-dbnos', (agg.dBNOs || 0).toLocaleString());
        setVal('intel-weapons-looted', (agg.weaponsAcquired || 0).toLocaleString());

        // Medical & Sustenance
        setVal('intel-heals', (agg.heals || 0).toLocaleString());
        setVal('intel-boosts', (agg.boosts || 0).toLocaleString());
        setVal('intel-revives', (agg.revives || 0).toLocaleString());

        // Odometry & Distances
        setVal('intel-walk-dist', `${((agg.walkDistance || 0) / 1000).toFixed(1)} km`);
        setVal('intel-ride-dist', `${((agg.rideDistance || 0) / 1000).toFixed(1)} km`);
        setVal('intel-swim-dist', `${((agg.swimDistance || 0) / 1000).toFixed(1)} km`);
        setVal('intel-time-survived', `${Math.round((agg.timeSurvived || 0) / 3600).toLocaleString()} hrs`);
        setVal('intel-longest-survived', formatTime(Math.round(agg.timeSurvived || 0)));
        setVal('intel-avg-survival', rounds > 0 ? formatTime(Math.round((agg.timeSurvived || 0) / rounds)) : '--');

        // Combat Lethality
        setVal('intel-kd', kd);
        setVal('intel-adr', adr);
        setVal('intel-win-rate', winRate);
        setVal('intel-wins', agg.wins.toLocaleString());
        setVal('intel-top10-rate', top10Rate);
        setVal('intel-kills', agg.kills.toLocaleString());
        setVal('intel-headshot-rate', hsRate);
        setVal('intel-hs-kills', (agg.headshotKills || 0).toLocaleString());
        setVal('intel-longest-kill', `${Math.round(agg.longestKill || 0)}m`);
        setVal('intel-round-most-kills', agg.roundMostKills || 0);
        return;
      }

      // 2. All Time Lifetime
      const s = intelModalState.lifetimeStats ? intelModalState.lifetimeStats[mode] : null;

      if (!s || s.roundsPlayed === 0) {
        setVal('intel-team-kills', '0');
        setVal('intel-suicides', '0');
        setVal('intel-road-kills', '0');
        setVal('intel-veh-destroys', '0');
        setVal('intel-dbnos', '0');
        setVal('intel-weapons-looted', '0');
        setVal('intel-heals', '0');
        setVal('intel-boosts', '0');
        setVal('intel-revives', '0');
        setVal('intel-walk-dist', '0.0 km');
        setVal('intel-ride-dist', '0.0 km');
        setVal('intel-swim-dist', '0.0 km');
        setVal('intel-time-survived', '0 hrs');
        setVal('intel-longest-survived', '--');
        setVal('intel-avg-survival', '--');
        setVal('intel-kd', '0.00');
        setVal('intel-adr', '0');
        setVal('intel-win-rate', '0%');
        setVal('intel-wins', '0');
        setVal('intel-top10-rate', '0%');
        setVal('intel-kills', '0');
        setVal('intel-headshot-rate', '0%');
        setVal('intel-hs-kills', '0');
        setVal('intel-longest-kill', '0m');
        setVal('intel-round-most-kills', '0');
        return;
      }

      const rounds = s.roundsPlayed || 0;
      const wins = s.wins || 0;
      const kills = s.kills || 0;
      const deaths = s.losses || (rounds - wins) || 1;
      const kd = (kills / Math.max(1, deaths)).toFixed(2);
      const winRate = ((wins / Math.max(1, rounds)) * 100).toFixed(1) + '%';
      const top10Rate = ((s.top10s / Math.max(1, rounds)) * 100).toFixed(1) + '%';
      const adr = Math.round((s.damageDealt || 0) / Math.max(1, rounds));
      const hsRate = kills > 0 ? Math.round(((s.headshotKills || 0) / kills) * 100) + '%' : '0%';

      // Hidden incidents
      setVal('intel-team-kills', s.teamKills || 0);
      setVal('intel-suicides', s.suicides || 0);
      setVal('intel-road-kills', s.roadKills || 0);
      setVal('intel-veh-destroys', s.vehicleDestroys || 0);
      setVal('intel-dbnos', (s.dBNOs || 0).toLocaleString());
      setVal('intel-weapons-looted', (s.weaponsAcquired || 0).toLocaleString());

      // Medical & Sustenance
      setVal('intel-heals', (s.heals || 0).toLocaleString());
      setVal('intel-boosts', (s.boosts || 0).toLocaleString());
      setVal('intel-revives', (s.revives || 0).toLocaleString());

      // Odometry & Distances
      setVal('intel-walk-dist', `${((s.walkDistance || 0) / 1000).toFixed(1)} km`);
      setVal('intel-ride-dist', `${((s.rideDistance || 0) / 1000).toFixed(1)} km`);
      setVal('intel-swim-dist', `${((s.swimDistance || 0) / 1000).toFixed(1)} km`);
      setVal('intel-time-survived', `${Math.round((s.timeSurvived || 0) / 3600).toLocaleString()} hrs`);
      setVal('intel-longest-survived', formatTime(Math.round(s.mostSurvivalTime || s.longestTimeSurvived || 0)));
      setVal('intel-avg-survival', rounds > 0 ? formatTime(Math.round((s.timeSurvived || 0) / rounds)) : '--');

      // Combat Lethality
      setVal('intel-kd', kd);
      setVal('intel-adr', adr);
      setVal('intel-win-rate', winRate);
      setVal('intel-wins', wins.toLocaleString());
      setVal('intel-top10-rate', top10Rate);
      setVal('intel-kills', kills.toLocaleString());
      setVal('intel-headshot-rate', hsRate);
      setVal('intel-hs-kills', (s.headshotKills || 0).toLocaleString());
      setVal('intel-longest-kill', `${Math.round(s.longestKill || 0)}m`);
      setVal('intel-round-most-kills', s.roundMostKills || 0);
    }
  }

  function renderBotClassifiedIntel(p) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val !== undefined && val !== null) ? val : '--';
    };

    let dist = 0;
    const pos = p ? (p.positions || []) : [];
    for (let i = 1; i < pos.length; i++) {
      dist += Math.hypot(pos[i].x - pos[i - 1].x, pos[i].y - pos[i - 1].y) / 100;
    }

    setVal('intel-team-kills', '0');
    setVal('intel-suicides', '0');
    setVal('intel-road-kills', '0');
    setVal('intel-veh-destroys', '0');
    setVal('intel-dbnos', p?.kills || 0);
    setVal('intel-weapons-looted', p?.weapons?.length || 1);
    setVal('intel-heals', '0');
    setVal('intel-boosts', `${p?.boost || 0}%`);
    setVal('intel-revives', '0');
    setVal('intel-walk-dist', `${(dist / 1000).toFixed(2)} km`);
    setVal('intel-ride-dist', '0.0 km');
    setVal('intel-swim-dist', '0.0 km');
    setVal('intel-time-survived', p?.deadAt ? `${Math.round(p.deadAt / 60)} min` : 'Match Active');
    setVal('intel-longest-survived', p?.deadAt ? formatTime(p.deadAt) : '--');
    setVal('intel-avg-survival', '--');
    setVal('intel-kd', p?.deadAt ? (p.kills || 0).toFixed(2) : '--');
    setVal('intel-adr', p?.damageDealt || 0);
    setVal('intel-win-rate', p?.rank === 1 ? '100%' : '0%');
    setVal('intel-wins', p?.rank === 1 ? '1' : '0');
    setVal('intel-top10-rate', p?.rank && p.rank <= 10 ? '100%' : '0%');
    setVal('intel-kills', p?.kills || 0);
    const hs = p?.headshots || 0;
    const hsRate = p?.kills > 0 ? `${Math.round((hs / p.kills) * 100)}%` : '0%';
    setVal('intel-headshot-rate', hsRate);
    setVal('intel-hs-kills', hs);
    setVal('intel-longest-kill', `${p?.longestKill || 0}m`);
    setVal('intel-round-most-kills', p?.kills || 0);

    setVal('intel-ranked-tier-title', 'OFFICIAL AI BOT');
    setVal('intel-ranked-rp-display', 'BOT ENTITY');
    setVal('intel-ranked-best-rp', 'PUBG Automated Training Unit');
    setVal('intel-ranked-wr', '--');
    setVal('intel-ranked-top10', '--');
    setVal('intel-ranked-kd', '--');
    setVal('intel-ranked-adr', '--');
  }

  // OPEN FULL OFFICIAL MATCH TELEMETRY & COMBAT INTEL MODAL
  async function openMatchIntelModal(match) {
    if (!match) return;
    const modal = document.getElementById('modal-match-intel');
    if (!modal) return;

    // If match lacks extended participant stats (e.g. from pubg.sh), enrich it via Krafton API
    if (!match.stats || match.stats.walkDistance === undefined || !match.squad) {
      await enrichMatchWithKraftonData(match, state.selectedShard);
    }

    const s = match.stats || {};
    const mapDisplayName = PUBG_MAP_DISPLAY_NAMES[match.mapName] || match.mapName || 'Taego';
    const isWin = (s.winPlace === 1);
    const isRanked = isRankedMatch(match);
    const rawMode = (match.gameMode || 'squad').toUpperCase();
    const modeText = rawMode.replace('COMPETITIVE-', '');

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val !== undefined && val !== null) ? val : '--';
    };

    setVal('match-intel-title', `${mapDisplayName.toUpperCase()} - FULL COMBAT & TELEMETRY DOSSIER`);
    setVal('match-intel-map', mapDisplayName);
    setVal('match-intel-category', isRanked ? '🎖️ RANKED MATCH' : 'NORMAL MATCH');
    setVal('match-intel-mode', modeText);
    setVal('match-intel-date', match.playedAt ? new Date(match.playedAt).toLocaleString() : '--');
    setVal('match-intel-duration', match.durationSeconds ? `${Math.floor(match.durationSeconds / 60)}m ${match.durationSeconds % 60}s` : '--');
    setVal('match-intel-placement', isWin ? '🏆 #1 CHICKEN DINNER' : (`#${s.winPlace || '--'} Finish`));

    // Individual combat
    setVal('match-intel-kills', s.kills || 0);
    setVal('match-intel-damage', Math.round(s.damageDealt || 0).toLocaleString());
    setVal('match-intel-dbnos', s.DBNOs || 0);
    setVal('match-intel-assists', s.assists || 0);
    setVal('match-intel-headshots', s.headshotKills || 0);
    setVal('match-intel-hs-pct', (s.kills > 0 ? `${Math.round(((s.headshotKills || 0) / s.kills) * 100)}%` : '0%'));
    setVal('match-intel-longest-kill', `${Math.round(s.longestKill || 0)}m`);
    setVal('match-intel-kill-streaks', s.killStreaks || 0);
    setVal('match-intel-kill-place', s.killPlace ? `#${s.killPlace}` : '#--');

    // Survival & Logistics
    const survivedSecs = s.timeSurvived || 0;
    setVal('match-intel-survived', `${Math.floor(survivedSecs / 60)}m ${Math.round(survivedSecs % 60)}s`);
    const deathType = (s.deathType || 'alive').toUpperCase();
    setVal('match-intel-death-type', deathType);
    const dtEl = document.getElementById('match-intel-death-type');
    if (dtEl) {
      dtEl.className = 'intel-card-val';
      if (deathType === 'ALIVE') dtEl.classList.add('text-gold');
      else if (deathType === 'BYPLAYER') dtEl.classList.add('text-red');
      else if (deathType === 'BYZONE') dtEl.classList.add('highlight-cyan');
    }

    setVal('match-intel-revives', s.revives || 0);
    setVal('match-intel-heals', s.heals || 0);
    setVal('match-intel-boosts', s.boosts || 0);
    setVal('match-intel-weapons', s.weaponsAcquired || 0);

    // Odometry & Distances
    const walkM = s.walkDistance || 0;
    const rideM = s.rideDistance || 0;
    const swimM = s.swimDistance || 0;
    const totalKm = ((walkM + rideM + swimM) / 1000).toFixed(2);
    setVal('match-intel-walk', walkM >= 1000 ? `${(walkM / 1000).toFixed(2)} km` : `${Math.round(walkM)} m`);
    setVal('match-intel-ride', rideM >= 1000 ? `${(rideM / 1000).toFixed(2)} km` : `${Math.round(rideM)} m`);
    setVal('match-intel-swim', swimM >= 1000 ? `${(swimM / 1000).toFixed(2)} km` : `${Math.round(swimM)} m`);
    setVal('match-intel-total-dist', `${totalKm} km`);
    setVal('match-intel-veh-destroys', s.vehicleDestroys || 0);
    setVal('match-intel-road-kills', s.roadKills || 0);

    // Squad Roster Table
    const tbody = document.getElementById('match-intel-squad-tbody');
    if (tbody) {
      const rosterList = (match.squad && match.squad.length > 0)
        ? match.squad
        : [{
            name: state.searchedPlayerName || s.name || 'Player',
            winPlace: s.winPlace || 1,
            kills: s.kills || 0,
            damageDealt: s.damageDealt || 0,
            DBNOs: s.DBNOs || 0,
            assists: s.assists || 0,
            timeSurvived: s.timeSurvived || 0,
            deathType: s.deathType || 'alive'
          }];

      tbody.innerHTML = rosterList.map(member => {
        const isFocus = (member.name === state.searchedPlayerName);
        const memSurv = member.timeSurvived || 0;
        const survText = `${Math.floor(memSurv / 60)}m ${Math.round(memSurv % 60)}s`;
        const dType = (member.deathType || 'alive').toLowerCase();
        let statusBadge = `<span class="match-card-status-badge status-${dType}">${dType.toUpperCase()}</span>`;

        return `
          <tr class="${isFocus ? 'focus-teammate-row' : ''}">
            <td>
              <b>${member.name}</b>
              ${isFocus ? '<span class="match-category-tag ranked-tag" style="margin-left: 6px; font-size: 10px;">YOU</span>' : ''}
            </td>
            <td><b class="${(member.kills || 0) > 0 ? 'text-red' : ''}">${member.kills || 0}</b></td>
            <td><b class="highlight-gold">${Math.round(member.damageDealt || 0)}</b></td>
            <td>${member.DBNOs || 0}</td>
            <td>${member.assists || 0}</td>
            <td>${survText}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }

    // Launch Replay button in modal footer
    const launchBtn = document.getElementById('match-intel-launch-replay-btn');
    if (launchBtn) {
      launchBtn.onclick = () => {
        modal.classList.remove('open');
        loadMatchReplay(match, state.searchedPlayerName);
      };
    }

    modal.classList.add('open');
  }

  // RENDER KRAFTON PLAYER PROFILE & LIFETIME STATS CARD
  function renderPlayerProfileCard() {
    const cardEl = document.getElementById('player-profile-card');
    if (!cardEl) return;

    if (!state.playerProfile && !state.lifetimeStats) {
      cardEl.style.display = 'none';
      return;
    }

    cardEl.style.display = 'block';

    // 1. Nickname & Survival Mastery Level
    const nameEl = document.getElementById('profile-player-name');
    if (nameEl) nameEl.textContent = state.searchedPlayerName;

    const lvlEl = document.getElementById('profile-survival-level');
    if (state.survivalMastery && state.survivalMastery.level) {
      const tier = state.survivalMastery.tier || 1;
      if (lvlEl) {
        lvlEl.style.display = 'inline-flex';
        lvlEl.innerHTML = `<img src="${getSurvivalTierIcon(tier)}" class="survival-tier-img" alt="Tier ${tier}" /> LVL ${state.survivalMastery.level}`;
        lvlEl.title = `Survival Mastery Tier ${tier} - Level ${state.survivalMastery.level}`;
      }
    } else {
      if (lvlEl) lvlEl.style.display = 'none';
    }

    // 2. Clan Badge
    const clanRow = document.getElementById('profile-clan-row');
    if (state.playerClan) {
      if (clanRow) clanRow.style.display = 'flex';
      const tagEl = document.getElementById('profile-clan-tag');
      const nameEl = document.getElementById('profile-clan-name');
      const lvlEl = document.getElementById('profile-clan-level');
      if (tagEl) tagEl.textContent = `[${state.playerClan.clanTag || ''}]`;
      if (nameEl) nameEl.textContent = state.playerClan.clanName || '';
      if (lvlEl) lvlEl.textContent = `LVL ${state.playerClan.clanLevel || 1}`;
    } else {
      if (clanRow) clanRow.style.display = 'none';
    }

    // 3. Ranked Tier Banner
    const rankedBanner = document.getElementById('profile-ranked-banner');
    const rStats = state.rankedStats ? (state.rankedStats['squad'] || state.rankedStats['squad-fpp'] || Object.values(state.rankedStats)[0]) : null;
    if (rStats && rStats.currentTier && rStats.currentTier.tier && rStats.currentTier.tier !== 'Unranked') {
      if (rankedBanner) rankedBanner.style.display = 'flex';
      const tierEl = document.getElementById('profile-ranked-tier');
      const rpEl = document.getElementById('profile-ranked-rp');
      const top10El = document.getElementById('profile-ranked-top10');
      const avgRankEl = document.getElementById('profile-ranked-rank');

      const tierStr = `${rStats.currentTier.tier.toUpperCase()} ${rStats.currentTier.subTier || ''}`.trim();
      if (tierEl) tierEl.textContent = tierStr;
      if (rpEl) rpEl.textContent = `${rStats.currentRankPoint || 0} RP (Best: ${rStats.bestRankPoint || 0})`;
      if (top10El) top10El.textContent = `${Math.round((rStats.top10Ratio || 0) * 100)}%`;
      if (avgRankEl) avgRankEl.textContent = `#${(rStats.avgRank || 0).toFixed(1)}`;
    } else {
      if (rankedBanner) rankedBanner.style.display = 'none';
    }

    // 4. Update Category Switcher Active State
    document.querySelectorAll('.profile-category-pill').forEach(pill => {
      const cat = pill.getAttribute('data-category') || 'normal';
      pill.classList.toggle('active', cat === (state.profileCategory || 'normal'));
    });

    // 5. Render Stats Grid
    renderProfileStatsGrid();
  }

  // AGGREGATE PLAYER STATS DYNAMICALLY OVER A CUSTOM DATE WINDOW
  function aggregateMatchesStats(matches, mode, isRanked, maxAgeDays = 0) {
    if (!Array.isArray(matches)) matches = [];

    let filtered = matches;
    if (isRanked) {
      filtered = filtered.filter(m => isRankedMatch(m));
    } else {
      filtered = filtered.filter(m => !isRankedMatch(m));
    }

    if (mode) {
      const targetMode = mode.toLowerCase();
      filtered = filtered.filter(m => (m.gameMode || '').toLowerCase().includes(targetMode));
    }

    if (maxAgeDays > 0) {
      const now = Date.now();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(m => {
        if (!m.playedAt) return false;
        const t = new Date(m.playedAt).getTime();
        return !isNaN(t) && (now - t) <= maxAgeMs;
      });
    }

    const rounds = filtered.length;
    if (rounds === 0) {
      return {
        roundsPlayed: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        losses: 0,
        damageDealt: 0,
        dBNOs: 0,
        assists: 0,
        revives: 0,
        heals: 0,
        boosts: 0,
        weaponsAcquired: 0,
        headshotKills: 0,
        longestKill: 0,
        roundMostKills: 0,
        walkDistance: 0,
        rideDistance: 0,
        swimDistance: 0,
        teamKills: 0,
        suicides: 0,
        roadKills: 0,
        vehicleDestroys: 0,
        timeSurvived: 0,
        avgRank: 0,
        top10s: 0,
        top10Ratio: 0,
        winRatio: 0,
        kda: 0
      };
    }

    let wins = 0;
    let top10s = 0;
    let kills = 0;
    let damageDealt = 0;
    let dbnos = 0;
    let assists = 0;
    let revives = 0;
    let heals = 0;
    let boosts = 0;
    let weaponsAcquired = 0;
    let headshotKills = 0;
    let longestKill = 0;
    let roundMostKills = 0;
    let walkDistance = 0;
    let rideDistance = 0;
    let swimDistance = 0;
    let teamKills = 0;
    let suicides = 0;
    let roadKills = 0;
    let vehicleDestroys = 0;
    let timeSurvived = 0;
    let rankSum = 0;

    filtered.forEach(m => {
      const s = m.stats || {};
      const winPlace = s.winPlace || 100;
      if (winPlace === 1) wins++;
      if (winPlace <= 10) top10s++;
      rankSum += winPlace;

      const mKills = s.kills || 0;
      kills += mKills;
      if (mKills > roundMostKills) roundMostKills = mKills;

      damageDealt += (s.damageDealt || 0);
      dbnos += (s.DBNOs || s.dBNOs || 0);
      assists += (s.assists || 0);
      revives += (s.revives || 0);
      heals += (s.heals || 0);
      boosts += (s.boosts || 0);
      weaponsAcquired += (s.weaponsAcquired || 0);
      headshotKills += (s.headshotKills || 0);
      if ((s.longestKill || 0) > longestKill) longestKill = s.longestKill || 0;
      walkDistance += (s.walkDistance || 0);
      rideDistance += (s.rideDistance || 0);
      swimDistance += (s.swimDistance || 0);
      teamKills += (s.teamKills || 0);
      if (s.deathType === 'suicide') suicides++;
      roadKills += (s.roadKills || 0);
      vehicleDestroys += (s.vehicleDestroys || 0);
      timeSurvived += (s.timeSurvived || 0);
    });

    const deaths = Math.max(1, rounds - wins);
    return {
      roundsPlayed: rounds,
      wins: wins,
      kills: kills,
      deaths: deaths,
      losses: deaths,
      damageDealt: damageDealt,
      dBNOs: dbnos,
      assists: assists,
      revives: revives,
      heals: heals,
      boosts: boosts,
      weaponsAcquired: weaponsAcquired,
      headshotKills: headshotKills,
      longestKill: longestKill,
      roundMostKills: roundMostKills,
      walkDistance: walkDistance,
      rideDistance: rideDistance,
      swimDistance: swimDistance,
      teamKills: teamKills,
      suicides: suicides,
      roadKills: roadKills,
      vehicleDestroys: vehicleDestroys,
      timeSurvived: timeSurvived,
      avgRank: (rankSum / rounds),
      top10s: top10s,
      top10Ratio: (top10s / rounds),
      winRatio: (wins / rounds),
      kda: (kills / deaths)
    };
  }

  function renderProfileStatsGrid() {
    const gridEl = document.getElementById('profile-stats-grid');
    const matchesBadge = document.getElementById('profile-total-matches-badge');
    const titleEl = document.getElementById('profile-career-title');
    if (!gridEl) return;

    const isRanked = (state.profileCategory === 'ranked');
    const mode = state.activeProfileMode || 'squad';
    const hasDateFilter = (state.profileDateFilterDays > 0);
    const dateDesc = state.profileDateFilterDays === 1 ? 'TODAY' : `LAST ${state.profileDateFilterDays} DAYS`;

    if (titleEl) {
      if (hasDateFilter) {
        titleEl.textContent = `${isRanked ? 'RANKED' : 'NORMAL'} STATS (${dateDesc})`;
      } else {
        titleEl.textContent = isRanked ? 'CURRENT SEASON RANKED' : 'LIFETIME CAREER STATS';
      }
    }

    // 1. If user selected a custom date window (Today, 7 days, etc.), calculate dynamically from matches
    if (hasDateFilter) {
      const agg = aggregateMatchesStats(state.currentMatches, mode, isRanked, state.profileDateFilterDays);
      const rounds = agg.roundsPlayed;

      if (matchesBadge) {
        matchesBadge.textContent = `${rounds.toLocaleString()} Matches (${state.profileDateFilterDays === 1 ? 'Today' : `Last ${state.profileDateFilterDays}d`})`;
      }

      if (rounds === 0) {
        gridEl.innerHTML = `<div style="grid-column: span 3; font-size: 11px; color: var(--text-muted); text-align: center; padding: 12px;">No <b>${isRanked ? 'Ranked' : 'Normal'}</b> matches found in <b>${mode.toUpperCase()}</b> for ${state.profileDateFilterDays === 1 ? 'today' : `the past ${state.profileDateFilterDays} days`}.</div>`;
        return;
      }

      const kd = agg.kda.toFixed(2);
      const winRate = `${Math.round(agg.winRatio * 100)}%`;
      const top10 = `${Math.round(agg.top10Ratio * 100)}%`;
      const adr = Math.round(agg.damageDealt / Math.max(1, rounds));
      const hsRate = agg.kills > 0 ? `${Math.round((agg.headshotKills / agg.kills) * 100)}%` : '0%';
      const avgRank = agg.avgRank ? `#${agg.avgRank.toFixed(1)}` : '--';

      gridEl.innerHTML = `
        <div class="profile-stat-box" title="Calculated Kill / Death Ratio in this period">
          <div class="profile-stat-value highlight-cyan">${kd}</div>
          <div class="profile-stat-label">${isRanked ? 'Ranked K/D' : 'K/D Ratio'}</div>
        </div>
        <div class="profile-stat-box" title="Win Rate % (${agg.wins} Chicken Dinners)">
          <div class="profile-stat-value highlight-gold">${winRate}</div>
          <div class="profile-stat-label">Wins (${agg.wins}) 🏆</div>
        </div>
        <div class="profile-stat-box" title="Top 10 Finish Rate in this period">
          <div class="profile-stat-value highlight-green">${top10}</div>
          <div class="profile-stat-label">Top 10 Rate</div>
        </div>
        <div class="profile-stat-box" title="Average Damage per Round (ADR)">
          <div class="profile-stat-value highlight-green">${adr}</div>
          <div class="profile-stat-label">ADR</div>
        </div>
        <div class="profile-stat-box" title="Total Kills in this period">
          <div class="profile-stat-value">${agg.kills.toLocaleString()}</div>
          <div class="profile-stat-label">Kills 🎯</div>
        </div>
        <div class="profile-stat-box" title="Average Match Finish in this period">
          <div class="profile-stat-value highlight-cyan">${avgRank}</div>
          <div class="profile-stat-label">Avg Placement</div>
        </div>
        <div class="profile-stat-box" title="Headshot Accuracy in this period">
          <div class="profile-stat-value">${hsRate}</div>
          <div class="profile-stat-label">Headshots</div>
        </div>
        <div class="profile-stat-box" title="Knocks: ${agg.dBNOs} | Assists: ${agg.assists} | Revives: ${agg.revives}">
          <div class="profile-stat-value">${agg.dBNOs.toLocaleString()}</div>
          <div class="profile-stat-label">Knocks (dBNO)</div>
        </div>
        <div class="profile-stat-box" title="Best Game & Longest Sniper Kill">
          <div class="profile-stat-value highlight-gold">${agg.roundMostKills} / ${Math.round(agg.longestKill)}m</div>
          <div class="profile-stat-label">Best K / Longest</div>
        </div>
      `;
      return;
    }

    // 2. All Time (Lifetime) Mode: Official Krafton Career or Current Season Ranked
    if (isRanked) {
      if (!state.rankedStats) {
        gridEl.innerHTML = '<div style="grid-column: span 3; font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">Loading official ranked stats...</div>';
        return;
      }

      const s = state.rankedStats[mode];
      if (!s || s.roundsPlayed === 0) {
        if (matchesBadge) matchesBadge.textContent = '0 Ranked Matches';
        gridEl.innerHTML = `<div style="grid-column: span 3; font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">No ranked matches recorded in <b>${mode.toUpperCase()}</b> for Current Season.</div>`;
        return;
      }

      const rounds = s.roundsPlayed || 0;
      const wins = s.wins || 0;
      const kills = s.kills || 0;
      const deaths = s.deaths || (rounds - wins) || 1;
      const kd = (kills / Math.max(1, deaths)).toFixed(2);
      const winRate = ((wins / Math.max(1, rounds)) * 100).toFixed(1) + '%';
      const top10 = Math.round((s.top10Ratio || 0) * 100) + '%';
      const adr = Math.round((s.damageDealt || 0) / Math.max(1, rounds));
      const curTier = s.currentTier?.tier ? `${s.currentTier.tier.toUpperCase()} ${s.currentTier.subTier || ''}`.trim() : 'UNRANKED';
      const curRp = s.currentRankPoint || 0;
      const bestTier = s.bestTier?.tier ? `${s.bestTier.tier.toUpperCase()} ${s.bestTier.subTier || ''}`.trim() : curTier;
      const bestRp = s.bestRankPoint || curRp;
      const avgRank = s.avgRank ? `#${s.avgRank.toFixed(1)}` : '--';
      const assists = s.assists || 0;
      const revives = s.revives || 0;
      const dbnos = s.dBNOs || 0;

      if (matchesBadge) matchesBadge.textContent = `${rounds.toLocaleString()} Ranked Matches`;

      gridEl.innerHTML = `
        <div class="profile-stat-box" title="Current Ranked Tier & RP">
          <div class="profile-stat-value highlight-gold">${curTier}</div>
          <div class="profile-stat-label">${curRp} RP 🎖️</div>
        </div>
        <div class="profile-stat-box" title="Peak Season Tier">
          <div class="profile-stat-value highlight-cyan">${bestTier}</div>
          <div class="profile-stat-label">Peak: ${bestRp} RP</div>
        </div>
        <div class="profile-stat-box" title="Ranked Kill / Death Ratio">
          <div class="profile-stat-value highlight-cyan">${kd}</div>
          <div class="profile-stat-label">Ranked K/D</div>
        </div>
        <div class="profile-stat-box" title="Ranked Win Rate (${wins} Chicken Dinners)">
          <div class="profile-stat-value highlight-gold">${winRate}</div>
          <div class="profile-stat-label">Ranked Wins 🏆</div>
        </div>
        <div class="profile-stat-box" title="Top 10 Finish Rate">
          <div class="profile-stat-value highlight-green">${top10}</div>
          <div class="profile-stat-label">Top 10 Rate</div>
        </div>
        <div class="profile-stat-box" title="Ranked Average Damage per Round">
          <div class="profile-stat-value highlight-green">${adr}</div>
          <div class="profile-stat-label">Ranked ADR</div>
        </div>
        <div class="profile-stat-box" title="Total Ranked Kills">
          <div class="profile-stat-value">${kills.toLocaleString()}</div>
          <div class="profile-stat-label">Ranked Kills 🎯</div>
        </div>
        <div class="profile-stat-box" title="Average Match Placement">
          <div class="profile-stat-value highlight-cyan">${avgRank}</div>
          <div class="profile-stat-label">Avg Placement</div>
        </div>
        <div class="profile-stat-box" title="Knocks: ${dbnos.toLocaleString()} | Assists: ${assists.toLocaleString()} | Revives: ${revives.toLocaleString()}">
          <div class="profile-stat-value">${dbnos.toLocaleString()}</div>
          <div class="profile-stat-label">Knocks (dBNO)</div>
        </div>
      `;
      return;
    }

    // NORMAL / LIFETIME STATS (ALL TIME)
    if (!state.lifetimeStats) {
      gridEl.innerHTML = '<div style="grid-column: span 3; font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">Loading official career stats...</div>';
      return;
    }

    const s = state.lifetimeStats[mode];
    if (!s || s.roundsPlayed === 0) {
      if (matchesBadge) matchesBadge.textContent = '0 Matches';
      gridEl.innerHTML = `<div style="grid-column: span 3; font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">No recorded games in <b>${mode.toUpperCase()}</b>.</div>`;
      return;
    }

    const rounds = s.roundsPlayed || 0;
    const wins = s.wins || 0;
    const kills = s.kills || 0;
    const deaths = s.losses || (rounds - wins) || 1;
    const kd = (kills / Math.max(1, deaths)).toFixed(2);
    const winRate = ((wins / Math.max(1, rounds)) * 100).toFixed(1) + '%';
    const adr = Math.round((s.damageDealt || 0) / Math.max(1, rounds));
    const hsRate = kills > 0 ? Math.round(((s.headshotKills || 0) / kills) * 100) + '%' : '0%';
    const longest = Math.round(s.longestKill || 0) + 'm';
    const bestKills = s.roundMostKills || 0;
    const dbnos = s.dBNOs || 0;

    if (matchesBadge) matchesBadge.textContent = `${rounds.toLocaleString()} Lifetime Matches`;

    gridEl.innerHTML = `
      <div class="profile-stat-box" title="Kill / Death Ratio">
        <div class="profile-stat-value highlight-cyan">${kd}</div>
        <div class="profile-stat-label">K/D Ratio</div>
      </div>
      <div class="profile-stat-box" title="Win Rate % (${wins} Chicken Dinners)">
        <div class="profile-stat-value highlight-gold">${winRate}</div>
        <div class="profile-stat-label">Win Rate 🏆</div>
      </div>
      <div class="profile-stat-box" title="Average Damage per Round">
        <div class="profile-stat-value highlight-green">${adr}</div>
        <div class="profile-stat-label">ADR</div>
      </div>
      <div class="profile-stat-box" title="Total Career Kills">
        <div class="profile-stat-value">${kills.toLocaleString()}</div>
        <div class="profile-stat-label">Total Kills 🎯</div>
      </div>
      <div class="profile-stat-box" title="Total Chicken Dinners">
        <div class="profile-stat-value highlight-gold">${wins}</div>
        <div class="profile-stat-label">Wins 🏆</div>
      </div>
      <div class="profile-stat-box" title="Headshot Accuracy Percentage">
        <div class="profile-stat-value">${hsRate}</div>
        <div class="profile-stat-label">Headshots</div>
      </div>
      <div class="profile-stat-box" title="Longest Sniper Elimination">
        <div class="profile-stat-value">${longest}</div>
        <div class="profile-stat-label">Longest Kill 🏹</div>
      </div>
      <div class="profile-stat-box" title="Most Kills in a Single Match">
        <div class="profile-stat-value highlight-cyan">${bestKills}</div>
        <div class="profile-stat-label">Best Game</div>
      </div>
      <div class="profile-stat-box" title="Knocks: ${dbnos.toLocaleString()}">
        <div class="profile-stat-value">${dbnos.toLocaleString()}</div>
        <div class="profile-stat-label">Knocks (dBNO)</div>
      </div>
    `;
  }

  // SEARCH PLAYER MATCHES
  async function performPlayerSearch() {
    const input = document.getElementById('sidebar-replay-input');
    const statusEl = document.getElementById('sidebar-replay-status');
    const listEl = document.getElementById('sidebar-matches-list');

    const name = input ? input.value.trim() : '';
    if (!name) {
      if (statusEl) statusEl.textContent = 'Please enter a PUBG player nickname.';
      return;
    }

    state.searchedPlayerName = name;
    localStorage.setItem('pubg_replay_last_player', name);
    localStorage.setItem('pubg_replay_last_shard', state.selectedShard);

    if (statusEl) {
      statusEl.innerHTML = `<span class="radar-pulse-icon">📡</span> Contacting Official Krafton API for <b>${name}</b> (${state.selectedShard.toUpperCase()})...`;
    }
    if (listEl) {
      listEl.innerHTML = `<div class="empty-matches-prompt"><span class="radar-pulse-icon" style="font-size: 32px;">📡</span><p>Connecting to Krafton & Replay CDN...</p></div>`;
    }

    // 1. Fetch Official Krafton Player Profile, Clan, Career Stats & Real-Time Matches in parallel
    const kraftonPromise = fetchKraftonPlayer(name, state.selectedShard).then(async (kPlayer) => {
      state.playerProfile = { id: kPlayer.id, name: kPlayer.attributes?.name, clanId: kPlayer.attributes?.clanId };

      // Set date slider max based on account creation date if available
      if (kPlayer.attributes?.createdAt) {
        const createdDate = new Date(kPlayer.attributes.createdAt);
        if (!isNaN(createdDate.getTime())) {
          const accountAgeDays = Math.max(30, Math.ceil((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
          const sliderEl = document.getElementById('match-date-slider');
          if (sliderEl) sliderEl.max = accountAgeDays;
          const profSlider = document.getElementById('profile-date-slider');
          if (profSlider) profSlider.max = accountAgeDays;
          const intelSlider = document.getElementById('intel-date-slider');
          if (intelSlider) intelSlider.max = accountAgeDays;
        }
      }

      const [clan, lifetime, ranked, survival, kraftonRecentMatches] = await Promise.all([
        kPlayer.attributes?.clanId ? fetchKraftonClan(kPlayer.attributes.clanId, state.selectedShard) : null,
        fetchKraftonLifetimeStats(kPlayer.id, state.selectedShard),
        fetchKraftonRankedStats(kPlayer.id, state.selectedShard),
        fetchKraftonSurvivalMastery(kPlayer.id, state.selectedShard),
        fetchRecentKraftonMatches(kPlayer, state.selectedShard, 20)
      ]);

      state.playerClan = clan;
      state.lifetimeStats = lifetime;
      state.rankedStats = ranked;
      state.survivalMastery = survival;

      if (lifetime) {
        if (lifetime['squad'] && (lifetime['squad'].roundsPlayed > 0 || !lifetime['squad-fpp'])) {
          state.activeProfileMode = 'squad';
        } else if (lifetime['squad-fpp'] && lifetime['squad-fpp'].roundsPlayed > 0) {
          state.activeProfileMode = 'squad-fpp';
        }
      }

      renderPlayerProfileCard();
      return kraftonRecentMatches || [];
    }).catch(err => {
      console.warn('Krafton profile fetch note:', err.message);
      return [];
    });

    // 2. Fetch match history (via pubg.sh and merge with Krafton real-time today matches)
    try {
      const [playerData, kMatches] = await Promise.all([
        fetchPubgShPlayerMatches(name, state.selectedShard).catch(e => {
          console.warn('pubg.sh matches fetch warning:', e.message);
          return { matches: [] };
        }),
        kraftonPromise
      ]);

      // Deduplicate: place Krafton's real-time matches (containing today's competitive ranked matches) at top
      const kIds = new Set((kMatches || []).map(m => m.id));
      const olderMatches = (playerData.matches || []).filter(m => !kIds.has(m.id));
      state.currentMatches = [...(kMatches || []), ...olderMatches];

      if (statusEl) {
        statusEl.innerHTML = `Loaded <b>${state.currentMatches.length}</b> matches for <b>${name}</b>. Click any match to play 2D replay or view dossier:`;
      }

      renderProfileStatsGrid();
      renderSidebarMatches();
      showMatchesSubpane();
    } catch (err) {
      console.warn('Match fetching fallback...', err.message);
      const kMatches = await kraftonPromise;
      if (kMatches && kMatches.length > 0) {
        state.currentMatches = kMatches;
        if (statusEl) statusEl.innerHTML = `Loaded <b>${state.currentMatches.length}</b> matches directly from Krafton API:`;
        renderProfileStatsGrid();
        renderSidebarMatches();
        showMatchesSubpane();
      } else {
        if (statusEl) statusEl.innerHTML = `<span style="color: #ff3b5c;">⚠️ ${err.message}</span>`;
        if (listEl) listEl.innerHTML = `<div class="empty-matches-prompt" style="color: #ff3b5c;">${err.message}</div>`;
      }
    }
  }

  // Helper: check if match is Ranked/Competitive
  function isRankedMatch(m) {
    if (!m) return false;
    const mode = (m.gameMode || '').toLowerCase();
    const type = (m.matchType || '').toLowerCase();
    return mode.includes('competitive') || type === 'competitive';
  }

  // RENDER MATCHES LIST IN SIDEBAR
  function renderSidebarMatches() {
    const listEl = document.getElementById('sidebar-matches-list');
    if (!listEl) return;

    let matches = state.currentMatches;

    // 1. Recency / Date Filter (Slider & Chips)
    if (state.dateFilterDays && state.dateFilterDays > 0) {
      const now = Date.now();
      const maxAgeMs = state.dateFilterDays * 24 * 60 * 60 * 1000;
      matches = matches.filter(m => {
        if (!m.playedAt) return false;
        const matchTime = new Date(m.playedAt).getTime();
        return !isNaN(matchTime) && (now - matchTime) <= maxAgeMs;
      });
    }

    // 2. Match Category / GameMode Filter
    if (state.activeFilter === 'ranked') {
      matches = matches.filter(m => isRankedMatch(m));
    } else if (state.activeFilter === 'normal') {
      matches = matches.filter(m => !isRankedMatch(m));
    } else if (state.activeFilter !== 'all') {
      matches = matches.filter(m => (m.gameMode || '').toLowerCase().includes(state.activeFilter));
    }

    const countLabel = document.getElementById('replay-matches-count-label');
    if (countLabel) countLabel.textContent = `Matches (${matches.length})`;

    if (matches.length === 0) {
      const filterDesc = state.activeFilter.toUpperCase();
      const dateDesc = state.dateFilterDays === 1 ? 'TODAY' : (state.dateFilterDays > 0 ? `PAST ${state.dateFilterDays} DAYS` : '');
      listEl.innerHTML = `<div class="empty-matches-prompt">No matches found for filter: <b>${filterDesc}</b> ${dateDesc ? `(${dateDesc})` : ''}</div>`;
      return;
    }

    listEl.innerHTML = matches.map((m, idx) => {
      const mapDisplayName = PUBG_MAP_DISPLAY_NAMES[m.mapName] || m.mapName || 'Taego';
      const isWin = (m.stats.winPlace === 1);
      const isTop10 = (m.stats.winPlace <= 10 && !isWin);

      const rankBadgeClass = isWin ? 'rank-win' : (isTop10 ? 'rank-top10' : 'rank-normal');
      const rankText = isWin ? '🏆 #1 CHICKEN DINNER' : `#${m.stats.winPlace} Finish`;

      const isRanked = isRankedMatch(m);
      const categoryTag = isRanked
        ? `<span class="match-category-tag ranked-tag">🎖️ RANKED</span>`
        : `<span class="match-category-tag normal-tag">NORMAL</span>`;

      const rawMode = (m.gameMode || 'squad').toUpperCase();
      const modeText = rawMode.replace('COMPETITIVE-', '');

      const dateText = new Date(m.playedAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const durationText = `${Math.floor(m.durationSeconds / 60)}m ${m.durationSeconds % 60}s`;

      const dmg = Math.round(m.stats.damageDealt || 0);
      const dbnos = m.stats.DBNOs || 0;
      const assists = m.stats.assists || 0;
      const deathType = (m.stats.deathType || 'alive').toLowerCase();
      let statusBadge = '';
      if (deathType === 'alive') {
        statusBadge = `<span class="match-card-status-badge status-alive">🏆 SURVIVED</span>`;
      } else if (deathType === 'byzone') {
        statusBadge = `<span class="match-card-status-badge status-byzone">⚡ BLUE ZONE</span>`;
      } else if (deathType === 'suicide') {
        statusBadge = `<span class="match-card-status-badge status-suicide">⚠️ ACCIDENT</span>`;
      } else {
        statusBadge = `<span class="match-card-status-badge status-byplayer">💀 BY ENEMY</span>`;
      }

      return `
        <div class="replay-match-card ${isWin ? 'winner-card' : ''}" data-idx="${idx}" title="Click to view 2D Replay or Full Combat Dossier on ${mapDisplayName}">
          <div class="match-card-top">
            <span class="match-map-tag">${mapDisplayName}</span>
            ${categoryTag}
            <span class="match-mode-tag">${modeText}</span>
            <span class="match-rank-badge ${rankBadgeClass}">${rankText}</span>
          </div>
          <div class="match-card-middle">
            <div class="match-stat-col">
              <span class="stat-lbl">Kills / Dmg</span>
              <span class="stat-val ${m.stats.kills > 0 ? 'highlight-kills' : ''}">🎯 ${m.stats.kills} <span style="font-size: 10px; color: #ffca28;">(${dmg} dmg)</span></span>
            </div>
            <div class="match-stat-col">
              <span class="stat-lbl">Knock / Ast</span>
              <span class="stat-val">💥 ${dbnos} / 🤝 ${assists}</span>
            </div>
            <div class="match-stat-col">
              <span class="stat-lbl">Duration</span>
              <span class="stat-val">${durationText}</span>
            </div>
            <div class="match-stat-col">
              <span class="stat-lbl">Played</span>
              <span class="stat-val">${dateText}</span>
            </div>
          </div>
          <div class="match-card-bottom-row">
            ${statusBadge}
            <div class="match-actions-wrap">
              <button class="match-action-btn match-intel-btn" data-intel-idx="${idx}" title="Open Full Official Match Dossier & Squad Performance">📊 Full Intel</button>
              <button class="match-action-btn match-replay-btn" data-replay-idx="${idx}" title="Launch 2D Map Telemetry Replay">▶️ 2D Replay</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card action handlers
    listEl.querySelectorAll('.match-intel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-intel-idx'), 10);
        const match = matches[idx];
        if (match) {
          openMatchIntelModal(match);
        }
      });
    });

    listEl.querySelectorAll('.match-replay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-replay-idx'), 10);
        const match = matches[idx];
        if (match) {
          loadMatchReplay(match, state.searchedPlayerName);
        }
      });
    });

    listEl.querySelectorAll('.replay-match-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        const match = matches[idx];
        if (match) {
          loadMatchReplay(match, state.searchedPlayerName);
        }
      });
    });
  }

  // TAB SWITCHING (Mortar & Intel vs 2D Replays)
  function switchSidebarTab(tabName) {
    const tabMortarBtn = document.getElementById('tab-btn-mortar');
    const tabReplayBtn = document.getElementById('tab-btn-replay');
    const viewMortar = document.getElementById('mortar-sidebar-view');
    const viewReplay = document.getElementById('replay-sidebar-view');

    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('collapsed')) {
      const toggleBtn = document.getElementById('toggle-sidebar-btn');
      if (toggleBtn) toggleBtn.click();
    }

    if (tabName === 'replay') {
      if (tabMortarBtn) tabMortarBtn.classList.remove('active');
      if (tabReplayBtn) tabReplayBtn.classList.add('active');
      if (viewMortar) {
        viewMortar.classList.remove('active');
        viewMortar.style.display = 'none';
      }
      if (viewReplay) {
        viewReplay.classList.add('active');
        viewReplay.style.display = 'block';
      }

      // Auto-focus search input and auto-search if empty
      const input = document.getElementById('sidebar-replay-input');
      if (input) {
        if (!input.value) {
          const saved = localStorage.getItem('pubg_replay_last_player') || 'XXmariyahXX';
          input.value = saved;
        }
        // Auto-search if no matches are loaded yet
        if (!state.matches || state.matches.length === 0) {
          performPlayerSearch();
        }
      }
    } else {
      if (tabMortarBtn) tabMortarBtn.classList.add('active');
      if (tabReplayBtn) tabReplayBtn.classList.remove('active');
      if (viewMortar) {
        viewMortar.classList.add('active');
        viewMortar.style.display = 'block';
      }
      if (viewReplay) {
        viewReplay.classList.remove('active');
        viewReplay.style.display = 'none';
      }

      // If active in replay, exit replay cleanly
      if (state.isReplayActive) {
        exitReplayMode(false);
      }

      // Invalidate Leaflet map size
      if (window.PUBG_APP && window.PUBG_APP.getLeafletMap()) {
        setTimeout(() => {
          window.PUBG_APP.getLeafletMap().invalidateSize();
        }, 50);
      }
    }
  }

  // SETUP EVENT LISTENERS
  function setupReplayEvents() {
    // Top Tabs
    const tabMortarBtn = document.getElementById('tab-btn-mortar');
    const tabReplayBtn = document.getElementById('tab-btn-replay');
    if (tabMortarBtn) tabMortarBtn.addEventListener('click', () => switchSidebarTab('mortar'));
    if (tabReplayBtn) tabReplayBtn.addEventListener('click', () => switchSidebarTab('replay'));

    // Floating header buttons
    const toolReplayBtn = document.getElementById('tool-replays-btn');
    if (toolReplayBtn) toolReplayBtn.addEventListener('click', () => switchSidebarTab('replay'));

    const floatReplayBtn = document.getElementById('floating-replay-btn');
    if (floatReplayBtn) floatReplayBtn.addEventListener('click', () => switchSidebarTab('replay'));

    // Platform Pills
    document.querySelectorAll('.platform-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.platform-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.selectedShard = pill.getAttribute('data-shard');
      });
    });

    // Search button & Enter key
    const searchBtn = document.getElementById('sidebar-replay-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', performPlayerSearch);

    const input = document.getElementById('sidebar-replay-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performPlayerSearch();
      });
    }

    // Mode Filter Chips
    document.querySelectorAll('.mode-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.mode-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.getAttribute('data-filter') || 'all';
        renderSidebarMatches();
      });
    });

    // Date / Recency Filter Chips (All Time, Today, 7 Days, 30 Days) & Slider
    const dateSlider = document.getElementById('match-date-slider');
    const dateSliderLabel = document.getElementById('date-slider-val');

    const updateDateFilterDisplay = (days) => {
      state.dateFilterDays = days;
      if (dateSlider) dateSlider.value = days;
      if (dateSliderLabel) {
        if (days === 0) dateSliderLabel.textContent = 'All Time';
        else if (days === 1) dateSliderLabel.textContent = 'Today (24h)';
        else dateSliderLabel.textContent = `Last ${days} Days`;
      }
      document.querySelectorAll('.date-filter-chip').forEach(chip => {
        const cDays = parseInt(chip.getAttribute('data-days'), 10);
        chip.classList.toggle('active', cDays === days);
      });
      renderSidebarMatches();
    };

    document.querySelectorAll('.date-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const days = parseInt(chip.getAttribute('data-days'), 10);
        updateDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    });

    if (dateSlider) {
      dateSlider.addEventListener('input', () => {
        const days = parseInt(dateSlider.value, 10);
        updateDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    }

    // Profile Date Filter Chips & Slider (for Profile Card performance aggregation)
    const profDateSlider = document.getElementById('profile-date-slider');
    const profDateSliderLabel = document.getElementById('profile-date-slider-val');

    const updateProfileDateFilterDisplay = (days) => {
      state.profileDateFilterDays = days;
      if (profDateSlider) profDateSlider.value = days;
      if (profDateSliderLabel) {
        if (days === 0) profDateSliderLabel.textContent = 'All Time';
        else if (days === 1) profDateSliderLabel.textContent = 'Today (24h)';
        else profDateSliderLabel.textContent = `Last ${days} Days`;
      }
      document.querySelectorAll('.profile-date-chip').forEach(chip => {
        const cDays = parseInt(chip.getAttribute('data-pdays'), 10);
        chip.classList.toggle('active', cDays === days);
      });
      renderProfileStatsGrid();
    };

    document.querySelectorAll('.profile-date-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const days = parseInt(chip.getAttribute('data-pdays'), 10);
        updateProfileDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    });

    if (profDateSlider) {
      profDateSlider.addEventListener('input', () => {
        const days = parseInt(profDateSlider.value, 10);
        updateProfileDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    }

    // Profile Category Switcher (Normal vs Ranked Matches)
    document.querySelectorAll('.profile-category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.profile-category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.profileCategory = pill.getAttribute('data-category') || 'normal';
        renderProfileStatsGrid();
      });
    });

    // Profile Career Mode Tabs
    document.querySelectorAll('.profile-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeProfileMode = tab.getAttribute('data-pmode') || 'squad';
        renderProfileStatsGrid();
      });
    });

    // Back to Matches button in Roster view
    const backBtn = document.getElementById('roster-back-to-matches-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        showMatchesSubpane();
      });
    }

    // Roster Search / Filter
    const rosterSearch = document.getElementById('roster-search-input');
    if (rosterSearch) {
      rosterSearch.addEventListener('input', () => {
        renderSidebarRoster(rosterSearch.value);
      });
    }

    // Replay Bar: Play / Pause
    const playBtn = document.getElementById('replay-play-btn');
    if (playBtn) playBtn.addEventListener('click', togglePlayPause);

    // Replay Bar: Scrub slider
    const slider = document.getElementById('replay-scrub-slider');
    if (slider) {
      slider.addEventListener('input', () => {
        state.currentTime = parseFloat(slider.value);
        renderReplayFrame(state.currentTime);
      });
    }

    // Replay Bar: Speed Buttons
    document.querySelectorAll('.replay-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.getAttribute('data-speed'));
        if (speed) setReplaySpeed(speed);
      });
    });

    // Replay Bar: Route Trail Toggle
    const trailToggle = document.getElementById('replay-toggle-trail');
    if (trailToggle) {
      trailToggle.addEventListener('change', () => {
        if (state.trailPolyline && state.replayLayerGroup) {
          if (trailToggle.checked) {
            state.replayLayerGroup.addLayer(state.trailPolyline);
          } else {
            state.replayLayerGroup.removeLayer(state.trailPolyline);
          }
        }
      });
    }

    // Replay Bar: Squad Only Toggle
    const squadToggle = document.getElementById('replay-toggle-squad-only');
    if (squadToggle) {
      squadToggle.addEventListener('change', () => {
        renderReplayFrame(state.currentTime);
      });
    }

    // Replay Bar: Kills & Tracers Toggles
    const killsToggle = document.getElementById('replay-toggle-kills');
    if (killsToggle) {
      killsToggle.addEventListener('change', () => {
        renderReplayFrame(state.currentTime);
      });
    }

    const tracersToggle = document.getElementById('replay-toggle-tracers');
    if (tracersToggle) {
      tracersToggle.addEventListener('change', () => {
        renderReplayFrame(state.currentTime);
      });
    }

    // Unified Theme Switcher: Replay Bar, Floating Map Button, Sidebar Button, and 'T' Shortcut
    const updateThemeUi = () => {
      const isNew = (state.theme === 'new');
      const textNew = 'Icons: New (White)';
      const textOld = 'Icons: Old (Color)';
      const shortNew = 'Icons: New';
      const shortOld = 'Icons: Old';

      const replayLabel = document.getElementById('replay-theme-label');
      if (replayLabel) replayLabel.textContent = isNew ? shortNew : shortOld;

      const floatingLabel = document.getElementById('floating-theme-label');
      if (floatingLabel) floatingLabel.textContent = isNew ? shortNew : shortOld;

      const sidebarLabel = document.getElementById('sidebar-theme-label');
      if (sidebarLabel) sidebarLabel.textContent = isNew ? textNew : textOld;
    };

    const toggleIconTheme = () => {
      state.theme = (state.theme === 'new') ? 'old' : 'new';
      localStorage.setItem('pubg_replay_theme', state.theme);
      updateThemeUi();
      if (state.isReplayActive) {
        renderReplayFrame(state.currentTime);
      }
      if (window.PUBG_APP && window.PUBG_APP.showToast) {
        window.PUBG_APP.showToast(`Player Icons: ${state.theme === 'new' ? 'New (Minimalist White)' : 'Old (Classic Tactical)'}`);
      }
    };

    const themeBtn = document.getElementById('replay-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleIconTheme);

    const floatThemeBtn = document.getElementById('floating-theme-btn');
    if (floatThemeBtn) floatThemeBtn.addEventListener('click', toggleIconTheme);

    const sidebarThemeBtn = document.getElementById('sidebar-theme-toggle-btn');
    if (sidebarThemeBtn) sidebarThemeBtn.addEventListener('click', toggleIconTheme);

    updateThemeUi();

    // Replay Bar: Exit button
    const exitBtn = document.getElementById('replay-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        exitReplayMode(true);
      });
    }

    // Classified Intel Modal Triggers
    const openIntelBtn = document.getElementById('open-player-intel-btn');
    if (openIntelBtn) {
      openIntelBtn.addEventListener('click', () => {
        openPlayerClassifiedIntel(state.searchedPlayerName, state.selectedShard);
      });
    }

    const rosterIntelBtn = document.getElementById('roster-view-full-intel-btn');
    if (rosterIntelBtn) {
      rosterIntelBtn.addEventListener('click', () => {
        openPlayerClassifiedIntel(state.focusPlayerName, state.selectedShard);
      });
    }

    // Classified Intel Category Switcher (Normal Career vs Ranked Season)
    document.querySelectorAll('.intel-category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.intel-category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        intelModalState.category = pill.getAttribute('data-icategory') || 'normal';
        renderIntelModalMode(intelModalState.activeMode);
      });
    });

    // Classified Intel Mode Tabs
    document.querySelectorAll('.intel-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.intel-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        intelModalState.activeMode = tab.getAttribute('data-imode') || 'squad';
        renderIntelModalMode(intelModalState.activeMode);
      });
    });

    // Classified Intel Modal Date Filter Chips & Slider
    const intelDateSlider = document.getElementById('intel-date-slider');
    const intelDateSliderLabel = document.getElementById('intel-date-slider-val');

    const updateIntelDateFilterDisplay = (days) => {
      intelModalState.intelDateFilterDays = days;
      if (intelDateSlider) intelDateSlider.value = days;
      if (intelDateSliderLabel) {
        if (days === 0) intelDateSliderLabel.textContent = 'All Time';
        else if (days === 1) intelDateSliderLabel.textContent = 'Today (24h)';
        else intelDateSliderLabel.textContent = `Last ${days} Days`;
      }
      document.querySelectorAll('.intel-date-chip').forEach(chip => {
        const cDays = parseInt(chip.getAttribute('data-idays'), 10);
        chip.classList.toggle('active', cDays === days);
      });
      renderIntelModalMode(intelModalState.activeMode);
    };

    document.querySelectorAll('.intel-date-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const days = parseInt(chip.getAttribute('data-idays'), 10);
        updateIntelDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    });

    if (intelDateSlider) {
      intelDateSlider.addEventListener('input', () => {
        const days = parseInt(intelDateSlider.value, 10);
        updateIntelDateFilterDisplay(isNaN(days) ? 0 : days);
      });
    }

    // Copy Official Account ID to clipboard
    const copyIdBtn = document.getElementById('intel-copy-id-btn');
    if (copyIdBtn) {
      copyIdBtn.addEventListener('click', () => {
        const accIdEl = document.getElementById('intel-account-id');
        if (accIdEl && accIdEl.textContent) {
          navigator.clipboard.writeText(accIdEl.textContent).then(() => {
            if (window.PUBG_APP && window.PUBG_APP.showToast) {
              window.PUBG_APP.showToast('Official Master Account ID copied to clipboard!');
            }
          }).catch(() => {
            if (window.PUBG_APP && window.PUBG_APP.showToast) {
              window.PUBG_APP.showToast('Account ID: ' + accIdEl.textContent);
            }
          });
        }
      });
    }

    // Close Classified Intel Modal
    document.querySelectorAll('[data-close="modal-player-intel"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('modal-player-intel');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close Match Intel Modal
    document.querySelectorAll('[data-close="modal-match-intel"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('modal-match-intel');
        if (modal) modal.classList.remove('open');
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        const viewReplay = document.getElementById('replay-sidebar-view');
        if (viewReplay && viewReplay.style.display !== 'none' && !state.isReplayActive) {
          switchSidebarTab('mortar');
        } else {
          switchSidebarTab('replay');
        }
      } else if (e.key === 't' || e.key === 'T') {
        toggleIconTheme();
      } else if (state.isReplayActive) {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlayPause();
        } else if (e.key === 'ArrowLeft') {
          state.currentTime = Math.max(0, state.currentTime - 10);
          renderReplayFrame(state.currentTime);
        } else if (e.key === 'ArrowRight') {
          state.currentTime = Math.min(state.maxDuration, state.currentTime + 10);
          renderReplayFrame(state.currentTime);
        }
      }
    });
  }

  // EXPORT TO WINDOW
  window.PUBG_REPLAY = {
    switchSidebarTab,
    performPlayerSearch,
    loadMatchReplay,
    setFocusPlayer,
    exitReplayMode,
    isReplayActive: () => !!(state && state.isReplayActive),
    getState: () => state
  };

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupReplayEvents);
  } else {
    setupReplayEvents();
  }
})();


