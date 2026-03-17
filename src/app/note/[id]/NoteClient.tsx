"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NoteRow = {
	id: string;
	classId: string;
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

function isNotesBucketKey(k: string) {
	return k.startsWith("cortex:classes:") && k.endsWith(":notes:v1");
}

function extractClassIdFromBucketKey(k: string) {
	// cortex:classes:<classId>:notes:v1
	return k.slice("cortex:classes:".length, k.length - ":notes:v1".length);
}

function loadAllBuckets(): Array<{ key: string; classId: string; notes: NoteRow[] }> {
	const out: Array<{ key: string; classId: string; notes: NoteRow[] }> = [];
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i);
		if (!k) continue;
		if (!isNotesBucketKey(k)) continue;

		const raw = localStorage.getItem(k);
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		const notes = Array.isArray(parsed) ? parsed : [];
		out.push({ key: k, classId: extractClassIdFromBucketKey(k), notes });
	}
	return out;
}

function findNoteById(noteId: string) {
	const buckets = loadAllBuckets();
	for (const b of buckets) {
		const found = b.notes.find((n) => n.id === noteId);
		if (found) {
			// prefer stored classId, fall back to bucket key
			const classId = found.classId || b.classId;
			return { classId, bucketKey: b.key, notes: b.notes, note: found };
		}
	}
	return null;
}

function getSelection(textarea: HTMLTextAreaElement) {
	return {
		start: textarea.selectionStart ?? 0,
		end: textarea.selectionEnd ?? 0,
	};
}

function lineStartIndex(value: string, at: number) {
	const i = value.lastIndexOf("\n", Math.max(0, at - 1));
	return i === -1 ? 0 : i + 1;
}

function getLineIndent(value: string, lineStart: number) {
	let i = lineStart;
	while (i < value.length && (value[i] === "\t" || value[i] === " ")) i++;
	return value.slice(lineStart, i);
}

