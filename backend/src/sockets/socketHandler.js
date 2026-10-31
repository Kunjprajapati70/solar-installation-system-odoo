/**
 * Socket.IO Handler
 * Manages real-time rooms and broadcasts
 */

let ioInstance = null;

const initSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    // Join room for specific user ID
    socket.on('join-user', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined user-${userId}`);
      }
    });

    // Join room for specific role
    socket.on('join-role', (role) => {
      if (role) {
        socket.join(`role-${role}`);
        console.log(`[Socket.IO] Client ${socket.id} joined role-${role}`);
      }
    });

    // Join room for specific customer ID
    socket.on('join-customer', (customerId) => {
      if (customerId) {
        socket.join(`customer-${customerId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined customer-${customerId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => ioInstance;

const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user-${userId}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (ioInstance && role) {
    ioInstance.to(`role-${role}`).emit(event, data);
  }
};

const emitToCustomer = (customerId, event, data) => {
  if (ioInstance && customerId) {
    ioInstance.to(`customer-${customerId}`).emit(event, data);
  }
};

const broadcastNotification = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSockets,
  getIo,
  emitToUser,
  emitToRole,
  emitToCustomer,
  broadcastNotification
};
