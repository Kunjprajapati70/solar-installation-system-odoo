/**
 * SunPower Solutions - HTTP & Socket.IO Server Bootstrap
 */

const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');
const { initSockets } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  initSockets(io);

  // Attach io to incoming requests
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process. Please terminate the process or specify a different PORT.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 SunPower Solutions Modular Backend running on port ${PORT}`);
    console.log(`📡 Socket.IO Real-Time Gateway initialized`);
    console.log(`🩺 Health check active at http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 Gracefully shutting down HTTP server...');
    server.close(() => {
      console.log('✅ HTTP server closed. Disconnecting database...');
      const mongoose = require('mongoose');
      mongoose.connection.close(false).then(() => {
        console.log('✅ MongoDB connection closed. Exiting process.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