export default function NoteClient({ noteId }: { noteId: string }) {
	const router = useRouter();
	const taRef = useRef<HTMLTextAreaElement | null>(null);

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const noteData = useMemo(() => {
		const hit = findNoteById(noteId);
		if (!hit) {
			return { loaded: true, notFound: true, classId: "", title: "", content: "" };
		}
		return {
			loaded: true,
			notFound: false,
			classId: hit.classId,
			title: hit.note.title ?? "",
			content: hit.note.content ?? "",
		};
	}, [noteId]);

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
			danger: "rgba(248,113,113,0.95)",
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

		const dangerAction: React.CSSProperties = {
			...action,
			color: theme.danger,
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

		// Docs-like layout
		// - Gray canvas
		// - Centered white "paper" (Letter-ish) with generous margins
		const docShell: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.02)",
			boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
			padding: 18,
		};

		// Approx Letter page at 96dpi: 8.5in x 11in → 816 x 1056
		const paper: React.CSSProperties = {
			width: "min(816px, 100%)",
			height: 1056,
			margin: "0 auto",
			border: `1px solid ${theme.border}`,
			borderRadius: 10,
			background: "rgba(0,0,0,0.22)",
			padding: "56px 64px",
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column",
			gap: 14,
		};

		const toolbar: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
			flexWrap: "wrap",
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			background: "rgba(0,0,0,0.22)",
			padding: "8px 10px",
		};

		const toolGroup: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			flexWrap: "wrap",
		};

		const toolLabel: React.CSSProperties = {
			fontSize: 12,
			fontWeight: 800,
			color: theme.muted,
			letterSpacing: 0.2,
			paddingRight: 4,
		};

		const toolDivider: React.CSSProperties = {
			width: 1,
			height: 22,
			background: theme.border,
			margin: "0 2px",
		};

		const toolBtn: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 10,
			padding: "7px 10px",
			background: "rgba(255,255,255,0.03)",
			color: theme.text,
			cursor: "not-allowed",
			fontWeight: 800,
			fontSize: 12,
			opacity: 0.75,
			lineHeight: 1,
		};

		// Google-Docs-like compact font-size control (layout only)
		const fontSizePill: React.CSSProperties = {
			display: "inline-flex",
			alignItems: "center",
			border: `1px solid ${theme.border}`,
			borderRadius: 10,
			overflow: "hidden",
			opacity: 0.85,
		};

		const fontSizePillBtn: React.CSSProperties = {
			border: "none",
			background: "rgba(255,255,255,0.03)",
			color: theme.text,
			padding: "7px 10px",
			fontWeight: 900,
			fontSize: 12,
			lineHeight: 1,
			cursor: "not-allowed",
		};

		const fontSizePillValue: React.CSSProperties = {
			minWidth: 34,
			textAlign: "center",
			padding: "7px 10px",
			fontSize: 12,
			fontWeight: 800,
			color: theme.text,
			background: "rgba(0,0,0,0.20)",
			borderLeft: `1px solid ${theme.border}`,
			borderRight: `1px solid ${theme.border}`,
			userSelect: "none",
		};

		const toolBtnItalic: React.CSSProperties = {
			...toolBtn,
			fontStyle: "italic",
		};

		const toolBtnUnderline: React.CSSProperties = {
			...toolBtn,
			textDecoration: "underline",
		};

		const textarea: React.CSSProperties = {
			width: "100%",
			flex: "1 1 auto",
			minHeight: 0,
			boxSizing: "border-box",
			border: "none",
			borderRadius: 0,
			background: "transparent",
			color: theme.text,
			padding: 0,
			fontSize: 16,
			lineHeight: 1.7,
			outline: "none",
			resize: "none",
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
			tabSize: 4,
			whiteSpace: "pre-wrap",
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
			dangerAction,
			docShell,
			paper,
			toolbar,
			toolGroup,
			toolLabel,
			toolDivider,
			toolBtn,
			toolBtnItalic,
			toolBtnUnderline,
			fontSizePill,
			fontSizePillBtn,
			fontSizePillValue,
			input,
			textarea,
			error,
		};
	}, [theme]);

	useEffect(() => {
		setTitle(noteData.title);
		setContent(noteData.content);
	}, [noteData]);

	function save(next: { title: string; content: string }) {
		const hit = findNoteById(noteId);
		if (!hit) return;

		const idx = hit.notes.findIndex((n) => n.id === noteId);
		if (idx === -1) return;

		const updated: NoteRow = {
			...hit.notes[idx],
			classId: hit.classId,
			title: next.title,
			content: next.content,
			updatedAt: nowIso(),
		};

		const nextNotes = hit.notes.slice();
		nextNotes[idx] = updated;
		localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
	}

	function deleteSelf() {
		const hit = findNoteById(noteId);
		if (!hit) return;

		const label = hit.note.title || "Untitled note";
		const ok = window.confirm(`Delete "${label}"? This cannot be undone.`);
		if (!ok) return;

		const nextNotes = hit.notes.filter((n) => n.id !== noteId);
		localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
		router.push(`/class/${encodeURIComponent(hit.classId)}`);
	}

	function applyContentEdit(nextValue: string, nextCursor?: { start: number; end: number }) {
		setContent(nextValue);
		save({ title, content: nextValue });
		if (nextCursor && taRef.current) {
			requestAnimationFrame(() => {
				if (!taRef.current) return;
				taRef.current.selectionStart = nextCursor.start;
				taRef.current.selectionEnd = nextCursor.end;
			});
		}
	}

	function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		const ta = e.currentTarget;
		const { start, end } = getSelection(ta);
		const value = ta.value;

		// TAB / SHIFT+TAB = indent/outdent (doc-like)
		if (e.key === "Tab") {
			e.preventDefault();

			const selection = value.slice(start, end);
			const lineStart = lineStartIndex(value, start);
			const selectionEndLine = lineStartIndex(value, end);

			// Multi-line selection: indent/outdent every line in the selection span.
			const affectsMultipleLines = selection.includes("\n") || lineStart !== selectionEndLine;

			if (affectsMultipleLines) {
				const before = value.slice(0, lineStart);
				const block = value.slice(lineStart, end);
				const after = value.slice(end);

				if (e.shiftKey) {
					// remove one leading tab (or 2 spaces) per line
					const lines = block.split("\n");
					let removed = 0;
					const nextLines = lines.map((line) => {
						if (line.startsWith("\t")) {
							removed += 1;
							return line.slice(1);
						}
						if (line.startsWith("  ")) {
							removed += 2;
							return line.slice(2);
						}
						return line;
					});
					const nextBlock = nextLines.join("\n");
					const nextValue = before + nextBlock + after;
					applyContentEdit(nextValue, {
						start: Math.max(lineStart, start - 1),
						end: Math.max(lineStart, end - removed),
					});
					return;
				}

				// indent
				const lines = block.split("\n");
				const nextBlock = lines.map((line) => `\t${line}`).join("\n");
				const nextValue = before + nextBlock + after;
				applyContentEdit(nextValue, { start: start + 1, end: end + lines.length });
				return;
			}

			// Single cursor
			if (e.shiftKey) {
				// outdent: if cursor is at/after indentation, remove one indent unit
				const ls = lineStartIndex(value, start);
				const indent = getLineIndent(value, ls);
				if (indent.length === 0) return;

				const removeLen = indent.startsWith("\t") ? 1 : indent.startsWith("  ") ? 2 : 1;
				const nextValue = value.slice(0, ls) + indent.slice(removeLen) + value.slice(ls + indent.length);
				applyContentEdit(nextValue, { start: Math.max(ls, start - removeLen), end: Math.max(ls, start - removeLen) });
				return;
			}

			// indent: insert a tab at cursor
			const nextValue = value.slice(0, start) + "\t" + value.slice(end);
			applyContentEdit(nextValue, { start: start + 1, end: start + 1 });
			return;
		}

		// ENTER = keep current line indentation
		if (e.key === "Enter") {
			const ls = lineStartIndex(value, start);
			const indent = getLineIndent(value, ls);
			if (!indent) return;

			e.preventDefault();
			const insert = `\n${indent}`;
			const nextValue = value.slice(0, start) + insert + value.slice(end);
			applyContentEdit(nextValue, { start: start + insert.length, end: start + insert.length });
			return;
		}
	}

	if (!noteData.loaded) return null;

	if (noteData.notFound) {
		return (
			<main style={styles.stage}>
				<div style={styles.container}>
					<div style={styles.header}>
						<div>
							<div style={styles.h1}>Note not found</div>
							<div style={styles.sub}>This note was not found in local storage.</div>
						</div>
						<div style={styles.actions}>
							<Link href="/dashboard" style={styles.action}>
								Back to dashboard
							</Link>
						</div>
					</div>

					<div style={styles.error}>
						This note id does not exist in any <code>cortex:classes:\*:notes:v1</code> bucket.
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
						<div style={styles.sub}>{noteData.classId}</div>
					</div>

					<div style={styles.actions}>
						<Link href={`/class/${encodeURIComponent(noteData.classId)}`} style={styles.action}>
							Back to class
						</Link>

												<button type="button" style={styles.dangerAction} onClick={deleteSelf}>
							Delete
						</button>

						<button
							type="button"
							style={styles.action}
							onClick={() => {
								save({ title, content });
								router.push(`/class/${encodeURIComponent(noteData.classId)}`);
							}}
						>
							Done
						</button>
					</div>
				</header>

				<div style={styles.docShell}>
					<div style={styles.paper}>
						<input
							value={title}
							onChange={(e) => {
								const next = e.target.value;
								setTitle(next);
								save({ title: next, content });
							}}
							placeholder="Untitled note"
							style={styles.input}
						/>

						{/* Toolbar layout only (no logic yet) */}
						<div style={styles.toolbar} aria-label="Editor toolbar">
							<div style={styles.toolGroup}>
								<span style={styles.toolLabel}>Text</span>
								<button type="button" disabled style={styles.toolBtn} aria-label="Bold">
									B
								</button>
								<button type="button" disabled style={styles.toolBtnItalic} aria-label="Italic">
									I
								</button>
								<button type="button" disabled style={styles.toolBtnUnderline} aria-label="Underline">
									U
								</button>
								<div style={styles.toolDivider} />
								<button type="button" disabled style={styles.toolBtn} aria-label="Heading 1">
									H1
								</button>
								<button type="button" disabled style={styles.toolBtn} aria-label="Heading 2">
									H2
								</button>
								<button type="button" disabled style={styles.toolBtn} aria-label="Heading 3">
									H3
								</button>
							</div>

							<div style={styles.toolGroup}>
								<span style={styles.toolLabel}>Style</span>

								<div style={styles.fontSizePill} aria-label="Font size">
									<button type="button" disabled style={styles.fontSizePillBtn} aria-label="Font size down">
										−
									</button>
									<div style={styles.fontSizePillValue} aria-label="Current font size">
										20
									</div>
									<button type="button" disabled style={styles.fontSizePillBtn} aria-label="Font size up">
										+
									</button>
								</div>

								<div style={styles.toolDivider} />
								<button type="button" disabled style={styles.toolBtn} aria-label="Bulleted list">
									• List
								</button>
								<button type="button" disabled style={styles.toolBtn} aria-label="Numbered list">
									1. List
								</button>
								<button type="button" disabled style={styles.toolBtn} aria-label="Quote">
									" Quote
								</button>
							</div>
						</div>

						<textarea
							ref={taRef}
							value={content}
							onChange={(e) => applyContentEdit(e.target.value)}
							onKeyDown={onTextareaKeyDown}
							placeholder="Write your notes here..."
							style={styles.textarea}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}