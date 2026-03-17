"use client";

import React, { useEffect, useMemo, useState } from "react";
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

function notesKey(classId: string) {
	return `cortex:classes:${classId}:notes:v1`;
}

function newId() {
	return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function nowIso() {
	return new Date().toISOString();
}

function NoteIcon({ size = 104 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 392 512.302"
			width={size}
			height={size}
			shapeRendering="geometricPrecision"
			textRendering="geometricPrecision"
			imageRendering="optimizeQuality"
			fillRule="evenodd"
			clipRule="evenodd"
			aria-hidden="true"
			style= {{display: "block" }}
		>
			<path
				fill="#6DBF39"
				d="M58.884 0h203.881L392 139.817v313.601c0 32.329-26.556 58.884-58.884 58.884H58.884C26.545 512.302 0 485.808 0 453.418V58.884C0 26.495 26.495 0 58.884 0z"
			/>
			<path
				fill="#4F8C29"
				fillRule="nonzero"
				d="M107.777 403.336c-7.206 0-13.05-5.844-13.05-13.05s5.844-13.051 13.05-13.051h141.706c7.206 0 13.05 5.845 13.05 13.051s-5.844 13.05-13.05 13.05H107.777zm0-152.327c-7.206 0-13.05-5.844-13.05-13.05s5.844-13.051 13.05-13.051h176.447c7.205 0 13.05 5.845 13.05 13.051s-5.845 13.05-13.05 13.05H107.777zm0 73.165c-7.206 0-13.05-5.845-13.05-13.051s5.844-13.05 13.05-13.05h167.099c7.206 0 13.05 5.844 13.05 13.05s-5.844 13.051-13.05 13.051H107.777z"
			/>
			<path
				fill="#589B2E"
				d="M310.105 136.615h-.019l81.913 68.296v-64.92h-55.664c-9.685-.154-18.43-1.304-26.23-3.376z"
			/>
			<path
				fill="#DFFACD"
				d="M262.765 0l129.234 139.816v.175h-55.664c-46.151-.734-70.996-23.959-73.57-62.859V0z"
			/>
		</svg>
	);
}

export default function ClassClient({ classId }: { classId: string }) {
	const router = useRouter();
	const [notes, setNotes] = useState<NoteRow[]>([]);

	useEffect(() => {
		const raw = localStorage.getItem(notesKey(classId));
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		setNotes(Array.isArray(parsed) ? parsed : []);
	}, [classId]);

	function persist(next: NoteRow[]) {
		setNotes(next);
		localStorage.setItem(notesKey(classId), JSON.stringify(next));
	}

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
			gap: 16,
		};

		const header: React.CSSProperties = {
			display: "flex",
			alignItems: "baseline",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
		};

		const h1: React.CSSProperties = {
			fontSize: 22,
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

		// Grid like dashboard classes, explicitly left-to-right.
		const grid: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
			gap: 18,
			marginTop: 6,
			justifyContent: "start",
			justifyItems: "start",
		};

		// Tile is the click target, no box behind it.
		const noteTile: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			gap: 10,
			padding: "12px 10px",
			borderRadius: 18,
			textDecoration: "none",
			border: "none",
			background: "transparent",
			boxShadow: "none",
			cursor: "pointer",
			userSelect: "none",
			color: theme.text,
		};

		const noteIconWrap: React.CSSProperties = {
			width: 160,
			maxWidth: "100%",
			display: "flex",
			justifyContent: "center",
		};

		const noteTitle: React.CSSProperties = {
			fontSize: 13,
			fontWeight: 850,
			color: theme.text,
			lineHeight: 1.2,
			textAlign: "left",
			maxWidth: 180,
		};

		const empty: React.CSSProperties = {
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
			grid,
			noteTile,
			noteIconWrap,
			noteTitle,
			empty,
		};
	}, [theme]);

	return (
		<main style={styles.stage}>
			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>{classId}</div>
						<div style={styles.sub}>{notes.length} notes</div>
					</div>

					<div style={styles.actions}>
						<button
							type="button"
							style={styles.action}
							onClick={() => {
								const id = newId();
								const nextNote: NoteRow = {
									id,
									classId,
									title: "Untitled note",
									updatedAt: nowIso(),
									content: "",
								};

								const next = [nextNote, ...notes];
								persist(next);

								// No query param needed.
								router.push(`/note/${id}`);
							}}
						>
							New note
						</button>

						<Link href="/dashboard" style={styles.action}>
							Back to dashboard
						</Link>
					</div>
				</header>

				{notes.length === 0 ? (
					<div style={styles.empty}>
						No notes yet. Click <strong>New note</strong> to create the first one.
					</div>
				) : null}

				<section style={styles.grid} aria-label="Notes">
					{notes.map((n) => (
						<Link
							key={n.id}
							href={`/note/${n.id}`}
							style={styles.noteTile}
							aria-label={`Open note ${n.title || "Untitled note"}`}
						>
							<div style={styles.noteIconWrap}>
								<NoteIcon size={104} />
							</div>
							<div style={styles.noteTitle}>{n.title || "Untitled note"}</div>
						</Link>
					))}
				</section>
			</div>
		</main>
	);
}