"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const USER_ID_KEY = "cortex:userId";

type CreateUserIdResult = { ok: true; userId: string } | { ok: false; error: string };

function getOrCreateUserIdSafe(): CreateUserIdResult {
	try {
		const existing = localStorage.getItem(USER_ID_KEY);
		if (existing) return { ok: true, userId: existing };

		const id = crypto.randomUUID();
		localStorage.setItem(USER_ID_KEY, id);
		const confirm = localStorage.getItem(USER_ID_KEY);
		if (!confirm) return { ok: false, error: "Failed to persist local user id" };

		return { ok: true, userId: id };
	} catch {
		return {
			ok: false,
			error: "Could not access localStorage. Check browser privacy settings or disable blocking for localhost.",
		};
	}
}

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState<string>("");

	useEffect(() => {
		// If a user id already exists, skip login.
		try {
			const existing = localStorage.getItem(USER_ID_KEY);
			if (existing) {
    const onboardingKey = `cortex:users:${existing}:onboarding:v1`;
    const onboarded = localStorage.getItem(onboardingKey);
    router.push(onboarded ? "/dashboard" : "/onboarding");
}
		} catch {
			// ignore
		}
	}, [router]);

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

		const errorText: React.CSSProperties = {
			fontSize: 12,
			color: "rgba(255, 170, 170, 0.95)",
			lineHeight: 1.35,
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

		return { stage, shell, header, title, subtitle, body, btn, errorText, foot, link };
	}, [theme]);

	return (
		<main style={styles.stage}>
			<section style={styles.shell} aria-label="Login">
				<header style={styles.header}>
					<div style={styles.title}>Create your Cortex account</div>
					<div style={styles.subtitle}>
						Temporary offline mode: this creates a local account on this device so we can save your classes.
					</div>
				</header>

				<div style={styles.body}>
					<button
						type="button"
						style={styles.btn}
						onClick={() => {
							setError("");
							const res = getOrCreateUserIdSafe();
							if (!res.ok) {
								setError(res.error);
								return;
							}
							router.push("/onboarding");
						}}
					>
						Continue
					</button>

					{error ? <div style={styles.errorText}>{error}</div> : null}
				</div>

				<footer style={styles.foot}>
					<Link href="/" prefetch style={styles.link}>
						Home
					</Link>
				</footer>
			</section>
		</main>
	);
}