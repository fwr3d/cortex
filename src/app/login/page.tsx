"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();

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
			display: "grid",
			placeItems: "center",
			padding: "28px 18px",
			backgroundColor: theme.bg,
			color: theme.text,
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
		};

		const shell: React.CSSProperties = {
			width: "min(520px, 100%)",
			borderRadius: 20,
			border: `1px solid ${theme.border}`,
			background: theme.panel,
			boxShadow: `0 34px 90px ${theme.shadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
			padding: 18,
		};

		const header: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 6,
			padding: "6px 6px 12px",
		};

		const title: React.CSSProperties = {
			fontSize: 22,
			fontWeight: 800,
			letterSpacing: 0.2,
		};

		const subtitle: React.CSSProperties = {
			fontSize: 13,
			color: theme.muted,
			lineHeight: 1.4,
		};

		const body: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 12,
			padding: 6,
		};

		const btn: React.CSSProperties = {
			width: "100%",
			border: `1px solid ${theme.border}`,
			cursor: "pointer",
			padding: "12px 14px",
			borderRadius: 14,
			background: theme.accent,
			color: "#07110d",
			fontWeight: 800,
			fontSize: 13,
		};

		const foot: React.CSSProperties = {
			padding: "12px 6px 4px",
			fontSize: 12,
			color: theme.muted,
			display: "flex",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
		};

		const link: React.CSSProperties = {
			color: theme.text,
			textDecoration: "none",
			borderBottom: `1px solid ${theme.border}`,
			paddingBottom: 1,
		};

		return { stage, shell, header, title, subtitle, body, btn, foot, link };
	}, [theme]);

	return (
		<main style={styles.stage}>
			<section style={styles.shell} aria-label="Login">
				<header style={styles.header}>
					<div style={styles.title}>Create your Cortex account</div>
					<div style={styles.subtitle}>
						Supabase auth is temporarily disabled due to network issues. Continue to onboarding to keep building.
					</div>
				</header>

				<div style={styles.body}>
					<button type="button" style={styles.btn} onClick={() => router.push("/onboarding")}>
						Continue
					</button>
				</div>

				<footer style={styles.foot}>
					<Link href="/" prefetch style={styles.link}>
						Home
					</Link>
					<Link href="/onboarding" prefetch style={styles.link}>
						Onboarding
					</Link>
				</footer>
			</section>
		</main>
	);
}