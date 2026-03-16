"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import CortexWord from "@/components/CortexWord";

// Define available modes for GlitchIdle
const MODES = ["default", "glitch", "matrix", "scan"] as const;
type IdleMode = typeof MODES[number];

const USER_ID_KEY = "cortex:userId";

type Props = {
	wordmarkText: string;
	tagline: string;
	ctaLabel: string;
	ctaHref: string;
};

export default function HomeClient({ wordmarkText, tagline, ctaLabel }: Props) {
	const router = useRouter();

	// Single locked theme (Carbon)
	const accent = "#16a34a";
	const textColor = "#ecfeff";
	const mutedColor = "rgba(236,254,255,0.72)";

	// One knob to tune all background motion
	const intensity = 1.4; // <- edit this (0..3)

	// Idle mode state
	const [idleMode, setIdleMode] = useState<IdleMode>(MODES[0]);

	const ctaRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() !== "m") return;

			setIdleMode((prev: IdleMode) => {
				const i = MODES.indexOf(prev);
				const dir = e.shiftKey ? -1 : 1;
				const next = (i + dir + MODES.length) % MODES.length;
				return MODES[next];
			});
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		if (!ctaRef.current) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				ctaRef.current,
				{ opacity: 0, y: 8 },
				{ opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.2 },
			);
		});

		return () => ctx.revert();
	}, []);

	const styles = useMemo(() => {
		const stage: React.CSSProperties = {
			minHeight: "100vh",
			display: "grid",
			placeItems: "center",
			padding: "28px 18px",
			backgroundColor: "#070a0a",
			color: textColor,
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
			position: "relative",
			overflow: "hidden",
		};

		const centerWrap: React.CSSProperties = {
			position: "relative",
			zIndex: 1,
			width: "min(980px, 100%)",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			textAlign: "center",
			gap: 14,
		};

		const taglineStyle: React.CSSProperties = {
			marginTop: 2,
			fontSize: 14,
			letterSpacing: 0.4,
			color: mutedColor,
			minHeight: 18,
		};

		const btn: React.CSSProperties = {
			marginTop: 10,
			border: "1px solid rgba(255,255,255,0.12)",
			cursor: "pointer",
			padding: "12px 16px",
			borderRadius: 14,
			background: accent,
			color: "#07110d",
			fontWeight: 700,
			fontSize: 13,
		};

		const modePill: React.CSSProperties = {
			position: "fixed",
			left: 14,
			bottom: 14,
			zIndex: 3,
			border: "1px solid rgba(255,255,255,0.12)",
			borderRadius: 999,
			padding: "8px 10px",
			fontSize: 12,
			color: mutedColor,
			background: "rgba(0,0,0,0.25)",
			backdropFilter: "blur(8px)",
			userSelect: "none",
		};

		const modeStrong: React.CSSProperties = {
			color: textColor,
			fontWeight: 700,
		};

		const modeHint: React.CSSProperties = {
			opacity: 0.8,
			marginLeft: 8,
		};

		return { stage, centerWrap, taglineStyle, btn, modePill, modeStrong, modeHint };
	}, [accent, mutedColor, textColor]);

	return (
		<main style={styles.stage}>
			{/* Background (press M to cycle, Shift+M backwards) */}
			

			{/* Content */}
			<div style={styles.centerWrap}>
				<CortexWord
					text={wordmarkText}
					accent={accent}
					textColor={textColor}
					mutedColor={mutedColor}
					intensity={1.8}
				/>

				<div style={styles.taglineStyle} aria-label="Tagline">
					{tagline}
				</div>

				<button
					ref={ctaRef}
					type="button"
					style={styles.btn}
					onClick={() => {
						const userId = localStorage.getItem(USER_ID_KEY);
						router.push(userId ? "/dashboard" : "/login");
					}}
					onMouseEnter={() => {
						if (!ctaRef.current) return;
						gsap.to(ctaRef.current, {
							y: -2,
							scale: 1.01,
							duration: 0.18,
							ease: "power2.out",
						});
					}}
					onMouseLeave={() => {
						if (!ctaRef.current) return;
						gsap.to(ctaRef.current, {
							y: 0,
							scale: 1,
							duration: 0.18,
							ease: "power2.out",
						});
					}}
				>
					{ctaLabel}
				</button>
			</div>

			<div style={styles.modePill}>
				Mode: <span style={styles.modeStrong}>{idleMode}</span>
				<span style={styles.modeHint}>(M)</span>
			</div>
		</main>
	);
}