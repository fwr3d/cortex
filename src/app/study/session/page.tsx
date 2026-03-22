"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import type { NoteRow, OnboardingPayload } from "@/types";
import { safeJsonParse, nowIso } from "@/lib/utils";
import { loadAllNotes, slugifyClassName } from "@/lib/notes/storage";

const USER_ID_KEY = "cortex:userId";
const SESSION_SIZE = 5;

// Session persistence (for Dashboard "Resume")
const LAST_SESSION_KEY = "cortex:lastSession:v1";

type StudyCard = {
	noteId: string;
	classId: string;
	title: string;
	preview: string;
	updatedAt: string;
};

type LastSession = {
	startedAt: string; // ISO
	completedAt?: string; // ISO
	noteIds: string[];
	idx: number;
	source?: "continue" | "resume";
};

function toPlainTextFromTipTapJsonMaybe(raw: string): string {
	try {
		const obj = JSON.parse(raw) as any;
		if (!obj || typeof obj !== "object") return raw;

		const chunks: string[] = [];
		function walk(node: any) {
			if (!node) return;
			if (typeof node.text === "string") chunks.push(node.text);
			if (Array.isArray(node.content)) node.content.forEach(walk);
		}
		walk(obj);

		const s = chunks.join(" ").replace(/\s+/g, " ").trim();
		return s || raw;
	} catch {
		return raw;
	}
}

function buildCardsFromNotes(notes: NoteRow[]): StudyCard[] {
	return notes.map((n) => {
		const text = toPlainTextFromTipTapJsonMaybe(n.content ?? "");
		const preview = text.length > 420 ? `${text.slice(0, 420)}…` : text;
		return {
			noteId: n.id,
			classId: n.classId,
			title: n.title || "Untitled note",
			preview: preview || "No content yet.",
			updatedAt: n.updatedAt,
		};
	});
}

function loadLastSession(): LastSession | null {
	const raw = localStorage.getItem(LAST_SESSION_KEY);
	if (!raw) return null;
	const parsed = safeJsonParse<LastSession>(raw);
	if (!parsed) return null;
	if (!Array.isArray(parsed.noteIds)) return null;
	if (typeof parsed.startedAt !== "string") return null;
	if (typeof parsed.idx !== "number") return null;
	return parsed;
}

function isSessionResumable(s: LastSession | null) {
	if (!s) return false;
	if (s.completedAt) return false;
	if (!s.noteIds.length) return false;
	if (s.idx < 0) return false;
	if (s.idx >= s.noteIds.length) return false;
	return true;
}

function persistSession(s: LastSession) {
	localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(s));
}

