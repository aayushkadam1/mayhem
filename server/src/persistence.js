import fs from 'fs/promises';
import path from 'path';
import { MongoClient } from 'mongodb';

const STATE_DOC_ID = 'game_state';

export async function initPersistence() {
  let stateFilePath = null;
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    stateFilePath = path.join(dataDir, 'localState.json');
  } catch {
    console.warn('Could not create data directory (read-only filesystem). Local file persistence disabled.');
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'mayhem';
  let client = null;
  let collection = null;

  if (uri) {
    try {
      client = new MongoClient(uri);
      await client.connect();
      collection = client.db(dbName).collection('state');
      console.log(`MongoDB connected: ${dbName}.state`);
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local state.', err);
      client = null;
      collection = null;
    }
  } else {
    console.warn('MONGODB_URI not set. Using local state only.');
  }

  return { stateFilePath, collection, client };
}

export async function loadState(createInitialState, persistence) {
  const { collection, stateFilePath } = persistence;
  let state = null;

  if (collection) {
    try {
      const doc = await collection.findOne({ _id: STATE_DOC_ID });
      if (doc && doc.state) state = doc.state;
    } catch (err) {
      console.error('Failed to read state from MongoDB:', err);
    }
  }

  if (!state && stateFilePath) {
    try {
      const raw = await fs.readFile(stateFilePath, 'utf-8');
      state = JSON.parse(raw);
    } catch {
      state = null;
    }
  }

  if (!state) state = createInitialState();
  return state;
}

export async function saveState(state, persistence) {
  const { collection, stateFilePath } = persistence;

  if (stateFilePath) {
    try {
      const payload = JSON.stringify(state, null, 2);
      await fs.writeFile(stateFilePath, payload);
    } catch {
      // Silently skip — local file is a backup; MongoDB is primary in production
    }
  }

  if (collection) {
    await collection.updateOne(
      { _id: STATE_DOC_ID },
      { $set: { state, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}
