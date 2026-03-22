"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DashboardLayout from "@/components/DashboardLayout";
import FolderIcon from "@/components/FolderIcon";
import type { OnboardingPayload } from "@/types";
import { safeJsonParse, stableHash } from "@/lib/utils";
import { slugifyClassName } from "@/lib/notes/storage";

const USER_ID_KEY = "cortex:userId";
const SEEN_DASHBOARD_KEY = "cortex:seenDashboard:v1";

type Spec = { fill: string; glyph: string };

function getSpec(className: string): Spec {
	const n = className.toLowerCase();

	if (n.includes("english") || n.includes("ela") || n.includes("literature")) return { fill: "#60a5fa", glyph: "EN" };
	if (n.includes("french")) return { fill: "#f59e0b", glyph: "FR" };
	if (n.includes("drawing") || n.includes("art")) return { fill: "#6366f1", glyph: "DR" };
	if (n.includes("calc") || n.includes("precalc")) return { fill: "#a78bfa", glyph: "CALC" };
	if (n.includes("algebra")) return { fill: "#14b8a6", glyph: "ALG" };
	if (n.includes("geometry")) return { fill: "#60a5fa", glyph: "GEO" };
	if (n.includes("bio")) return { fill: "#34d399", glyph: "BIO" };
	if (n.includes("earth")) return { fill: "#6366f1", glyph: "ES" };
	if (n.includes("history")) return { fill: "#fb7185", glyph: "HIS" };
	if (n.includes("chem")) return { fill: "#f59e0b", glyph: "CHEM" };
	if (n.includes("physics")) return { fill: "#6366f1", glyph: "PHY" };
	if (n.includes("psych")) return { fill: "#14b8a6", glyph: "PSY" };
	if (n.includes("computer") || n.includes("cs ") || n.startsWith("cs") || n.includes("program")) return { fill: "#9ca3af", glyph: "CS" };

	const palette = ["#a78bfa", "#60a5fa", "#f59e0b", "#34d399", "#14b8a6", "#6366f1", "#fb7185", "#9ca3af"];
	const fill = palette[stableHash(className) % palette.length];
	const glyph = className.trim().slice(0, 2).toUpperCase() || "•";
	return { fill, glyph };
}

