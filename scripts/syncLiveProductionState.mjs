/**
 * Sync Live Production Studio State to Local Snapshot
 * 
 * Runs before build/commits to pull any customizations made by Dr. Dodiya in
 * the live Author Studio or NET Vidya Store Admin into src/data/live_studio_state.json.
 * This guarantees code deployments NEVER overwrite live studio customizations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.resolve(__dirname, '../src/data/live_studio_state.json');
const LIVE_URL = process.env.LIVE_STUDIO_URL || 'https://rajnikantdodiya.com/api/content';

async function syncLiveState() {
  console.log(`[Sync] Checking live production studio state from ${LIVE_URL}...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(LIVE_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Sync] Live endpoint returned status ${res.status}. Keeping current local snapshot.`);
      return;
    }

    const data = await res.json();
    if (!data?.success || !data?.state) {
      console.warn('[Sync] Live endpoint returned unexpected payload format. Keeping current local snapshot.');
      return;
    }

    const liveState = data.state;

    // Validate that the returned state contains core structure
    if (!liveState.theme || !liveState.profile || !Array.isArray(liveState.books)) {
      console.warn('[Sync] Live state missing core schema properties. Keeping current local snapshot.');
      return;
    }

    // Merge with existing snapshot to preserve any local fields
    let existing = {};
    if (fs.existsSync(SNAPSHOT_PATH)) {
      try {
        existing = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
      } catch {}
    }

    const merged = {
      ...existing,
      ...liveState,
      syncedAt: new Date().toISOString()
    };

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    console.log(`[Sync] Successfully updated local snapshot at src/data/live_studio_state.json`);
    console.log(`[Sync] Version: ${merged.version || 1}, Last Modified: ${merged.updatedAt || merged.syncedAt}`);
  } catch (err) {
    console.warn(`[Sync] Could not reach live endpoint (${err.message}). Using existing local snapshot.`);
  }
}

syncLiveState();
