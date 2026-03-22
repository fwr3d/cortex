"use client";

import React, { useMemo } from "react";
import { BoldIcon, ItalicIcon, BulletListIcon, OrderedListIcon } from "@/components/editor/Icons";

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36];

function stepFontSize(current: number, dir: 1 | -1): number {
	const idx = FONT_SIZES.indexOf(current);
	if (idx === -1) {
		return FONT_SIZES.reduce((a, b) => (Math.abs(b - current) < Math.abs(a - current) ? b : a));
	}
	return FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, idx + dir))];
}

type NoteToolbarProps = {
	editor: any;
	theme: any;

	fontSize: number;
	setFontSize: (n: number) => void;

	fontColor: string;
	applyFontColor: (color: string) => void;

	styles: any;
};

export default function NoteToolbar({
	editor,
	theme,
	fontSize,
	setFontSize,
	fontColor,
	applyFontColor,
	styles,
}: NoteToolbarProps) {
	const styleValue = useMemo(() => {
		if (editor?.isActive("heading", { level: 1 })) return "h1";
		if (editor?.isActive("heading", { level: 2 })) return "h2";
		if (editor?.isActive("heading", { level: 3 })) return "h3";
		return "p";
	}, [editor]);

	const isBold = editor?.isActive("bold") ?? false;
	const isItalic = editor?.isActive("italic") ?? false;
	const isBullets = editor?.isActive("bulletList") ?? false;
	const isNumbers = editor?.isActive("orderedList") ?? false;

	function applyFontSize(next: number) {
		setFontSize(next);
		editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
	}

	const toolbarStyle: React.CSSProperties = {
		...(styles?.toolbar ?? {}),
		flexWrap: "nowrap",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 10,
		overflow: "hidden",
	};

	const leftGroupStyle: React.CSSProperties = {
		...(styles?.toolGroup ?? {}),
		flexWrap: "nowrap",
		minWidth: 0,
		flex: "1 1 auto",
		overflow: "hidden",
	};

	const rightGroupStyle: React.CSSProperties = {
		...(styles?.toolGroup ?? {}),
		flexWrap: "nowrap",
		flex: "0 0 auto",
	};

	const selectStyle: React.CSSProperties = {
		background: "rgba(0,0,0,0.20)",
		color: theme.text,
		border: `1px solid ${theme.border}`,
		borderRadius: 10,
		padding: "7px 10px",
		fontSize: 12,
		fontWeight: 800,
		outline: "none",
		cursor: "pointer",
	};

	return (
		<div style={toolbarStyle} aria-label="Editor toolbar">
			<div style={leftGroupStyle}>
				<span style={styles.toolLabel}>Text</span>

				<select
					value={styleValue}
					aria-label="Text style"
					onChange={(e) => {
						const v = e.target.value;
						if (v === "p") editor?.chain().focus().setParagraph().run();
						if (v === "h1") editor?.chain().focus().setNode("heading", { level: 1 }).run();
						if (v === "h2") editor?.chain().focus().setNode("heading", { level: 2 }).run();
						if (v === "h3") editor?.chain().focus().setNode("heading", { level: 3 }).run();
					}}
					style={selectStyle}
				>
					<option value="p">Normal</option>
					<option value="h1">Heading 1</option>
					<option value="h2">Heading 2</option>
					<option value="h3">Heading 3</option>
				</select>

				<button
					type="button"
					style={isBold ? styles.toolBtnActive : styles.toolBtn}
					aria-label="Bold"
					onClick={() => editor?.chain().focus().toggleBold().run()}
				>
					<BoldIcon />
				</button>

				<button
					type="button"
					style={isItalic ? styles.toolBtnActive : styles.toolBtn}
					aria-label="Italic"
					onClick={() => editor?.chain().focus().toggleItalic().run()}
				>
					<ItalicIcon />
				</button>

				<button
					type="button"
					style={isBullets ? styles.toolBtnActive : styles.toolBtn}
					aria-label="Bulleted list"
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
				>
					<BulletListIcon />
				</button>

				<button
					type="button"
					style={isNumbers ? styles.toolBtnActive : styles.toolBtn}
					aria-label="Numbered list"
					onClick={() => editor?.chain().focus().toggleOrderedList().run()}
				>
					<OrderedListIcon />
				</button>

				<div style={styles.toolDivider} />
			</div>

			<div style={rightGroupStyle}>
				<select
					value={fontColor}
					aria-label="Font color"
					onChange={(e) => applyFontColor(e.target.value)}
					style={selectStyle}
				>
					<option value="#ecfeff">Default</option>
					<option value="#ef4444">Red</option>
					<option value="#60a5fa">Blue</option>
					<option value="#34d399">Green</option>
				</select>

				<div style={styles.fontSizePill} aria-label="Font size">
					<button
						type="button"
						style={styles.fontSizePillBtn}
						aria-label="Font size down"
						onClick={() => applyFontSize(stepFontSize(fontSize, -1))}
					>
						−
					</button>

					<select
						value={fontSize}
						onChange={(e) => applyFontSize(Number(e.target.value))}
						aria-label="Font size"
						style={{
							background: "rgba(0,0,0,0.20)",
							color: theme.text,
							border: "none",
							borderLeft: `1px solid ${theme.border}`,
							borderRight: `1px solid ${theme.border}`,
							padding: "7px 6px",
							fontSize: 12,
							fontWeight: 800,
							outline: "none",
							cursor: "pointer",
							minWidth: 48,
							textAlign: "center",
						}}
					>
						{FONT_SIZES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>

					<button
						type="button"
						style={styles.fontSizePillBtn}
						aria-label="Font size up"
						onClick={() => applyFontSize(stepFontSize(fontSize, 1))}
					>
						+
					</button>
				</div>
			</div>
		</div>
	);
}