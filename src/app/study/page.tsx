"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DashboardLayout from "@/components/DashboardLayout";
import type { NoteRow, OnboardingPayload } from "@/types";
import { safeJsonParse, nowIso, newId } from "@/lib/utils";
import { slugifyClassName, loadAllNotes, getNotesBucketKey } from "@/lib/notes/storage";

const USER_ID_KEY = "cortex:userId";

export default function StudyPage() {
	const router = useRouter();

	const [payload, setPayload] = useState<OnboardingPayload | null>(null);
	const [recentNotes, setRecentNotes] = useState<NoteRow[] | null>(null);
	const [createClassId, setCreateClassId] = useState<string>("");

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
			setRecentNotes(all.slice(0, 10));
		} catch {
			setRecentNotes([]);
		}
	}, []);

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

		const hero: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.03)",
			padding: 16,
			display: "flex",
			alignItems: "flex-start",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
			minHeight: 92,
		};

		const heroTitle: React.CSSProperties = { fontSize: 16, fontWeight: 900, letterSpacing: 0.2 };
		const heroBody: React.CSSProperties = { fontSize: 13, color: theme.muted, lineHeight: 1.45, marginTop: 6 };

		const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

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

		const grid2: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
			gap: 14,
			alignItems: "start",
		};

		const card: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: theme.panel,
			padding: 14,
			minHeight: 220,
		};

		const cardTitle: React.CSSProperties = { fontSize: 14, fontWeight: 900, letterSpacing: 0.2 };
		const cardSub: React.CSSProperties = { fontSize: 12, color: theme.muted, marginTop: 4 };

		const list: React.CSSProperties = { marginTop: 10, display: "flex", flexDirection: "column", gap: 8 };

		const row: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 12,
			padding: "10px 10px",
			borderRadius: 14,
			border: `1px solid rgba(255,255,255,0.08)`,
			background: "rgba(0,0,0,0.18)",
			textDecoration: "none",
			color: theme.text,
		};

		const rowTitle: React.CSSProperties = { fontSize: 13, fontWeight: 850, lineHeight: 1.2 };
		const rowMeta: React.CSSProperties = { fontSize: 12, color: theme.muted, lineHeight: 1.2 };

		const empty: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.03)",
			padding: 14,
			color: theme.muted,
			fontSize: 13,
			lineHeight: 1.45,
		};

		const select: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			padding: "10px 10px",
			background: "rgba(0,0,0,0.18)",
			color: theme.text,
			fontWeight: 800,
			fontSize: 13,
			outline: "none",
			maxWidth: "100%",
		};

		const footerLabel: React.CSSProperties = { marginBottom: 6 };
		const footerValue: React.CSSProperties = { fontWeight: 700, color: theme.text };

		return {
			container,
			header,
			h1,
			sub,
			hero,
			heroTitle,
			heroBody,
			actions,
			btn,
			primaryBtn,
			grid2,
			card,
			cardTitle,
			cardSub,
			list,
			row,
			rowTitle,
			rowMeta,
			empty,
			select,
			footerLabel,
			footerValue,
		};
	}, [theme]);

	const classes = payload?.classes ?? [];

	const subtitle = (() => {
		if (!payload) return "Welcome back.";
		if (payload.educationLevel === "highSchool") return `High school · Grade ${payload.grade} · ${classes.length} classes`;
		const parts: string[] = ["College"];
		if (payload.collegeName) parts.push(payload.collegeName);
		if (payload.major) parts.push(payload.major);
		parts.push(`${classes.length} classes`);
		return parts.join(" · ");
	})();

	const lastNote = recentNotes && recentNotes.length > 0 ? recentNotes[0] : null;

	function startStudy() {
		if (lastNote) {
			router.push(`/note/${lastNote.id}`);
			return;
		}
		if (classes.length > 0) {
			router.push(`/class/${slugifyClassName(classes[0])}`);
			return;
		}
		router.push("/onboarding");
	}

	function openLastNote() {
		if (!lastNote) return;
		router.push(`/note/${lastNote.id}`);
	}

	// Writes to slug bucket so it shows up on /class/[slug]
	function createNoteInClass(className: string) {
		const classSlug = slugifyClassName(className);

		const id = newId();
		const bucketKey = getNotesBucketKey(classSlug);

		const raw = localStorage.getItem(bucketKey);
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		const existing = Array.isArray(parsed) ? parsed : [];

		const nextNote: NoteRow = {
			id,
			classId: classSlug,
			title: `${classSlug} ${existing.length + 1}.1`,
			updatedAt: nowIso(),
			content: "",
		};

		const next = [nextNote, ...existing];
		localStorage.setItem(bucketKey, JSON.stringify(next));
		router.push(`/note/${id}`);
	}

	return (
		<DashboardLayout
			theme={theme}
			sidebarTitle="Cortex"
			sidebarItems={[
				{ label: "Study", href: "/study", active: true },
				{ label: "My Drive", href: "/dashboard" },
				{ label: "Study session", href: "/study/session" },
				{ label: "Edit classes", href: "/onboarding?step=classes" },
				{ type: "divider" },
				{ label: "← Home", href: "/" },
				{ type: "divider" },
				{
					type: "button",
					label: "Switch account",
					onClick: () => {
						localStorage.clear();
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
						<div style={styles.h1}>Study</div>
						<div style={styles.sub}>{subtitle}</div>
					</div>
				</header>

				<section style={styles.hero} aria-label="What now">
					<div>
						<div style={styles.heroTitle}>{lastNote ? "Continue where you left off" : "What now?"}</div>
						<div style={styles.heroBody}>
							{lastNote
								? "Open your most recent note in one click."
								: classes.length > 0
									? "Create your first note to start studying."
									: "Add a class, then create your first note."}
						</div>
					</div>

					<div style={styles.actions}>
						<button type="button" style={styles.primaryBtn} onClick={startStudy}>
							Continue studying
						</button>

						{lastNote ? (
							<button type="button" style={styles.btn} onClick={openLastNote}>
								Open last note
							</button>
						) : null}

						{classes.length > 0 ? (
							<>
								<select
									value={createClassId}
									onChange={(e) => setCreateClassId(e.target.value)}
									style={styles.select}
									aria-label="Choose class for new note"
								>
									<option value="">Choose class…</option>
									{classes.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>

								<button
									type="button"
									style={styles.btn}
									onClick={() => {
										if (!createClassId) return;
										createNoteInClass(createClassId);
									}}
								>
									New note
								</button>
							</>
						) : null}

						<Link href="/onboarding?step=classes" style={styles.btn}>
							New class
						</Link>
					</div>
				</section>

				<div style={styles.grid2}>
					<section style={styles.card} aria-label="Recent notes">
						<div style={styles.cardTitle}>Recent notes</div>
						<div style={styles.cardSub}>Jump back into your latest work.</div>

						{recentNotes === null ? (
							<div style={styles.empty}>Loading recent notes…</div>
						) : recentNotes.length === 0 ? (
							<div style={styles.empty}>
								No notes yet. Use <strong>New class</strong> and <strong>New note</strong> to get started.
							</div>
						) : (
							<div style={styles.list}>
								{recentNotes.slice(0, 8).map((n) => (
									<Link key={n.id} href={`/note/${n.id}`} style={styles.row}>
										<div>
											<div style={styles.rowTitle}>{n.title || "Untitled note"}</div>
											<div style={styles.rowMeta}>{n.classId}</div>
										</div>
										<div style={styles.rowMeta}>Open</div>
									</Link>
								))}
							</div>
						)}
					</section>

					<section style={styles.card} aria-label="Quick create">
						<div style={styles.cardTitle}>Quick create</div>
						<div style={styles.cardSub}>Fast paths for getting back to work.</div>

						{classes.length === 0 ? (
							<div style={styles.empty}>
								You do not have any classes yet. Create one in onboarding to start taking notes.
								<div style={{ height: 10 }} />
								<Link href="/onboarding?step=classes" style={styles.btn}>
									Create a class
								</Link>
							</div>
						) : (
							<div style={styles.list}>
								<div style={styles.empty}>
									<select
										value={createClassId}
										onChange={(e) => setCreateClassId(e.target.value)}
										style={styles.select}
										aria-label="Choose class for new note (quick create)"
									>
										<option value="">Choose class…</option>
										{classes.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>

									<div style={{ height: 10 }} />

									<button
										type="button"
										style={styles.primaryBtn}
										onClick={() => {
											if (!createClassId) return;
											createNoteInClass(createClassId);
										}}
									>
										Create note
									</button>
								</div>

								<Link href="/onboarding?step=classes" style={styles.row}>
									<div>
										<div style={styles.rowTitle}>New class</div>
										<div style={styles.rowMeta}>Add or edit your classes</div>
									</div>
									<div style={styles.rowMeta}>Open</div>
								</Link>
							</div>
						)}
					</section>
				</div>
			</div>
		</DashboardLayout>
	);
}