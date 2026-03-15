"use client";

import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

export type CortexMode =
	| "glitchSoft" // subtle RGB split + tiny letter flicker
	| "glitchHard" // stronger split + jitter
	| "glitchSlice" // scanline slice + flicker
	| "glitchNeon"; // neon pulse + split

type Props = {
	text?: string;
	mode: CortexMode;
	accent?: string;
	textColor?: string;
	mutedColor?: string;
};

export default function CortexWord({
	text = "CORTEX",
	mode,
	accent = "#22c55e",
	textColor = "rgba(236,254,255,0.92)",
}: Props) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const lettersRef = useRef<HTMLSpanElement[]>([]);
	lettersRef.current = [];
	const addLetter = (el: HTMLSpanElement | null) => {
		if (el && !lettersRef.current.includes(el)) lettersRef.current.push(el);
	};

	const scanRef = useRef<HTMLDivElement | null>(null);

	const chars = useMemo(() => text.split(""), [text]);

	useEffect(() => {
		if (!rootRef.current) return;
		const letters = lettersRef.current;
		if (!letters.length) return;

		const ctx = gsap.context(() => {
			gsap.killTweensOf([rootRef.current, letters, scanRef.current].filter(Boolean));

			// Baseline reset: crisp text
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
			if (scanRef.current) gsap.set(scanRef.current, { x: "-120%", opacity: 0 });

			const pick = (idx: number[]) => idx.map((i) => letters[i]).filter(Boolean);

			const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.7 });

			switch (mode) {
				case "glitchSoft": {
					// mostly stable with tiny periodic digital noise
					loop.to({}, { duration: 1.6 });
					loop.to(
						rootRef.current,
						{
							duration: 0.09,
							x: -1,
							skewX: 3,
							ease: "steps(2)",
							textShadow: `3px 0 0 ${accent}, -3px 0 0 rgba(255,255,255,0.25)`,
						},
						">",
					);
					loop.to(pick([1, 4]), { duration: 0.05, opacity: 0.75, ease: "steps(1)" }, "<")
						.to(pick([1, 4]), { duration: 0.05, opacity: 1, ease: "steps(1)" }, ">")
						.to(rootRef.current, { duration: 0.14, x: 0, skewX: 0, textShadow: "0 0 0 rgba(0,0,0,0)", ease: "power3.out" }, ">");
					break;
				}

				case "glitchHard": {
					loop.to({}, { duration: 1.1 });
					loop.to(rootRef.current, {
						duration: 0.08,
						x: -3,
						y: 1,
						skewX: 10,
						ease: "steps(2)",
						textShadow: `8px 0 0 ${accent}, -8px 0 0 rgba(255,255,255,0.45)`,
					});
					loop.to(pick([0, 2, 5]), { duration: 0.04, opacity: 0.25, ease: "steps(1)" }, "<")
						.to(pick([0, 2, 5]), { duration: 0.04, opacity: 1, ease: "steps(1)" }, ">")
						.to(rootRef.current, { duration: 0.16, x: 0, y: 0, skewX: 0, textShadow: "0 0 0 rgba(0,0,0,0)", ease: "power3.out" }, ">");
					break;
				}

				case "glitchSlice": {
					loop.to({}, { duration: 1.25 });
					loop.to(scanRef.current, { opacity: 0.18, x: "-120%", duration: 0.001 }, ">")
						.to(scanRef.current, { x: "120%", duration: 0.2, ease: "none" }, "<")
						.to(scanRef.current, { opacity: 0, duration: 0.08, ease: "power1.out" }, ">");
					loop.to(rootRef.current, {
						duration: 0.1,
						x: 2,
						skewX: -7,
						ease: "steps(2)",
						textShadow: `6px 0 0 ${accent}, -6px 0 0 rgba(255,255,255,0.35)`,
					}, "<");
					loop.to(pick([3]), { duration: 0.06, opacity: 0.35, ease: "steps(1)" }, "<")
						.to(pick([3]), { duration: 0.06, opacity: 1, ease: "steps(1)" }, ">")
						.to(rootRef.current, { duration: 0.18, x: 0, skewX: 0, textShadow: "0 0 0 rgba(0,0,0,0)", ease: "power3.out" }, ">");
					break;
				}

				case "glitchNeon": {
					loop.to({}, { duration: 1.35 });
					loop.to(rootRef.current, {
						duration: 0.12,
						ease: "steps(2)",
						textShadow: `0 0 18px rgba(34,197,94,0.45), 6px 0 0 ${accent}, -6px 0 0 rgba(255,255,255,0.40)`,
					});
					loop.to(pick([1, 2, 4]), { duration: 0.06, opacity: 0.55, ease: "steps(1)" }, "<")
						.to(pick([1, 2, 4]), { duration: 0.06, opacity: 1, ease: "steps(1)" }, ">")
						.to(rootRef.current, { duration: 0.22, textShadow: "0 0 0 rgba(0,0,0,0)", ease: "power3.out" }, ">");
					break;
				}
			}
		}, rootRef);

		return () => ctx.revert();
	}, [accent, mode, textColor]);

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

	const styleScan: React.CSSProperties = {
		position: "absolute",
		left: "-20%",
		top: -12,
		bottom: -12,
		width: "28%",
		background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
		opacity: 0,
		filter: "blur(1px)",
		pointerEvents: "none",
	};

	return (
		<div ref={rootRef} aria-label={text} style={styleRoot}>
			<div ref={scanRef} aria-hidden style={styleScan} />
			{chars.map((c, i) => (
				<span key={`${c}-${i}`} ref={addLetter} style={styleLetter}>
					{c}
				</span>
			))}
		</div>
	);
}