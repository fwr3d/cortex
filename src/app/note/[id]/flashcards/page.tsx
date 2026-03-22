"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type FlashcardSource = { quote: string };

type Flashcard = {
	front: string;
	back: string;
	sources: FlashcardSource[];
};

import { safeJsonParse } from "@/lib/utils";

function storageKey(noteId: string) {
	return `cortex:notes:${noteId}:flashcards:v1`;
}

export default function NoteFlashcardsPage() {
	const params = useParams<{ id: string }>();
	const noteId = String(params?.id ?? "");

	const [idx, setIdx] = useState(0);
	const [showBack, setShowBack] = useState(false);

	const data = useMemo(() => {
		const raw = localStorage.getItem(storageKey(noteId));
		const parsed = raw ? safeJsonParse<{ cards: Flashcard[]; message?: string }>(raw) : null;
		const cards = Array.isArray(parsed?.cards) ? parsed!.cards : [];
		return { cards, message: parsed?.message ?? "" };
	}, [noteId]);

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
			accent: "#16a34a",
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

		const h1: React.CSSProperties = { fontSize: 22, fontWeight: 850, letterSpacing: 0.2 };
		const sub: React.CSSProperties = { fontSize: 13, color: theme.muted, lineHeight: 1.4 };

		const card: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.03)",
			padding: 16,
		};

		const btn: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			padding: "10px 12px",
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 800,
			fontSize: 13,
			textDecoration: "none",
			whiteSpace: "nowrap",
		};

		const primaryBtn: React.CSSProperties = {
			...btn,
			border: `1px solid rgba(22,163,74,0.55)`,
			background: "rgba(22,163,74,0.12)",
		};

		const quote: React.CSSProperties = {
			marginTop: 10,
			border: "1px solid rgba(255,255,255,0.10)",
			borderRadius: 14,
			background: "rgba(0,0,0,0.18)",
			padding: 12,
			fontSize: 13,
			lineHeight: 1.5,
			color: theme.text,
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

		const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 };

		return { stage, container, header, h1, sub, card, btn, primaryBtn, quote, empty, actions };
	}, [theme]);

	const cards = data.cards;
	const cur = cards[idx];

	if (!noteId) return null;

	return (
		<main style={styles.stage}>
			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>Flashcards</div>
						<div style={styles.sub}>
							{cards.length > 0 ? `Card ${idx + 1}/${cards.length}` : "No flashcards yet."}
						</div>
						{data.message ? <div style={styles.sub}>{data.message}</div> : null}
					</div>

					<div style= {{display: "flex", gap: 10, flexWrap: "wrap" }}>
						<Link href={`/note/${noteId}`} style={styles.btn}>
							Back to note
						</Link>
					</div>
				</header>

				{cards.length === 0 ? (
					<div style={styles.empty}>
						No flashcards generated for this note yet.
						<br />
						Go back to the note and click <strong>Generate flashcards</strong>.
					</div>
				) : (
					<section style={styles.card} aria-label="Flashcard">
						<div style= {{fontSize: 12, color: theme.muted, fontWeight: 900, letterSpacing: 0.2 }}>
							Front
						</div>
						<div style= {{fontSize: 16, fontWeight: 900, marginTop: 6 }}>
							{cur.front}
						</div>

						<div style={styles.actions}>
							<button type="button" style={styles.primaryBtn} onClick={() => setShowBack((v) => !v)}>
								{showBack ? "Hide answer" : "Reveal"}
							</button>

							<button
								type="button"
								style={styles.btn}
								onClick={() => {
									setShowBack(false);
									setIdx((i) => Math.max(0, i - 1));
								}}
								disabled={idx === 0}
							>
								Prev
							</button>

							<button
								type="button"
								style={styles.btn}
								onClick={() => {
									setShowBack(false);
									setIdx((i) => Math.min(cards.length - 1, i + 1));
								}}
								disabled={idx >= cards.length - 1}
							>
								Next
							</button>
						</div>

						{showBack ? (
							<>
								<div style= {{fontSize: 12, color: theme.muted, fontWeight: 900, letterSpacing: 0.2, marginTop: 14 }}>
									Back
								</div>
								<div style= {{fontSize: 14, fontWeight: 800, marginTop: 6, lineHeight: 1.5 }}>
									{cur.back}
								</div>

								<div style= {{fontSize: 12, color: theme.muted, fontWeight: 900, letterSpacing: 0.2, marginTop: 14 }}>
									From your notes
								</div>

								{cur.sources.slice(0, 2).map((s, i) => (
									<div key={i} style={styles.quote}>
										"{s.quote}"
									</div>
								))}
							</>
						) : null}
					</section>
				)}
			</div>
		</main>
	);
}