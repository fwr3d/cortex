"use client";

import React, { useMemo } from "react";
import {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	StrikeIcon,
	CodeIcon,
	BlockquoteIcon,
	BulletListIcon,
	OrderedListIcon,
	UndoIcon,
	RedoIcon,
} from "@/components/editor/Icons";

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
	const isUnderline = editor?.isActive("underline") ?? false;
	const isStrike = editor?.isActive("strike") ?? false;
	const isCode = editor?.isActive("code") ?? false;
	const isBlockquote = editor?.isActive("blockquote") ?? false;
	const isBullets = editor?.isActive("bulletList") ?? false;
	const isNumbers = editor?.isActive("orderedList") ?? false;

	function applyFontSize(next: number) {
		setFontSize(next);
		editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
	}

	const toolbarStyle: React.CSSProperties = {
		...(styles?.toolbar ?? {}),
		flexWrap: "nowrap",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: 6,
		overflowX: "auto",
		position: "sticky",
		top: 0,
		zIndex: 10,
		scrollbarWidth: "none",
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
		flex: "0 0 auto",
	};

	const btn = (active: boolean): React.CSSProperties =>
		active ? styles.toolBtnActive : styles.toolBtn;

	const divider = styles.toolDivider as React.CSSProperties;

	return (
		<div style={toolbarStyle} aria-label="Editor toolbar">
			{/* Undo / Redo */}
			<button
				type="button"
				style={styles.toolBtn}
				aria-label="Undo"
				onClick={() => editor?.chain().focus().undo().run()}
			>
				<UndoIcon />
			</button>
			<button
				type="button"
				style={styles.toolBtn}
				aria-label="Redo"
				onClick={() => editor?.chain().focus().redo().run()}
			>
				<RedoIcon />
			</button>

			<div style={divider} />

			{/* Text style select */}
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

			<div style={divider} />

			{/* Text formatting */}
			<button
				type="button"
				style={btn(isBold)}
				aria-label="Bold"
				onClick={() => editor?.chain().focus().toggleBold().run()}
			>
				<BoldIcon />
			</button>
			<button
				type="button"
				style={btn(isItalic)}
				aria-label="Italic"
				onClick={() => editor?.chain().focus().toggleItalic().run()}
			>
				<ItalicIcon />
			</button>
			<button
				type="button"
				style={btn(isUnderline)}
				aria-label="Underline"
				onClick={() => editor?.chain().focus().toggleUnderline().run()}
			>
				<UnderlineIcon />
			</button>
			<button
				type="button"
				style={btn(isStrike)}
				aria-label="Strikethrough"
				onClick={() => editor?.chain().focus().toggleStrike().run()}
			>
				<StrikeIcon />
			</button>

			<div style={divider} />

			{/* Code and blockquote */}
			<button
				type="button"
				style={btn(isCode)}
				aria-label="Inline code"
				onClick={() => editor?.chain().focus().toggleCode().run()}
			>
				<CodeIcon />
			</button>
			<button
				type="button"
				style={btn(isBlockquote)}
				aria-label="Blockquote"
				onClick={() => editor?.chain().focus().toggleBlockquote().run()}
			>
				<BlockquoteIcon />
			</button>

			<div style={divider} />

			{/* Lists */}
			<button
				type="button"
				style={btn(isBullets)}
				aria-label="Bulleted list"
				onClick={() => editor?.chain().focus().toggleBulletList().run()}
			>
				<BulletListIcon />
			</button>
			<button
				type="button"
				style={btn(isNumbers)}
				aria-label="Numbered list"
				onClick={() => editor?.chain().focus().toggleOrderedList().run()}
			>
				<OrderedListIcon />
			</button>

			<div style={divider} />

			{/* Color */}
			<select
				value={fontColor}
				aria-label="Font color"
				onChange={(e) => applyFontColor(e.target.value)}
				style={selectStyle}
			>
				<option value="#ecfeff">Default</option>
				<option value="#ef4444">Red</option>
				<option value="#f97316">Orange</option>
				<option value="#eab308">Yellow</option>
				<option value="#60a5fa">Blue</option>
				<option value="#34d399">Green</option>
				<option value="#a78bfa">Purple</option>
			</select>

			{/* Font size */}
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
					aria-label="Font size select"
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
	);
}