export default function DashboardPage() {
	const router = useRouter();
	const [payload, setPayload] = useState<OnboardingPayload | null>(null);
	const [hovered, setHovered] = useState<string | null>(null);
	const [pressed, setPressed] = useState<string | null>(null);

	useEffect(() => {
		// Dashboard is a one-time "orientation" page. After the first visit,
		// default landing should be Study.
		try {
			const seen = localStorage.getItem(SEEN_DASHBOARD_KEY);
			if (seen === "1") {
				router.replace("/study");
				return;
			}
			localStorage.setItem(SEEN_DASHBOARD_KEY, "1");
		} catch {
			// ignore
		}

		try {
			const userId = localStorage.getItem(USER_ID_KEY);
			if (!userId) {
				setTimeout(() => setPayload(null), 0);
				return;
			}

			const raw = localStorage.getItem(`cortex:users:${userId}:onboarding:v1`);
			if (!raw) {
				setTimeout(() => setPayload(null), 0);
				return;
			}

			const parsed = safeJsonParse<OnboardingPayload>(raw);
			setPayload(parsed);
		} catch {
			setPayload(null);
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
		}),
		[],
	);

	const styles = useMemo(() => {
		const container: React.CSSProperties = {
			maxWidth: 980,
			margin: "0 auto",
			display: "flex",
			flexDirection: "column",
			gap: 12,
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

		const gridWrap: React.CSSProperties = {
			marginTop: 18,
			maxWidth: 980,
		};

		const grid: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
			columnGap: 46,
			rowGap: 40,
			alignItems: "start",
		};

		const item: React.CSSProperties = {
			display: "grid",
			placeItems: "center",
			textDecoration: "none",
			color: theme.text,
			padding: "18px 10px",
			borderRadius: 18,
			userSelect: "none",
			outline: "none",
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

		const onboardingLink: React.CSSProperties = {
			color: theme.text,
			textDecoration: "underline",
		};

		const footerLabel: React.CSSProperties = { marginBottom: 6 };
		const footerValue: React.CSSProperties = { fontWeight: 700, color: theme.text };

		return {
			container,
			header,
			h1,
			sub,
			gridWrap,
			grid,
			item,
			empty,
			onboardingLink,
			footerLabel,
			footerValue,
		};
	}, [theme]);

	const classes = payload?.classes ?? [];

	const subtitle = (() => {
		if (!payload) return "No saved onboarding data yet.";
		if (payload.educationLevel === "highSchool") {
			return `High school · Grade ${payload.grade} · ${classes.length} classes`;
		}
		const parts: string[] = ["College"];
		if (payload.collegeName) parts.push(payload.collegeName);
		if (payload.major) parts.push(payload.major);
		parts.push(`${classes.length} classes`);
		return parts.join(" · ");
	})();

	return (
		<DashboardLayout
			theme={theme}
			sidebarTitle="Cortex"
			sidebarItems={[
				{ label: "My Drive", href: "/dashboard", active: true },
				{ label: "Study session", href: "/study/session" },
				{ label: "Edit classes", href: "/onboarding?step=classes" },
				{ type: "divider" },
				{ label: "← Home", href: "/" },
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
						<div style={styles.h1}>Dashboard</div>
						<div style={styles.sub}>{subtitle}</div>
					</div>
				</header>

				{classes.length === 0 ? (
					<div style={styles.empty}>
						No classes yet. Go to{" "}
						<Link href="/onboarding" style={styles.onboardingLink}>
							onboarding
						</Link>{" "}
						to add them.
					</div>
				) : null}

				<div style={styles.gridWrap}>
					<section style={styles.grid} aria-label="Classes">
						{classes.map((name) => {
							const href = `/class/${slugifyClassName(name)}`;
							const spec = getSpec(name);

							const isHover = hovered === name;
							const isPressed = pressed === name;

							const iconWrap: React.CSSProperties = {
								position: "relative",
								transform: isPressed
									? "translateY(2px) scale(0.985)"
									: isHover
										? "translateY(-3px) scale(1.02)"
										: "translateY(0px) scale(1)",
								transition: "transform 140ms ease, filter 140ms ease, opacity 140ms ease",
								filter: isHover
									? "drop-shadow(0 22px 50px rgba(0,0,0,0.65)) drop-shadow(0 0 34px rgba(22,163,74,0.12))"
									: "none",
								opacity: isPressed ? 0.95 : 1,
							};

							const tooltip: React.CSSProperties = {
								position: "absolute",
								left: "50%",
								top: -10,
								transform: isHover
									? "translate(-50%, -100%) scale(1)"
									: "translate(-50%, -100%) scale(0.98)",
								opacity: isHover ? 1 : 0,
								transition: "opacity 120ms ease, transform 120ms ease",
								pointerEvents: "none",
								background: "rgba(0,0,0,0.55)",
								border: `1px solid ${theme.border}`,
								backdropFilter: "blur(10px)",
								color: theme.text,
								padding: "10px 12px",
								borderRadius: 12,
								fontSize: 13,
								fontWeight: 850,
								whiteSpace: "nowrap",
								zIndex: 2,
							};

							return (
								<Link
									key={name}
									href={href}
									style={styles.item}
									aria-label={`Open ${name}`}
									onMouseEnter={() => setHovered(name)}
									onMouseLeave={() => {
										setHovered((cur) => (cur === name ? null : cur));
										setPressed((cur) => (cur === name ? null : cur));
									}}
									onMouseDown={() => setPressed(name)}
									onMouseUp={() => setPressed((cur) => (cur === name ? null : cur))}
								>
									<div style={iconWrap}>
										<div style={tooltip}>{name}</div>

										<FolderIcon
											size={144}
											fill={spec.fill}
											glyph={spec.glyph}
											hovered={isHover}
											selected={false}
											accent={theme.accent}
										/>
									</div>
								</Link>
							);
						})}
					</section>
				</div>
			</div>
		</DashboardLayout>
	);
}