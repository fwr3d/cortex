"use client";

import React, { useMemo } from "react";

type Props = {
	size: number; // e.g. 144
	fill: string;

	/** 1–3 chars recommended at this size: EN, FR, DR, BIO, etc */
	glyph: string;

	hovered?: boolean;
	selected?: boolean;
	accent?: string;
};

export default function FolderIcon({
	size,
	fill,
	glyph,
	hovered = false,
	selected = false,
	accent = "#16a34a",
}: Props) {
	const s = size;

	const styles = useMemo(() => {
		const svg: React.CSSProperties = { width: s, height: s, display: "block" };
		return { svg };
	}, [s]);

	// --- color helpers ---
	const hexToRgb = (hex: string) => {
		const h = hex.replace("#", "");
		const r = parseInt(h.slice(0, 2), 16);
		const g = parseInt(h.slice(2, 4), 16);
		const b = parseInt(h.slice(4, 6), 16);
		return { r, g, b };
	};

	const mix = (a: string, b: string, t: number) => {
		const A = hexToRgb(a);
		const B = hexToRgb(b);
		const r = Math.round(A.r + (B.r - A.r) * t);
		const g = Math.round(A.g + (B.g - A.g) * t);
		const b2 = Math.round(A.b + (B.b - A.b) * t);
		return `rgb(${r},${g},${b2})`;
	};

	const base = fill;

// This is the key: top/back piece follows the same darken direction on hover
const top = hovered ? mix(base, "#000000", 0.06) : mix(base, "#ffffff", 0.06);

const front = mix(base, "#000000", 0.08);
const lip = mix(base, "#ffffff", 0.14);

	const shadow = "drop-shadow(0 14px 26px rgba(0,0,0,0.55))";
	const ringW = Math.max(2, Math.round(s * 0.035));

	// Center glyph styling
	const glyphSize = (() => {
		// tuned for 96x96 viewBox; scales automatically with SVG size
		if (glyph.length >= 4) return 16;
		if (glyph.length === 3) return 18;
		return 22; // 1–2 chars
	})();

	return (
		<svg viewBox="0 0 96 96" role="img" aria-label="Folder" style={styles.svg}>
			{selected ? (
				<rect
					x="6"
					y="12"
					width="84"
					height="72"
					rx="18"
					fill="none"
					stroke={accent}
					strokeWidth={ringW}
					opacity="0.95"
				/>
			) : null}

			<g style={{ filter: shadow } as React.CSSProperties}>
				{/* Back/top piece with tab */}
				<path
					d="
						M18 24
						C18 19.6 21.6 16 26 16
						H40
						C42.2 16 44.2 16.9 45.7 18.4
						L51 23.7
						C52.3 25 53.6 25.6 55.4 25.6
						H70
						C76.6 25.6 82 31 82 37.6
						V38
						H18
						V24
						Z
					"
					fill={top}
				/>

				{/* Main body */}
				<path
					d="
						M18 38
						H82
						V72
						C82 78.6 76.6 84 70 84
						H30
						C23.4 84 18 78.6 18 72
						V38
						Z
					"
					fill={base}
				/>

				{/* Front face */}
				<path
					d="
						M18 44
						H82
						V72
						C82 78.6 76.6 84 70 84
						H30
						C23.4 84 18 78.6 18 72
						V44
						Z
					"
					fill={front}
					opacity="0.92"
				/>

				{/* Lip highlight */}
				<path
					d="M24 48 H76"
					stroke={lip}
					strokeWidth="2"
					strokeLinecap="round"
					opacity="0.25"
				/>

				{/* Crisp inner border */}
				<path
					d="
						M20 39
						H80
						V72
						C80 77.5 75.5 82 70 82
						H30
						C24.5 82 20 77.5 20 72
						V39
						Z
					"
					fill="none"
					stroke="rgba(255,255,255,0.10)"
					strokeWidth="1.5"
					opacity="0.65"
				/>
			</g>

			{/* Centered glyph */}
			<text
				x="50"
				y="60"
				textAnchor="middle"
				dominantBaseline="middle"
				fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
				fontWeight={900}
				fontSize={glyphSize}
				fill="rgba(255,255,255,0.96)"
				style={{ paintOrder: "stroke" } as React.CSSProperties}
				stroke="rgba(0,0,0,0.18)"
				strokeWidth="2"
			>
				{glyph}
			</text>
		</svg>
	);
}