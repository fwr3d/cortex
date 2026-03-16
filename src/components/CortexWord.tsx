"use client";

import React, { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type Props = {
	text?: string;
	accent?: string;
	textColor?: string;
	mutedColor?: string;

	/**
	 * 0..3 recommended
	 * - 0.8 = calmer
	 * - 1.0 = current-ish
	 * - 1.6 = noticeably more intense
	 * - 2.2 = very glitchy
	 */
	intensity?: number;
};

export default function CortexWord({
	text = "CORTEX",
	accent = "#22c55e",
	textColor = "rgba(236,254,255,0.92)",
	intensity = 1,
}: Props) {
	const I = Math.max(0, Math.min(3, intensity));

	const rootRef = useRef<HTMLDivElement | null>(null);
	const lettersRef = useRef<HTMLSpanElement[]>([]);
	const tlRef = useRef<gsap.core.Timeline | null>(null);

	const chars = useMemo(() => text.split(""), [text]);

	// Collect refs (reset only when text changes)
	useLayoutEffect(() => {
		lettersRef.current = [];
	}, [text]);

	const addLetter = (el: HTMLSpanElement | null) => {
		if (el && !lettersRef.current.includes(el)) lettersRef.current.push(el);
	};

	useLayoutEffect(() => {
		if (!rootRef.current) return;

		const letters = lettersRef.current;
		if (!letters.length) return;

		// Kill previous timeline (important in dev / re-renders)
		if (tlRef.current) {
			tlRef.current.kill();
			tlRef.current = null;
		}
		gsap.killTweensOf([rootRef.current, letters]);

		// Baseline
		gsap.set(rootRef.current, {
			x: 0,
			y: 0,
			skewX: 0,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			letterSpacing: "0.18em",
			textShadow: "0 0 0 rgba(0,0,0,0)",
		});

		gsap.set(letters, {
			opacity: 1,
			x: 0,
			y: 0,
			skewX: 0,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			filter: "blur(0px)",
			color: textColor,
		});

		const pick = (idx: number[]) => idx.map((i) => letters[i]).filter(Boolean);

		// Scale knobs
		const hitX = 3 + I * 3.2;
		const hitY = 1 + I * 1.4;
		const hitSkew = 10 + I * 7;
		const shadowPx = 8 + I * 7;
		const flickerAlpha = Math.max(0.08, 0.25 - I * 0.04);
		const settleDur = Math.max(0.11, 0.16 - I * 0.02);
		const repeatDelay = Math.max(0.15, 0.35 - I * 0.08);
const idleDur = Math.max(0.30, 0.70 - I * 0.08);

		// Randomize which letters flicker a bit as intensity rises
		const baseFlicker = [0, 2, 5];
		const extraFlicker = I >= 1.4 ? [1, 4] : [];
		const flickerSet = [...baseFlicker, ...extraFlicker];

		const tl = gsap.timeline({ repeat: -1, repeatDelay });

		// Idle (mostly stable)
		tl.to({}, { duration: idleDur });

		// Glitch hit
		tl.to(rootRef.current, {
			duration: 0.08,
			x: -hitX,
			y: hitY,
			skewX: hitSkew,
			ease: "steps(2)",
			textShadow: `${shadowPx}px 0 0 ${accent}, -${shadowPx}px 0 0 rgba(255,255,255,0.45)`,
		});

		// Letter flicker
		tl.to(pick(flickerSet), { duration: 0.04, opacity: flickerAlpha, ease: "steps(1)" }, "<");
		tl.to(pick(flickerSet), { duration: 0.04, opacity: 1, ease: "steps(1)" }, ">");

		// Tiny per-letter jitter at higher intensity
		if (I >= 1.8) {
			tl.to(
				pick([0, 3, 5]),
				{
					duration: 0.05,
					x: () => gsap.utils.random(-2 - I, 2 + I, 1),
					y: () => gsap.utils.random(-1 - I * 0.5, 1 + I * 0.5, 1),
					ease: "steps(1)",
				},
				"<",
			);
			tl.to(pick([0, 3, 5]), { duration: 0.06, x: 0, y: 0, ease: "power2.out" }, ">");
		}

		// Settle
		tl.to(
			rootRef.current,
			{
				duration: settleDur,
				x: 0,
				y: 0,
				skewX: 0,
				textShadow: "0 0 0 rgba(0,0,0,0)",
				ease: "power3.out",
			},
			">",
		);

		tlRef.current = tl;

		return () => {
			tl.kill();
			tlRef.current = null;
		};
	}, [accent, textColor, text, I]);

	const styleRoot: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "baseline",
		gap: 0,
		fontSize: 92,
		letterSpacing: "0.18em",
		fontWeight: 820,
		textTransform: "uppercase",
		lineHeight: 1,
		position: "relative",
	};

	const styleLetter: React.CSSProperties = {
		display: "inline-block",
		color: textColor,
	};

	return (
		<div ref={rootRef} aria-label={text} style={styleRoot}>
			{chars.map((c, i) => (
				<span key={`${c}-${i}`} ref={addLetter} style={styleLetter}>
					{c}
				</span>
			))}
		</div>
	);
}