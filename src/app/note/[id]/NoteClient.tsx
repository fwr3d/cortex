"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type NoteRow = {
	id: string;
	title: string;
	updatedAt: string; // ISO
	content: string;
};

function safeJsonParse<T>(raw: string): T | null {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function nowIso() {
	return new Date().toISOString();
}

function notesKey(classId: string) {
	return `cortex:classes:${classId}:notes:v1`;
}

export default function NoteClient({ noteId }: { noteId: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const classId = searchParams.get("classId") ?? "";

	const [draft, setDraft] = useState<{
		key: string;
		title: string;
		content: string;
	} | null>(null);

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
		}),
		[],
	);

	const styles = useMemo(() => {
		const stage: React.CSSProperties = {
			minHeight: "100vh",
			padding: "28px 18px 40px",
			backgroundColor: theme.bg,
			color: theme.text,
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
		};

		const container: React.CSSProperties = {
			maxWidth: 980,
			margin: "0 auto",
			display: "flex",
			flexDirection: "column",
			gap: 14,
		};

		const header: React.CSSProperties = {
			display: "flex",
			alignItems: "baseline",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
		};

		const h1: React.CSSProperties = {
			fontSize: 18,
			fontWeight: 850,
			letterSpacing: 0.2,
		};

		const sub: React.CSSProperties = {
			fontSize: 13,
			color: theme.muted,
			lineHeight: 1.4,
		};

		const actions: React.CSSProperties = {
			display: "flex",
			gap: 10,
			flexWrap: "wrap",
		};

		const action: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			padding: "10px 12px",
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 700,
			fontSize: 13,
			textDecoration: "none",
		};

		const input: React.CSSProperties = {
			width: "100%",
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			background: theme.panel,
			color: theme.text,
			padding: "12px 14px",
			fontSize: 15,
			fontWeight: 850,
			outline: "none",
		};

		const textarea: React.CSSProperties = {
			width: "100%",
			minHeight: 420,
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			background: theme.panel,
			color: theme.text,
			padding: "12px 14px",
			fontSize: 14,
			lineHeight: 1.5,
			outline: "none",
			resize: "vertical",
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
		};

		const error: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: theme.panel,
			padding: 14,
			color: theme.muted,
			fontSize: 13,
			lineHeight: 1.45,
		};

		return {
			stage,
			container,
			header,
			h1,
			sub,
			actions,
			action,
			input,
			textarea,
			error,
		};
	}, [theme]);

	const noteState = useMemo(() => {
		if (typeof window === "undefined") {
			return { ready: false, found: null as NoteRow | null, notFound: false };
		}

		// If classId is missing, we cannot locate the right notes list.
		if (!classId) {
			return { ready: true, found: null as NoteRow | null, notFound: true };
		}

		const raw = localStorage.getItem(notesKey(classId));
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		const notes = Array.isArray(parsed) ? parsed : [];
		const found = notes.find((n) => n.id === noteId) ?? null;

		return { ready: true, found, notFound: !found };
	}, [classId, noteId]);

	const currentKey = `${classId}:${noteId}`;
	const title = draft?.key === currentKey ? draft.title : noteState.found?.title ?? "";
	const content = draft?.key === currentKey ? draft.content : noteState.found?.content ?? "";

	function save(next: { title: string; content: string }) {
		if (!classId) return;

		const raw = localStorage.getItem(notesKey(classId));
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		const notes = Array.isArray(parsed) ? parsed : [];

		const idx = notes.findIndex((n) => n.id === noteId);
		if (idx === -1) {
			return;
		}

		const updated: NoteRow = {
			...notes[idx],
			title: next.title,
			content: next.content,
			updatedAt: nowIso(),
		};

		const nextNotes = notes.slice();
		nextNotes[idx] = updated;

		localStorage.setItem(notesKey(classId), JSON.stringify(nextNotes));
	}

	if (!noteState.ready) return null;

	if (noteState.notFound) {
		return (
			<main style={styles.stage}>
				<div style={styles.container}>
					<div style={styles.header}>
						<div>
							<div style={styles.h1}>Note not found</div>
							<div style={styles.sub}>
								This note does not exist in local storage for this class.
							</div>
						</div>
						<div style={styles.actions}>
							{classId ? (
								<Link href={`/class/${encodeURIComponent(classId)}`} style={styles.action}>
									Back to class
								</Link>
							) : (
								<Link href="/dashboard" style={styles.action}>
									Back to dashboard
								</Link>
							)}
						</div>
					</div>

					<div style={styles.error}>
						Missing or invalid <code>classId</code>, or the note id was not found.
						<br />
						<br />
						Expected URL shape: <code>/note/&lt;noteId&gt;?classId=&lt;classId&gt;</code>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main style={styles.stage}>
			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>Note</div>
						<div style={styles.sub}>{classId}</div>
					</div>

					<div style={styles.actions}>
						<Link href={`/class/${encodeURIComponent(classId)}`} style={styles.action}>
							Back to class
						</Link>
						<button
							type="button"
							style={styles.action}
							onClick={() => {
								save({ title, content });
								router.push(`/class/${encodeURIComponent(classId)}`);
							}}
						>
							Done
						</button>
					</div>
				</header>

				<input
					value={title}
					onChange={(e) => {
						const next = e.target.value;
						setDraft({
							key: currentKey,
							title: next,
							content,
						});
						save({ title: next, content });
					}}
					placeholder="Untitled note"
					style={styles.input}
				/>

				<textarea
					value={content}
					onChange={(e) => {
						const next = e.target.value;
						setDraft({
							key: currentKey,
							title,
							content: next,
						});
						save({ title, content: next });
					}}
					placeholder="Write your notes here..."
					style={styles.textarea}
				/>
			</div>
		</main>
	);
}