import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './db/connection.js';
import { initSocket } from './realtime/io.js';
import { seedIfEmpty } from './db/seed.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
  } catch {
    console.error('Backend startup aborted because MongoDB connection failed.');
    process.exit(1);
  }

  // Auto-seed demo data when running with in-memory MongoDB
  if (process.env.MONGODB_IN_MEMORY === 'true') {
    await seedIfEmpty();
  }

  const httpServer = createServer(app);
  initSocket(httpServer, process.env.CORS_ORIGIN);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO real-time layer attached on the same port.');
  });
}

startServer();
