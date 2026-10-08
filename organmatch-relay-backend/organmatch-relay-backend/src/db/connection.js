import dns from 'dns';

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably across all networks
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let _memServer = null;

export async function connectDB() {
  if (isConnected) return;

  let uri = process.env.MONGODB_URI;

  try {
    // In-memory mode: spin up a local MongoMemoryServer instance
    if (process.env.MONGODB_IN_MEMORY === 'true') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      _memServer = await MongoMemoryServer.create();
      uri = _memServer.getUri();
      console.log('[MongoDB] Using in-memory instance at', uri);
    }

    if (!uri) {
      throw new Error('MONGODB_URI is not configured.');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
    return conn;
  } catch (err) {
    const errorType = err instanceof Error ? err.name : 'Unknown error';
    console.error(
      `[MongoDB] Connection failed (${errorType}): ${err.message}`
    );
    throw err;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (_memServer) {
    await _memServer.stop();
    _memServer = null;
  }
  isConnected = false;
}

export default connectDB;
