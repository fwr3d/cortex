"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const USER_ID_KEY = "cortex:userId";

export default function LoginPage() {
	const router = useRouter();

	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Redirect if already authenticated
	useEffect(() => {
		supabase.auth.getSession().then(async ({ data: { session } }) => {
			if (!session) return;
			localStorage.setItem(USER_ID_KEY, session.user.id);
			const { data } = await supabase.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
			router.push(data ? "/dashboard" : "/onboarding");
		});
	}, [router]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (mode === "signup") {
				const { data, error } = await supabase.auth.signUp({ email, password });
				if (error) throw error;
				if (data.session) {
					// Session exists — email confirmation not required
					localStorage.setItem(USER_ID_KEY, data.session.user.id);
					router.push("/onboarding");
				} else if (data.user) {
					// No session — email confirmation required
					setError("Check your email to confirm your account, then sign in.");
				}
			} else {
				const { data, error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
				if (data.user) {
					localStorage.setItem(USER_ID_KEY, data.user.id);
					const { data: profile } = await supabase
						.from("profiles")
						.select("id")
						.eq("id", data.user.id)
						.maybeSingle();
					router.push(profile ? "/dashboard" : "/onboarding");
				}
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setLoading(false);
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
			width: "min(480px, 100%)",
			borderRadius: 20,
			border: `1px solid ${theme.border}`,
			background: theme.panel,
			boxShadow: `0 34px 90px ${theme.shadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
			padding: 20,
		};

		const header: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 6,
			padding: "6px 6px 16px",
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
			gap: 10,
			padding: "0 6px",
		};

		const label: React.CSSProperties = {
			fontSize: 12,
			fontWeight: 800,
			color: theme.muted,
			marginBottom: 4,
			display: "block",
		};

		const input: React.CSSProperties = {
			width: "100%",
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			background: "rgba(0,0,0,0.24)",
			color: theme.text,
			padding: "11px 13px",
			fontSize: 14,
			fontWeight: 600,
			outline: "none",
			boxSizing: "border-box",
		};

		const btn: React.CSSProperties = {
			width: "100%",
			border: "none",
			cursor: loading ? "not-allowed" : "pointer",
			padding: "12px 14px",
			borderRadius: 14,
			background: loading ? "rgba(22,163,74,0.5)" : theme.accent,
			color: "#07110d",
			fontWeight: 800,
			fontSize: 14,
			marginTop: 4,
		};

		const errorText: React.CSSProperties = {
			fontSize: 12,
			color: "rgba(255, 170, 170, 0.95)",
			lineHeight: 1.35,
			padding: "8px 10px",
			background: "rgba(255,100,100,0.08)",
			borderRadius: 10,
			border: "1px solid rgba(255,100,100,0.18)",
		};

		const toggleRow: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			gap: 6,
			fontSize: 13,
			color: theme.muted,
			marginTop: 8,
		};

		const toggleBtn: React.CSSProperties = {
			background: "none",
			border: "none",
			color: theme.text,
			fontWeight: 800,
			fontSize: 13,
			cursor: "pointer",
			padding: 0,
			textDecoration: "underline",
			textUnderlineOffset: 3,
		};

		const foot: React.CSSProperties = {
			padding: "16px 6px 4px",
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

		return { stage, shell, header, title, subtitle, body, label, input, btn, errorText, toggleRow, toggleBtn, foot, link };
	}, [theme, loading]);

	return (
		<main style={styles.stage}>
			<section style={styles.shell} aria-label={mode === "signin" ? "Sign in" : "Create account"}>
				<header style={styles.header}>
					<div style={styles.title}>
						{mode === "signin" ? "Sign in to Cortex" : "Create your account"}
					</div>
					<div style={styles.subtitle}>
						{mode === "signin"
							? "Enter your email and password to continue."
							: "Start taking smarter notes in minutes."}
					</div>
				</header>

				<form style={styles.body} onSubmit={handleSubmit}>
					<div>
						<label style={styles.label} htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							style={styles.input}
						/>
					</div>

					<div>
						<label style={styles.label} htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							autoComplete={mode === "signup" ? "new-password" : "current-password"}
							required
							minLength={6}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							style={styles.input}
						/>
					</div>

					{error ? <div style={styles.errorText}>{error}</div> : null}

					<button type="submit" style={styles.btn} disabled={loading}>
						{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
					</button>

					<div style={styles.toggleRow}>
						{mode === "signin" ? "Don't have an account?" : "Already have an account?"}
						<button
							type="button"
							style={styles.toggleBtn}
							onClick={() => { setError(""); setMode(mode === "signin" ? "signup" : "signin"); }}
						>
							{mode === "signin" ? "Sign up" : "Sign in"}
						</button>
					</div>
				</form>

				<div style={{ padding: "12px 6px 0" }}>
					<button
						type="button"
						style={{ width: "100%", border: `1px solid ${theme.border}`, borderRadius: 14, background: "transparent", color: theme.muted, fontWeight: 700, fontSize: 13, padding: "10px 14px", cursor: "pointer" }}
						onClick={() => { localStorage.setItem(USER_ID_KEY, "local-user"); router.push("/onboarding"); }}
					>
						Continue without account (local only)
					</button>
				</div>

				<footer style={styles.foot}>
					<Link href="/" prefetch style={styles.link}>
						← Home
					</Link>
				</footer>
			</section>
		</main>
	);
}
