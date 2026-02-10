"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAttendanceUpdated = exports.emitNotificationRefresh = exports.emitNotificationCreated = exports.emitLeaveRequestDeleted = exports.emitLeaveRequestUpdated = exports.emitLeaveRequestCreated = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://hari-hr-system.vercel.app',
                'https://hari-hr-system-api.vercel.app',
                process.env.FRONTEND_URL || '',
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
};
exports.getIO = getIO;
// Event emitters for leave requests
const emitLeaveRequestCreated = (leaveRequest) => {
    if (io) {
        io.emit('leave-request:created', leaveRequest);
    }
};
exports.emitLeaveRequestCreated = emitLeaveRequestCreated;
const emitLeaveRequestUpdated = (leaveRequest) => {
    if (io) {
        io.emit('leave-request:updated', leaveRequest);
    }
};
exports.emitLeaveRequestUpdated = emitLeaveRequestUpdated;
const emitLeaveRequestDeleted = (id) => {
    if (io) {
        io.emit('leave-request:deleted', { id });
    }
};
exports.emitLeaveRequestDeleted = emitLeaveRequestDeleted;
// Event emitters for notifications
const emitNotificationCreated = (notification) => {
    if (io) {
        io.emit('notification:new', notification);
    }
};
exports.emitNotificationCreated = emitNotificationCreated;
const emitNotificationRefresh = () => {
    if (io) {
        io.emit('notification:refresh');
    }
};
exports.emitNotificationRefresh = emitNotificationRefresh;
// Event emitters for attendance
const emitAttendanceUpdated = (attendance) => {
    if (io) {
        io.emit('attendance:updated', attendance);
    }
};
exports.emitAttendanceUpdated = emitAttendanceUpdated;
