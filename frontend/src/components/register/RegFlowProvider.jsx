"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const Ctx = createContext(null);

/** Multi-step registration: text fields + File objects kept in memory across steps */
export function RegFlowProvider({ role, children }) {
	const storageKey = `startupconnect.registration.${role}.fields`;
	const [fields, setFields] = useState(() => {
		if (typeof window === "undefined") return {};
		try {
			const saved = window.localStorage.getItem(storageKey);
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	});
	const [files, setFiles] = useState({});

	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(storageKey);
			if (saved) setFields(JSON.parse(saved));
		} catch {
			// Draft persistence should never block registration.
		}
	}, [storageKey]);

	const patchFields = useCallback((partial) => {
		setFields((prev) => ({ ...prev, ...partial }));
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(fields));
		} catch {
			// Ignore storage limits or private browsing restrictions.
		}
	}, [fields, storageKey]);

	const setFile = useCallback((name, file) => {
		setFiles((prev) => ({ ...prev, [name]: file }));
	}, []);

	const reset = useCallback(() => {
		setFields({});
		setFiles({});
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// Ignore storage limits or private browsing restrictions.
		}
	}, [storageKey]);

	const value = useMemo(
		() => ({
			role,
			fields,
			files,
			patchFields,
			setFile,
			reset,
		}),
		[role, fields, files, patchFields, setFile, reset],
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRegFlow() {
	const v = useContext(Ctx);
	if (!v) {
		throw new Error("useRegFlow must be used under RegFlowProvider");
	}
	return v;
}
