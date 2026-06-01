let ioInstance = null;

function roomKey(channel, conversationId) {
	return `chat_${channel}_${conversationId}`;
}

function setSocketServer(io) {
	ioInstance = io || null;
}

function getSocketServer() {
	return ioInstance;
}

function emitToRoom(channel, conversationId, eventName, payload) {
	if (!ioInstance || !conversationId || !eventName) return;
	ioInstance
		.to(roomKey(channel, Number(conversationId)))
		.emit(eventName, payload);
}

function emitToUser(userId, eventName, payload) {
	if (!ioInstance || !userId || !eventName) return;
	ioInstance.to(`user_${Number(userId)}`).emit(eventName, payload);
}

module.exports = {
	setSocketServer,
	getSocketServer,
	emitToRoom,
	emitToUser,
	roomKey,
};