export default function StudySessionPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const wantResume = searchParams.get("resume") === "1";

	const [payload, setPayload] = useState<OnboardingPayload | null>(null);

	// All cards (sorted by recency), and session is a slice of these.
	const [allCards, setAllCards] = useState<StudyCard[]>([]);
	const [sessionCards, setSessionCards] = useState<StudyCard[]>([]);
	const [idx, setIdx] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		try {
			const userId = localStorage.getItem(USER_ID_KEY);
			if (!userId) {
				setPayload(null);
				return;
			}
			const raw = localStorage.getItem(`cortex:users:${userId}:onboarding:v1`);
			if (!raw) {
				setPayload(null);
				return;
			}
			setPayload(safeJsonParse<OnboardingPayload>(raw));
		} catch {
			setPayload(null);
		}
	}, []);

	useEffect(() => {
		try {
			const all = loadAllNotes();
			all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
			const cards = buildCardsFromNotes(all);
			setAllCards(cards);

			// Resume if requested and possible; else start a fresh session
			const existing = loadLastSession();
			const canResume = wantResume && isSessionResumable(existing);

			if (canResume && existing) {
				const noteIdSet = new Set(existing.noteIds);
				const resumed = cards.filter((c) => noteIdSet.has(c.noteId));

				// Preserve the stored order
				resumed.sort((a, b) => existing.noteIds.indexOf(a.noteId) - existing.noteIds.indexOf(b.noteId));

				setSessionCards(resumed.slice(0, SESSION_SIZE));
				setIdx(Math.min(existing.idx, Math.max(0, resumed.length - 1)));
				setRevealed(false);
				setIsComplete(false);

				// Refresh session metadata (keep "resume" source)
				persistSession({
					...existing,
					source: "resume",
				});

				return;
			}

			const firstSession = cards.slice(0, SESSION_SIZE);
			setSessionCards(firstSession);
			setIdx(0);
			setRevealed(false);
			setIsComplete(false);

			// Persist new session immediately
			if (firstSession.length > 0) {
				persistSession({
					startedAt: nowIso(),
					noteIds: firstSession.map((c) => c.noteId),
					idx: 0,
					source: "continue",
				});
			}
		} catch {
			setAllCards([]);
			setSessionCards([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wantResume]);

	function startAnotherSession() {
		// Take the next chunk of cards after the current session.
		// If not enough cards, wrap to the start.
		if (allCards.length === 0) return;

		const currentStart = allCards.findIndex((c) => c.noteId === sessionCards[0]?.noteId);
		const start = currentStart >= 0 ? currentStart + sessionCards.length : SESSION_SIZE;

		const next = allCards.slice(start, start + SESSION_SIZE);
		const nextSession = next.length > 0 ? next : allCards.slice(0, SESSION_SIZE);

		setSessionCards(nextSession);
		setIdx(0);
		setRevealed(false);
		setIsComplete(false);

		if (nextSession.length > 0) {
			persistSession({
				startedAt: nowIso(),
				noteIds: nextSession.map((c) => c.noteId),
				idx: 0,
				source: "continue",
			});
		}
	}

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
			accent: "#16a34a",
			danger: "rgba(248,113,113,0.95)",
		}),
		[],
	);

	const styles = useMemo(() => {
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

		const panel: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.03)",
			padding: 16,
			minHeight: 240,
		};

		const panelTitle: React.CSSProperties = { fontSize: 16, fontWeight: 900, letterSpacing: 0.2 };
		const meta: React.CSSProperties = { fontSize: 12, color: theme.muted, marginTop: 6 };

		const prompt: React.CSSProperties = {
			marginTop: 12,
			fontSize: 13,
			color: theme.muted,
			lineHeight: 1.45,
		};

		const answer: React.CSSProperties = {
			marginTop: 12,
			border: `1px solid rgba(255,255,255,0.10)`,
			borderRadius: 14,
			background: "rgba(0,0,0,0.18)",
			padding: 12,
			fontSize: 13,
			lineHeight: 1.55,
			color: theme.text,
			whiteSpace: "pre-wrap",
		};

		const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 };

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
		};

		const primaryBtn: React.CSSProperties = {
			...btn,
			border: `1px solid rgba(22,163,74,0.55)`,
			background: "rgba(22,163,74,0.12)",
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

		const footerLabel: React.CSSProperties = { marginBottom: 6 };
		const footerValue: React.CSSProperties = { fontWeight: 700, color: theme.text };

		return {
			container,
			header,
			h1,
			sub,
			panel,
			panelTitle,
			meta,
			prompt,
			answer,
			actions,
			btn,
			primaryBtn,
			empty,
			footerLabel,
			footerValue,
		};
	}, [theme]);

	const subtitle = (() => {
		const classes = payload?.classes ?? [];
		if (!payload) return "Study session";
		if (payload.educationLevel === "highSchool") return `High school · Grade ${payload.grade} · ${classes.length} classes`;
		const parts: string[] = ["College"];
		if (payload.collegeName) parts.push(payload.collegeName);
		if (payload.major) parts.push(payload.major);
		parts.push(`${classes.length} classes`);
		return parts.join(" · ");
	})();

	const total = sessionCards.length;
	const cur = sessionCards[idx] ?? null;

	function fallbackNavigate() {
		const classes = payload?.classes ?? [];
		if (classes.length > 0) {
			router.push(`/class/${slugifyClassName(classes[0])}`);
			return;
		}
		router.push("/onboarding");
	}

	function onNext() {
		// Next counts as implicit "reviewed"
		if (idx >= total - 1) {
			setIsComplete(true);

			// Persist completion
			const existing = loadLastSession();
			if (existing && existing.noteIds.length > 0) {
				persistSession({
					...existing,
					idx: Math.min(existing.idx, Math.max(0, existing.noteIds.length - 1)),
					completedAt: nowIso(),
				});
			}
			return;
		}

		setIdx((i) => {
			const nextIdx = i + 1;

			// Persist progress
			const existing = loadLastSession();
			if (existing && existing.noteIds.length > 0) {
				persistSession({
					...existing,
					idx: nextIdx,
				});
			}

			return nextIdx;
		});
		setRevealed(false);
	}

	function onPrev() {
		setIdx((i) => {
			const nextIdx = Math.max(0, i - 1);

			// Persist progress (so resume lands where the user last was)
			const existing = loadLastSession();
			if (existing && existing.noteIds.length > 0) {
				persistSession({
					...existing,
					idx: nextIdx,
				});
			}

			return nextIdx;
		});
		setRevealed(false);
	}

	return (
		<DashboardLayout
			theme={theme}
			sidebarTitle="Cortex"
			sidebarItems={[
				{ label: "Study", href: "/study" },
				{ label: "Study session", href: "/study/session", active: true },
				{ label: "My Drive", href: "/dashboard" },
				{ label: "Edit classes", href: "/onboarding?step=classes" },
				{ label: "← Home", href: "/" },
				{ type: "divider" },
				{
					type: "button",
					label: "Switch account",
					onClick: () => {
						localStorage.removeItem(USER_ID_KEY);
						setPayload(null);
						router.push("/login");
					},
				},
			]}
			sidebarFooter={
				<>
					<div style={styles.footerLabel}>Signed in</div>
					<div style={styles.footerValue}>{payload ? "Local user" : "Not set"}</div>
				</>
			}
		>
			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>Study session</div>
						<div style={styles.sub}>{subtitle}</div>
					</div>

					<div style= {{display: "flex", gap: 10, flexWrap: "wrap" }}>
						<Link href="/study" style={styles.btn}>
							Back to Study
						</Link>
						<Link href="/dashboard" style={styles.btn}>
							Dashboard
						</Link>
					</div>
				</header>

				{total === 0 ? (
					<div style={styles.empty}>
						No recent notes yet.
						<br />
						Create a note first, then come back to start a study session.
						<div style= {{height: 10}} />
						<button type="button" style={styles.primaryBtn} onClick={fallbackNavigate}>
							Go to classes
						</button>
					</div>
				) : isComplete ? (
					<section style={styles.panel} aria-label="Session complete">
						<div style={styles.panelTitle}>Session complete</div>
						<div style={styles.meta}>You completed {total}/{total}.</div>

						<div style={styles.prompt}>
							Keep it small and repeatable. Come back later for another quick session.
						</div>

						<div style={styles.actions}>
							<button type="button" style={styles.primaryBtn} onClick={() => router.push("/dashboard")}>
								Done
							</button>
							<button type="button" style={styles.btn} onClick={startAnotherSession}>
								Start another {SESSION_SIZE}
							</button>
						</div>
					</section>
				) : (
					<section style={styles.panel} aria-label="Study card">
						<div style={styles.panelTitle}>
							{cur?.title ?? "Untitled note"}{" "}
							<span style= {{fontSize: 12, color: theme.muted, fontWeight: 900 }}>
								({idx + 1}/{total})
							</span>
						</div>

						<div style={styles.meta}>{cur?.classId}</div>

						<div style={styles.prompt}>Try to recall the key points before revealing.</div>

						<div style={styles.actions}>
							<button
								type="button"
								style={styles.primaryBtn}
								onClick={() => setRevealed(true)}
								disabled={revealed}
							>
								Reveal
							</button>

							{cur ? (
								<Link href={`/note/${cur.noteId}`} style={styles.btn}>
									Open in editor
								</Link>
							) : null}

							<button type="button" style={styles.btn} onClick={onPrev} disabled={idx === 0}>
								Prev
							</button>

							<button type="button" style={styles.btn} onClick={onNext}>
								Next
							</button>
						</div>

						{revealed && cur ? <div style={styles.answer}>{cur.preview}</div> : null}
					</section>
				)}
			</div>
		</DashboardLayout>
	);
}