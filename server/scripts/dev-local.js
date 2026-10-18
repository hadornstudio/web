// Local preview server: runs a persistent in-process MongoDB (no Atlas needed), seeds it on first
// run, then starts the API under nodemon pointed at it. Data lives in server/.local-db (gitignored).
// Never touches the production database.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(SERVER_DIR, '.local-db');
const firstRun = !existsSync(dbPath);
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: { dbPath, port: 27018, storageEngine: 'wiredTiger' },
});
const uri = mongod.getUri('hadorn');
const env = { ...process.env, MONGODB_URI: uri };
console.log(`Local MongoDB ready at ${uri}`);

if (firstRun) {
  console.log('First run: seeding local database...');
  const seed = spawnSync('node', ['src/seed/seed.js'], { cwd: SERVER_DIR, env, stdio: 'inherit' });
  if (seed.status !== 0) console.error('Seeding failed — continuing with an empty database.');
}

const api = spawn('npx', ['nodemon', 'src/server.js'], { cwd: SERVER_DIR, env, stdio: 'inherit' });

const shutdown = async () => {
  api.kill();
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
api.on('exit', shutdown);
