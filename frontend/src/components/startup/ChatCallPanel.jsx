"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getChatSocket } from "@/lib/socketClient";

/**
 * Voice/video session panel for startup chat (investor or mentor).
 * api: { getStatus, start, join, end, screenShare }
 */
export default function ChatCallPanel({
	conversationId,
	chatChannel = "investor",
	partnerName,
	currentUserId,
	api,
	onError,
	autoStartMode = null,
}) {
	const [callState, setCallState] = useState({
		status: "none",
		video_call: null,
		session_participants: [],
	});
	const [mediaMode, setMediaMode] = useState(null);
	const [localStream, setLocalStream] = useState(null);
	const [screenStream, setScreenStream] = useState(null);
	const [callBusy, setCallBusy] = useState(false);
	const localVideoRef = useRef(null);
	const screenVideoRef = useRef(null);
	const autoStartedRef = useRef(false);

	const activeCall = ["ringing", "active"].includes(callState.status);
	const isInCall = Boolean(localStream);
	const incomingCall =
		callState.status === "ringing" &&
		!isInCall &&
		Number(callState.video_call?.started_by_user_id) !== Number(currentUserId);
	const screenShareUserId = callState.video_call?.screen_share_user_id;
	const isScreenSharing = Number(screenShareUserId) === Number(currentUserId);
	const joinUrl = callState.video_call?.join_url;

	const reportError = useCallback(
		(message) => {
			if (onError) onError(message);
		},
		[onError],
	);

	function stopTracks(stream) {
		stream?.getTracks?.().forEach((track) => track.stop());
	}

	const stopAllMedia = useCallback(() => {
		setLocalStream((stream) => {
			stopTracks(stream);
			return null;
		});
		setScreenStream((stream) => {
			stopTracks(stream);
			return null;
		});
		setMediaMode(null);
	}, []);

	const fetchVideoStatus = useCallback(
		async (quiet = false) => {
			if (!conversationId) return;
			try {
				const data = await api.getStatus(conversationId);
				setCallState({
					status: data?.status || "none",
					video_call: data?.video_call || null,
					session_participants: data?.session_participants || [],
				});
				if (!["ringing", "active"].includes(data?.status)) {
					stopAllMedia();
				}
			} catch (err) {
				if (!quiet) reportError(err.message || "Unable to load call status.");
			}
		},
		[api, conversationId, reportError, stopAllMedia],
	);

	useEffect(() => {
		if (!conversationId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setCallState({
				status: "none",
				video_call: null,
				session_participants: [],
			});
			stopAllMedia();
			autoStartedRef.current = false;
			return;
		}
		fetchVideoStatus();
		const id = window.setInterval(() => fetchVideoStatus(true), 5000);
		return () => window.clearInterval(id);
	}, [conversationId, fetchVideoStatus, stopAllMedia]);

	useEffect(() => {
		autoStartedRef.current = false;
	}, [conversationId]);

	useEffect(() => {
		const socket = getChatSocket();
		if (!socket || !conversationId) return undefined;

		const onCallSignal = (payload) => {
			if (!payload) return;
			if (payload.channel !== chatChannel) return;
			if (Number(payload.conversationId) !== Number(conversationId)) return;
			setCallState((prev) => ({
				...prev,
				status: payload.video_call?.status || payload.event || prev.status,
				video_call: payload.video_call || prev.video_call,
			}));
			if (payload.event === "ended") {
				stopAllMedia();
			}
		};

		socket.on("call_signal", onCallSignal);
		return () => {
			socket.off("call_signal", onCallSignal);
		};
	}, [chatChannel, conversationId, stopAllMedia]);

	useEffect(() => {
		return () => stopAllMedia();
	}, [stopAllMedia]);

	useEffect(() => {
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream]);

	useEffect(() => {
		if (screenVideoRef.current && screenStream) {
			screenVideoRef.current.srcObject = screenStream;
		}
	}, [screenStream]);

	async function openLocalMedia(mode) {
		stopAllMedia();
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: mode === "video",
		});
		setLocalStream(stream);
		setMediaMode(mode);
		return stream;
	}

	async function placeCall(mode) {
		if (!conversationId) return;
		setCallBusy(true);
		try {
			reportError(null);
			await openLocalMedia(mode);
			const data = await api.start(conversationId);
			setCallState({
				status: data.video_call?.status || "ringing",
				video_call: data.video_call,
				session_participants: [],
			});
		} catch (err) {
			stopAllMedia();
			reportError(
				err.message ||
					"Unable to start call. Check microphone/camera permissions.",
			);
		} finally {
			setCallBusy(false);
		}
	}

	async function joinCall(mode) {
		if (!conversationId) return;
		setCallBusy(true);
		try {
			reportError(null);
			await openLocalMedia(mode);
			const data = await api.join(conversationId);
			setCallState((prev) => ({
				...prev,
				status: data.video_call?.status || "active",
				video_call: data.video_call,
			}));
			await fetchVideoStatus(true);
		} catch (err) {
			stopAllMedia();
			reportError(err.message || "Unable to join call.");
		} finally {
			setCallBusy(false);
		}
	}

	async function endCall() {
		if (!conversationId) return;
		setCallBusy(true);
		try {
			const data = await api.end(conversationId);
			setCallState({
				status: data.video_call?.status || "ended",
				video_call: data.video_call,
				session_participants: [],
			});
		} catch (err) {
			reportError(err.message || "Unable to end call.");
		} finally {
			stopAllMedia();
			setCallBusy(false);
			await fetchVideoStatus(true);
		}
	}

	useEffect(() => {
		if (
			!autoStartMode ||
			!conversationId ||
			autoStartedRef.current ||
			callBusy ||
			isInCall
		)
			return;
		autoStartedRef.current = true;
		placeCall(autoStartMode);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once when modal opens with mode
	}, [autoStartMode, conversationId]);

	async function toggleScreenShare() {
		if (!conversationId || !api.screenShare) return;
		if (isScreenSharing) {
			try {
				await api.screenShare(conversationId, "stop");
				setScreenStream((stream) => {
					stopTracks(stream);
					return null;
				});
				await fetchVideoStatus(true);
			} catch (err) {
				reportError(err.message || "Unable to stop screen sharing.");
			}
			return;
		}

		try {
			reportError(null);
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: false,
			});
			stream.getVideoTracks()[0]?.addEventListener("ended", async () => {
				setScreenStream((s) => {
					stopTracks(s);
					return null;
				});
				try {
					await api.screenShare(conversationId, "stop");
					await fetchVideoStatus(true);
				} catch {
					/* user stopped share from browser UI */
				}
			});
			setScreenStream(stream);
			await api.screenShare(conversationId, "start");
			await fetchVideoStatus(true);
		} catch (err) {
			reportError(
				err.message || "Screen sharing was cancelled or is not supported.",
			);
		}
	}

	if (!conversationId) {
		return (
			<div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] p-6 text-center text-sm text-gray-500">
				Select a conversation to start a voice or video session.
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-[#0f3d32]/20 bg-gradient-to-br from-[#f0faf5] to-white overflow-hidden">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0f3d32]/10 px-4 py-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-[#0f3d32]">
						Video & voice session
					</p>
					<p className="text-sm text-gray-600 mt-0.5">
						With {partnerName || "partner"}
					</p>
				</div>
				<span
					className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
						activeCall ? "bg-[#0f3d32] text-white" : "bg-gray-100 text-gray-600"
					}`}
				>
					{callState.status || "none"}
				</span>
			</div>

			{incomingCall && (
				<div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
					<p className="text-sm font-semibold text-blue-900">
						Incoming call from {partnerName}
					</p>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							disabled={callBusy}
							onClick={() => joinCall("voice")}
							className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
						>
							Join voice
						</button>
						<button
							type="button"
							disabled={callBusy}
							onClick={() => joinCall("video")}
							className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
						>
							Join video
						</button>
					</div>
				</div>
			)}

			<div className="flex flex-wrap gap-2 p-4">
				<button
					type="button"
					disabled={callBusy || isInCall}
					onClick={() => placeCall("voice")}
					className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
					Voice call
				</button>
				<button
					type="button"
					disabled={callBusy || isInCall}
					onClick={() => placeCall("video")}
					className="inline-flex items-center gap-2 rounded-lg bg-[#0f3d32] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a2921] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					Video call
				</button>
				{activeCall && !isInCall && !incomingCall && (
					<>
						<button
							type="button"
							disabled={callBusy}
							onClick={() => joinCall("voice")}
							className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
						>
							Join voice
						</button>
						<button
							type="button"
							disabled={callBusy}
							onClick={() => joinCall("video")}
							className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
						>
							Join video
						</button>
					</>
				)}
				{callState.status === "active" && isInCall && api.screenShare && (
					<button
						type="button"
						disabled={callBusy}
						onClick={toggleScreenShare}
						className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
					>
						{isScreenSharing ? "Stop sharing" : "Share screen"}
					</button>
				)}
				{(isInCall || activeCall) && (
					<button
						type="button"
						disabled={callBusy}
						onClick={endCall}
						className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
					>
						End session
					</button>
				)}
			</div>

			{(isInCall || activeCall) && (
				<div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
					<div className="overflow-hidden rounded-xl border border-gray-200 bg-black min-h-[180px]">
						{mediaMode === "video" && localStream ? (
							<video
								ref={localVideoRef}
								autoPlay
								muted
								playsInline
								className="h-full w-full min-h-[180px] object-cover"
							/>
						) : (
							<div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-white">
								<svg
									className="h-10 w-10 opacity-80"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
									/>
								</svg>
								<p className="text-sm font-semibold">
									{isInCall
										? "Voice session active"
										: "Waiting to connect media…"}
								</p>
							</div>
						)}
						<p className="bg-black/70 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/80">
							You
						</p>
					</div>

					<div className="overflow-hidden rounded-xl border border-gray-200 bg-[#1a1a1a] min-h-[180px]">
						{screenStream ? (
							<video
								ref={screenVideoRef}
								autoPlay
								muted
								playsInline
								className="h-full w-full min-h-[180px] object-contain"
							/>
						) : screenShareUserId &&
						  Number(screenShareUserId) !== Number(currentUserId) ? (
							<div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center text-white">
								<p className="text-sm font-semibold">
									{partnerName} is sharing their screen
								</p>
								<p className="text-xs text-white/60">
									Room: {callState.video_call?.room_id?.slice(0, 8)}…
								</p>
							</div>
						) : (
							<div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center text-white/70">
								<svg
									className="h-10 w-10 opacity-50"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<p className="text-sm">Partner video appears when they join</p>
							</div>
						)}
						<p className="bg-black/70 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/80">
							{screenStream || screenShareUserId ? "Screen" : "Partner"}
						</p>
					</div>
				</div>
			)}

			<div className="border-t border-[#0f3d32]/10 bg-white/60 px-4 py-3 text-xs text-gray-500">
				{callState.video_call?.room_id ? (
					<span className="inline-flex flex-wrap items-center gap-2">
						<span>
							Session room:{" "}
							<span className="font-mono font-semibold text-gray-700">
								{callState.video_call.room_id}
							</span>
						</span>
						{joinUrl ? (
							<a
								href={joinUrl}
								target="_blank"
								rel="noreferrer"
								className="font-bold text-[#0f3d32] hover:underline"
							>
								Open room
							</a>
						) : null}
					</span>
				) : (
					<span>
						Start a voice or video call to open a live session with your mentor.
					</span>
				)}
				{callState.session_participants?.length > 0 && (
					<span className="ml-3">
						· {callState.session_participants.length} participant
						{callState.session_participants.length === 1 ? "" : "s"} logged
					</span>
				)}
			</div>
		</div>
	);
}
