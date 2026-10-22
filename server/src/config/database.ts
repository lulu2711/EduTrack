import mongoose from 'mongoose';
import { getDataSourceMode } from '../utils/dataSource';

let isConnected = false;
let listenersAttached = false;
const log = (event: string, details: Record<string, unknown> = {}) => console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...details }));

const attachListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('connected', () => { isConnected = true; log('mongodb.connected', { database: mongoose.connection.name, mode: getDataSourceMode() }); });
  mongoose.connection.on('reconnected', () => { isConnected = true; log('mongodb.reconnected', { database: mongoose.connection.name }); });
  mongoose.connection.on('error', (error) => { log('mongodb.error', { message: error.message, mode: getDataSourceMode() }); });
  mongoose.connection.on('disconnected', () => { isConnected = false; log('mongodb.disconnected', { mode: getDataSourceMode() }); });
};

const connectDB = async (): Promise<void> => {
  attachListeners();
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) { log('mongodb.skipped', { reason: 'MONGODB_URI missing', mode: getDataSourceMode() }); return; }
  if (isConnected || mongoose.connection.readyState === 1) { isConnected = true; log('mongodb.reused', { database: mongoose.connection.name }); return; }
  try {
    const conn = await mongoose.connect(mongoURI, { dbName: 'edu-tracker', serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
    isConnected = true;
  } catch (error) {
    isConnected = false;
    log('mongodb.connection_failed', { message: (error as Error).message, mode: getDataSourceMode(), fallbackEnabled: getDataSourceMode() !== 'mongodb' });
  }
};

process.once('SIGINT', async () => { if (mongoose.connection.readyState !== 0) await mongoose.connection.close(); log('mongodb.closed', { reason: 'SIGINT' }); process.exit(0); });
process.once('SIGTERM', async () => { if (mongoose.connection.readyState !== 0) await mongoose.connection.close(); log('mongodb.closed', { reason: 'SIGTERM' }); process.exit(0); });

export default connectDB;

