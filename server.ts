import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'GymTracker Pro Windows Desktop',
      version: '2.24.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 🚀 SERVER-SIDE APPLICATION UPDATE SYSTEM ENDPOINTS
  const releasesDatabase = [
    {
      version: '2.25.0',
      channel: 'stable',
      releaseDate: '2026-09-17',
      title: 'GymTracker Pro v2.25.0 - Serwerowa Aktualizacja & AI Optimizer',
      releaseNotes: [
        'Zintegrowany moduł automatycznej aktualizacji aplikacji bezpośrednio przez serwer REST',
        'Zaawansowane presety person Agenta AI (Trener Siłowy, Analityk, Lekarz, Motywator)',
        'Nowe tryby skalowania okna Windows (FHD 1080p, Laptop 768p, 2K WQHD)',
        'Centrum Testów Integralności Aplikacji i weryfikacja sumy kontrolnej SHA-256',
        'Optymalizacja czasu ładowania i natywne wsparcie dla Windows 10/11 x64'
      ],
      downloadUrl: '/api/update/download/2.25.0',
      fileSizeBytes: 14250000,
      sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isMandatory: false,
      minSupportedVersion: '2.0.0',
      packageType: 'full_dist',
      author: 'Pasik92'
    },
    {
      version: '2.26.0-beta.1',
      channel: 'beta',
      releaseDate: '2026-09-17',
      title: 'GymTracker Pro v2.26.0 Beta - Cloud Sync & Real-time Mesh',
      releaseNotes: [
        'Wczesny dostęp do silnika synchronizacji p2p Windows-Android',
        'Eksperymentalny asystent treningowy z rozpoznawaniem biomechaniki',
        'Rozszerzone logowanie badań laboratoryjnych i markerów biochemicznych'
      ],
      downloadUrl: '/api/update/download/2.26.0-beta.1',
      fileSizeBytes: 15100000,
      sha256Checksum: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      isMandatory: false,
      minSupportedVersion: '2.20.0',
      packageType: 'bundle_zip',
      author: 'Pasik92'
    }
  ];

  // 1. Sprawdzenie dostępności aktualizacji (Check for updates)
  app.get('/api/update/check', (req, res) => {
    const clientVersion = (req.query.currentVersion as string) || '2.24.0';
    const channel = (req.query.channel as string) || 'stable';

    const matchingReleases = releasesDatabase.filter(r => 
      channel === 'beta' ? true : r.channel === 'stable'
    );

    const latestRelease = matchingReleases[0];

    if (latestRelease && latestRelease.version !== clientVersion) {
      res.json({
        updateAvailable: true,
        currentVersion: clientVersion,
        latestVersion: latestRelease.version,
        channel: latestRelease.channel,
        update: {
          ...latestRelease,
          currentVersion: clientVersion
        }
      });
    } else {
      res.json({
        updateAvailable: false,
        currentVersion: clientVersion,
        latestVersion: clientVersion,
        message: 'Aplikacja jest aktualna (Najnowsza wersja).'
      });
    }
  });

  // 2. Pobieranie paczki aktualizacyjnej (Download update package)
  app.get('/api/update/download/:version', (req, res) => {
    const version = req.params.version;
    const release = releasesDatabase.find(r => r.version === version);

    if (!release) {
      res.status(404).json({ error: 'Nie znaleziono paczki aktualizacji dla wersji ' + version });
      return;
    }

    // Return mock update package metadata payload with simulated binary stream header
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="gymtracker-update-${version}.gtpkg"`);
    res.setHeader('X-Update-Version', release.version);
    res.setHeader('X-Update-SHA256', release.sha256Checksum);
    
    // Simulate JSON package payload embedded
    const packagePayload = JSON.stringify({
      version: release.version,
      buildTimestamp: new Date().toISOString(),
      author: release.author,
      checksum: release.sha256Checksum,
      manifest: {
        target: 'Windows 10/11 x64',
        runtime: 'Node/Express/Vite',
        filesUpdated: 24
      }
    });

    res.send(Buffer.from(packagePayload, 'utf-8'));
  });

  // 3. Aplikowanie / instalacja aktualizacji przez serwer (Apply update)
  app.post('/api/update/apply', (req, res) => {
    const { version, checksum } = req.body;
    console.log(`[Update Server] Aplikowanie aktualizacji do wersji ${version} (Suma: ${checksum})`);

    res.json({
      success: true,
      appliedVersion: version,
      message: `Aktualizacja do wersji ${version} została pomyślnie zainstalowana przez serwer.`,
      restartRequired: true,
      timestamp: new Date().toISOString()
    });
  });

  // 4. Wycofanie aktualizacji (Rollback)
  app.post('/api/update/rollback', (req, res) => {
    const { targetVersion } = req.body;
    res.json({
      success: true,
      rolledBackTo: targetVersion || '2.24.0',
      message: `Pomyślnie przywrócono stabilną wersję ${targetVersion || '2.24.0'}.`,
      timestamp: new Date().toISOString()
    });
  });

  // 5. Historia wydań serwerowych (Changelog history)
  app.get('/api/update/history', (_req, res) => {
    res.json({
      releases: releasesDatabase
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GymTracker Pro Server running on http://localhost:${PORT}`);
  });
}

startServer();
