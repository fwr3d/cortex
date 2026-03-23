"use client";

import React, { useRef, useMemo } from "react";
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
	AlignLeftIcon,
	AlignMiddleIcon,
	AlignRightIcon,
	AlignJustifyIcon,
	HighlightIcon,
	LinkIcon,
	UnlinkIcon,
	SuperscriptIcon,
	SubscriptIcon,
	TaskListIcon,
	HorizontalRuleIcon,
	FontColorIcon,
} from "@/components/editor/Icons";

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

const FONT_FAMILIES = [
	{ label: "Sans (default)", value: "ui-sans-serif, system-ui, -apple-system, sans-serif" },
	{ label: "Serif", value: "Georgia, 'Times New Roman', Times, serif" },
	{ label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
	{ label: "Inter", value: "'Inter', ui-sans-serif, sans-serif" },
	{ label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
];

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
	highlightColor: string;
	applyHighlight: (color: string) => void;
	fontFamily: string;
	applyFontFamily: (family: string) => void;
	styles: any;
};

export default function NoteToolbar({
	editor,
	theme,
	fontSize,
	setFontSize,
	fontColor,
	applyFontColor,
	highlightColor,
	applyHighlight,
	fontFamily,
	applyFontFamily,
	styles,
}: NoteToolbarProps) {
	const fontColorInputRef = useRef<HTMLInputElement>(null);
	const highlightInputRef = useRef<HTMLInputElement>(null);

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
	const isTaskList = editor?.isActive("taskList") ?? false;
	const isSuperscript = editor?.isActive("superscript") ?? false;
	const isSubscript = editor?.isActive("subscript") ?? false;
	const isLink = editor?.isActive("link") ?? false;
	const isAlignLeft = editor?.isActive({ textAlign: "left" }) ?? false;
	const isAlignCenter = editor?.isActive({ textAlign: "center" }) ?? false;
	const isAlignRight = editor?.isActive({ textAlign: "right" }) ?? false;
	const isAlignJustify = editor?.isActive({ textAlign: "justify" }) ?? false;

	function applyFontSize(next: number) {
		setFontSize(next);
		editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
	}

	function handleLink() {
		if (isLink) {
			editor?.chain().focus().unsetLink().run();
			return;
		}
		const url = window.prompt("Enter URL:", "https://");
		if (url && url !== "https://") {
			editor?.chain().focus().setLink({ href: url, target: "_blank" }).run();
		}
	}

	const toolbarStyle: React.CSSProperties = {
		...(styles?.toolbar ?? {}),
		flexWrap: "nowrap",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: 4,
		overflowX: "auto",
		position: "sticky",
		top: 0,
		zIndex: 10,
		scrollbarWidth: "none",
	};

	const selectStyle: React.CSSProperties = {
		background: "rgba(255,255,255,0.03)",
		color: "rgba(236,254,255,0.75)",
		border: "1px solid rgba(255,255,255,0.08)",
		borderRadius: 8,
		padding: "5px 8px",
		fontSize: 12,
		fontWeight: 500,
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
			<button type="button" style={styles.toolBtn} aria-label="Undo" onClick={() => editor?.chain().focus().undo().run()}>
				<UndoIcon />
			</button>
			<button type="button" style={styles.toolBtn} aria-label="Redo" onClick={() => editor?.chain().focus().redo().run()}>
				<RedoIcon />
			</button>

			<div style={divider} />

			{/* Text style + Font family */}
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

			<select
				value={fontFamily}
				aria-label="Font family"
				onChange={(e) => applyFontFamily(e.target.value)}
				style={{ ...selectStyle, maxWidth: 110 }}
			>
				{FONT_FAMILIES.map((f) => (
					<option key={f.value} value={f.value}>
						{f.label}
					</option>
				))}
			</select>

			<div style={divider} />

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
						background: "rgba(255,255,255,0.03)",
						color: "rgba(236,254,255,0.75)",
						border: "none",
						borderLeft: "1px solid rgba(255,255,255,0.08)",
						borderRight: "1px solid rgba(255,255,255,0.08)",
						padding: "5px 6px",
						fontSize: 12,
						fontWeight: 500,
						outline: "none",
						cursor: "pointer",
						minWidth: 44,
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

			<div style={divider} />

			{/* Text formatting */}
			<button type="button" style={btn(isBold)} aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}>
				<BoldIcon />
			</button>
			<button type="button" style={btn(isItalic)} aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}>
				<ItalicIcon />
			</button>
			<button type="button" style={btn(isUnderline)} aria-label="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()}>
				<UnderlineIcon />
			</button>
			<button type="button" style={btn(isStrike)} aria-label="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()}>
				<StrikeIcon />
			</button>
			<button type="button" style={btn(isSuperscript)} aria-label="Superscript" onClick={() => editor?.chain().focus().toggleSuperscript().run()}>
				<SuperscriptIcon />
			</button>
			<button type="button" style={btn(isSubscript)} aria-label="Subscript" onClick={() => editor?.chain().focus().toggleSubscript().run()}>
				<SubscriptIcon />
			</button>

			<div style={divider} />

			{/* Font color */}
			<label
				aria-label="Font color"
				title="Font color"
				style={{ ...styles.toolBtn, position: "relative", cursor: "pointer", flexDirection: "column", gap: 1 }}
			>
				<FontColorIcon />
				<div style={{ height: 3, borderRadius: 2, background: fontColor, width: "80%", flexShrink: 0 }} />
				<input
					ref={fontColorInputRef}
					type="color"
					value={fontColor}
					onChange={(e) => applyFontColor(e.target.value)}
					style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
					tabIndex={-1}
				/>
			</label>

			{/* Highlight color */}
			<label
				aria-label="Highlight color"
				title="Highlight color"
				style={{ ...styles.toolBtn, position: "relative", cursor: "pointer", flexDirection: "column", gap: 1 }}
			>
				<HighlightIcon />
				<div style={{ height: 3, borderRadius: 2, background: highlightColor, width: "80%", flexShrink: 0 }} />
				<input
					ref={highlightInputRef}
					type="color"
					value={highlightColor}
					onChange={(e) => applyHighlight(e.target.value)}
					style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
					tabIndex={-1}
				/>
			</label>

			<div style={divider} />

			{/* Link */}
			<button type="button" style={btn(isLink)} aria-label={isLink ? "Remove link" : "Insert link"} onClick={handleLink}>
				{isLink ? <UnlinkIcon /> : <LinkIcon />}
			</button>

			<div style={divider} />

			{/* Alignment */}
			<button type="button" style={btn(isAlignLeft || (!isAlignCenter && !isAlignRight && !isAlignJustify))} aria-label="Align left" onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
				<AlignLeftIcon />
			</button>
			<button type="button" style={btn(isAlignCenter)} aria-label="Align center" onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
				<AlignMiddleIcon />
			</button>
			<button type="button" style={btn(isAlignRight)} aria-label="Align right" onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
				<AlignRightIcon />
			</button>
			<button type="button" style={btn(isAlignJustify)} aria-label="Justify" onClick={() => editor?.chain().focus().setTextAlign("justify").run()}>
				<AlignJustifyIcon />
			</button>

			<div style={divider} />

			{/* Lists */}
			<button type="button" style={btn(isBullets)} aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
				<BulletListIcon />
			</button>
			<button type="button" style={btn(isNumbers)} aria-label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
				<OrderedListIcon />
			</button>
			<button type="button" style={btn(isTaskList)} aria-label="Task list" onClick={() => editor?.chain().focus().toggleTaskList().run()}>
				<TaskListIcon />
			</button>

			<div style={divider} />

			{/* Code, blockquote, HR */}
			<button type="button" style={btn(isCode)} aria-label="Inline code" onClick={() => editor?.chain().focus().toggleCode().run()}>
				<CodeIcon />
			</button>
			<button type="button" style={btn(isBlockquote)} aria-label="Blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
				<BlockquoteIcon />
			</button>
			<button type="button" style={styles.toolBtn} aria-label="Horizontal rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
				<HorizontalRuleIcon />
			</button>
		</div>
	);
}
