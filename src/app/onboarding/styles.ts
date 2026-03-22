import type React from "react";

export type Theme = {
	bg: string;
	panel: string;
	border: string;
	text: string;
	muted: string;
	accent: string;
	shadow: string;
};

export function createOnboardingStyles(theme: Theme) {
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
		width: "min(680px, 100%)",
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

	const label: React.CSSProperties = {
		fontSize: 12,
		color: theme.muted,
		marginBottom: 6,
	};

	const input: React.CSSProperties = {
		width: "100%",
		borderRadius: 14,
		border: `1px solid ${theme.border}`,
		background: "rgba(0,0,0,0.20)",
		color: theme.text,
		padding: "12px 12px",
		outline: "none",
		fontSize: 14,
	};
	const option: React.CSSProperties = {
		background: "rgba(0, 0, 0, 0.5)",
	};
	const select: React.CSSProperties = {
		...input,
		background: "rgba(0,0,0,0.22)",
		appearance: "none",
	};

	const row: React.CSSProperties = {
		display: "flex",
		gap: 10,
		alignItems: "center",
	};

	const suggestionList: React.CSSProperties = {
		border: `1px solid ${theme.border}`,
		borderRadius: 14,
		background: "rgba(0,0,0,0.22)",
		overflow: "hidden",
		maxHeight: 180,
		overflowY: "auto",
	};

	const suggestionItem: React.CSSProperties = {
		width: "100%",
		textAlign: "left",
		border: "none",
		borderBottom: `1px solid ${theme.border}`,
		background: "transparent",
		color: theme.text,
		padding: "8px 10px",
		cursor: "pointer",
		fontSize: 12,
		lineHeight: 1.3,
	};

	const hint: React.CSSProperties = {
		fontSize: 12,
		color: theme.muted,
		lineHeight: 1.35,
	};

	const hintTight: React.CSSProperties = {
		fontSize: 11,
		color: theme.muted,
		lineHeight: 1.25,
	};

	const inlineCode: React.CSSProperties = {
		fontFamily:
			"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
		fontSize: 11,
		padding: "1px 6px",
		borderRadius: 999,
		border: `1px solid ${theme.border}`,
		background: "rgba(0,0,0,0.25)",
		color: theme.text,
	};

	const btn: React.CSSProperties = {
		width: "100%",
		marginTop: 4,
		border: `1px solid ${theme.border}`,
		cursor: "pointer",
		padding: "12px 14px",
		borderRadius: 14,
		background: theme.accent,
		color: "#07110d",
		fontWeight: 800,
		fontSize: 13,
	};

	const btnSecondary: React.CSSProperties = {
		border: `1px solid ${theme.border}`,
		cursor: "pointer",
		padding: "10px 12px",
		borderRadius: 14,
		background: "transparent",
		color: theme.text,
		fontWeight: 700,
		fontSize: 13,
		whiteSpace: "nowrap",
	};

	const chipRow: React.CSSProperties = {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
	};

	const chip: React.CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: 8,
		border: `1px solid ${theme.border}`,
		borderRadius: 999,
		padding: "8px 10px",
		background: "rgba(0,0,0,0.18)",
		color: theme.text,
		fontSize: 13,
	};

	const chipX: React.CSSProperties = {
		border: `1px solid ${theme.border}`,
		borderRadius: 999,
		width: 22,
		height: 22,
		display: "grid",
		placeItems: "center",
		background: "transparent",
		color: theme.text,
		cursor: "pointer",
		lineHeight: 1,
	};

	const suggestionWrap: React.CSSProperties = {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
	};

	const suggestion: React.CSSProperties = {
		border: `1px solid ${theme.border}`,
		borderRadius: 999,
		padding: "8px 10px",
		background: "transparent",
		color: theme.muted,
		cursor: "pointer",
		fontSize: 13,
	};

	const categoryGroup: React.CSSProperties = {
		display: "flex",
		flexDirection: "column",
		gap: 8,
	};

	const categoryHeader: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	};

	const categoryTitle: React.CSSProperties = {
		fontSize: 12,
		color: theme.muted,
		letterSpacing: 0.2,
		fontWeight: 700,
	};

	const caret: React.CSSProperties = {
		width: 24,
		height: 24,
		borderRadius: 999,
		border: `1px solid ${theme.border}`,
		background: "transparent",
		color: theme.text,
		cursor: "pointer",
		lineHeight: 1,
		display: "grid",
		placeItems: "center",
	};

	const segmented: React.CSSProperties = {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 8,
		border: `1px solid ${theme.border}`,
		borderRadius: 14,
		padding: 4,
		background: "rgba(0,0,0,0.18)",
	};

	const segment: React.CSSProperties = {
		border: `1px solid ${theme.border}`,
		borderRadius: 12,
		padding: "10px 12px",
		background: "transparent",
		color: theme.text,
		cursor: "pointer",
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

	return {
		stage,
		shell,
		header,
		title,
		subtitle,
		body,
		label,
		input,
		select,
		row,
		suggestionList,
		suggestionItem,
		hint,
		hintTight,
		inlineCode,
		btn,
		btnSecondary,
		chipRow,
		chip,
		option,
		chipX,
		suggestionWrap,
		suggestion,
		categoryGroup,
		categoryHeader,
		categoryTitle,
		caret,
		segmented,
		segment,
		foot,
		link,
	};
}