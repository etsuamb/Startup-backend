"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getChatSocket, MODERATION_WARNING } from "@/lib/socketClient";

/**
 * Socket.IO hook for moderated real-time chat.
 * @param {{ channel: 'investor'|'mentor', conversationId: string|number|null, enabled?: boolean }} options
 */
export function useRealtimeChat({ channel, conversationId, enabled = true }) {
	const [connected, setConnected] = useState(false);
	const [typingUserId, setTypingUserId] = useState(null);
	const [moderationAlert, setModerationAlert] = useState(null);
	const typingTimeoutRef = useRef(null);
	const handlersRef = useRef({});

	const socket = enabled ? getChatSocket() : null;

	useEffect(() => {
		if (!socket) return undefined;

		const onConnect = () => setConnected(true);
		const onDisconnect = () => setConnected(false);
		const onModeration = (payload) => {
			setModerationAlert(payload?.message || MODERATION_WARNING);
		};
		const onCallSignal = (payload) => {
			handlersRef.current.onCallSignal?.(payload);
		};
		const onChatNotification = (payload) => {
			handlersRef.current.onChatNotification?.(payload);
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("moderation_alert", onModeration);
		socket.on("call_signal", onCallSignal);
		socket.on("chat_notification", onChatNotification);

		if (socket.connected) setConnected(true);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("moderation_alert", onModeration);
			socket.off("call_signal", onCallSignal);
			socket.off("chat_notification", onChatNotification);
		};
	}, [socket]);

	useEffect(() => {
		if (!socket || !conversationId || !enabled) return undefined;

		const roomPayload = { channel, conversationId: Number(conversationId) };
		const joinCurrentRoom = () => {
			socket.emit("join_room", roomPayload, (response) => {
				if (response?.error) {
					console.warn("join_room:", response.error);
				}
			});
		};

		joinCurrentRoom();
		socket.on("connect", joinCurrentRoom);

		const onMessage = (msg) => {
			handlersRef.current.onMessage?.(msg);
		};
		const onTyping = (data) => {
			if (Number(data.conversationId) === Number(conversationId)) {
				setTypingUserId(data.userId);
				if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = setTimeout(
					() => setTypingUserId(null),
					3000,
				);
			}
		};
		const onStopTyping = (data) => {
			if (Number(data.conversationId) === Number(conversationId)) {
				setTypingUserId(null);
			}
		};
		const onRead = (data) => {
			handlersRef.current.onRead?.(data);
		};

		socket.on("receive_message", onMessage);
		socket.on("user_typing", onTyping);
		socket.on("user_stop_typing", onStopTyping);
		socket.on("messages_read", onRead);

		return () => {
			socket.emit("leave_room", roomPayload);
			socket.off("connect", joinCurrentRoom);
			socket.off("receive_message", onMessage);
			socket.off("user_typing", onTyping);
			socket.off("user_stop_typing", onStopTyping);
			socket.off("messages_read", onRead);
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		};
	}, [socket, channel, conversationId, enabled]);

	const setHandlers = useCallback((handlers) => {
		handlersRef.current = handlers || {};
	}, []);

	const sendMessage = useCallback(
		(text) =>
			new Promise((resolve, reject) => {
				if (!socket?.connected) {
					reject(new Error("Socket not connected"));
					return;
				}
				socket.emit(
					"send_message",
					{ channel, conversationId: Number(conversationId), text },
					(response) => {
						if (response?.error) {
							if (response.code === "MODERATION_BLOCKED") {
								setModerationAlert(response.error);
							}
							reject(new Error(response.error));
							return;
						}
						resolve(response.message);
					},
				);
			}),
		[socket, channel, conversationId],
	);

	const emitTyping = useCallback(() => {
		if (!socket?.connected || !conversationId) return;
		socket.emit("typing", { channel, conversationId: Number(conversationId) });
	}, [socket, channel, conversationId]);

	const emitStopTyping = useCallback(() => {
		if (!socket?.connected || !conversationId) return;
		socket.emit("stop_typing", {
			channel,
			conversationId: Number(conversationId),
		});
	}, [socket, channel, conversationId]);

	const markRead = useCallback(() => {
		if (!socket?.connected || !conversationId) return;
		socket.emit("mark_read", {
			channel,
			conversationId: Number(conversationId),
		});
	}, [socket, channel, conversationId]);

	const clearModerationAlert = useCallback(() => setModerationAlert(null), []);

	return {
		connected,
		typingUserId,
		moderationAlert,
		clearModerationAlert,
		setHandlers,
		sendMessage,
		emitTyping,
		emitStopTyping,
		markRead,
	};
}
