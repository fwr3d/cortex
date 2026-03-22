export const theme = {
	bg: "#070a0a",
	panel: "rgba(255,255,255,0.06)",
	border: "rgba(255,255,255,0.12)",
	text: "#ecfeff",
	muted: "rgba(236,254,255,0.72)",
	accent: "#16a34a",
	danger: "rgba(248,113,113,0.95)",
} as const;

export type AppTheme = typeof theme;
