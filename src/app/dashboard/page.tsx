"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OnboardingPayload = {
	grade: 9 | 10 | 11 | 12;
	classes: string[];
	savedAt: string;
};

export default function DashboardPage() {
	const [payload, setPayload] = useState<OnboardingPayload | null>(null);

	useEffect(() => {
		try {
			const raw = localStorage.getItem("cortex:onboarding:v1");
			if (!raw) {
				setPayload(null);
				return;
			}
			setPayload(JSON.parse(raw));
		} catch {
			setPayload(null);
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
			shadow: "rgba(0,0,0,0.65)",
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

		const grid: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
			gap: 12,
		};

		const card: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: theme.panel,
			boxShadow: `0 22px 70px ${theme.shadow}`,
			padding: 14,
			display: "flex",
			flexDirection: "column",
			gap: 10,
		};

		const cardTitle: React.CSSProperties = {
			fontWeight: 850,
			letterSpacing: 0.2,
		};

		const primary: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			padding: "10px 12px",
			background: theme.accent,
			color: "#07110d",
			cursor: "pointer",
			fontWeight: 800,
			fontSize: 13,
			textDecoration: "none",
			textAlign: "center",
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

		return { stage, container, header, h1, sub, actions, action, grid, card, cardTitle, primary, empty };
	}, [theme]);

	const classes = payload?.classes ?? [];

	return (
		<main style={styles.stage}>
			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>Dashboard</div>
						<div style={styles.sub}>
							{payload ? `Grade ${payload.grade} · ${classes.length} classes` : "No saved onboarding data yet."}
						</div>
					</div>
					<div style={styles.actions}>
						<Link href="/onboarding" style={styles.action}>
							Edit classes
						</Link>
						<button
							type="button"
							style={styles.action}
							onClick={() => {
								localStorage.removeItem("cortex:onboarding:v1");
								setPayload(null);
							}}
						>
							Clear saved data
						</button>
					</div>
				</header>

				{classes.length === 0 ? (
					<div style={styles.empty}>
						No classes yet. Go to <Link href="/onboarding" style={styles.action}>onboarding</Link> to add them.
					</div>
				) : null}

				<section style={styles.grid} aria-label="Classes">
					{classes.map((name) => (
						<div key={name} style={styles.card}>
							<div style={styles.cardTitle}>{name}</div>
							<Link href="#" style={styles.primary}>
								Open
							</Link>
						</div>
					))}
				</section>

				<Link href="/" style={styles.action}>
					Back to home
				</Link>
			</div>
		</main>
	);
}