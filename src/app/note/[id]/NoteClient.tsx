"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import FontSize from "@/lib/FontSize";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TiptapLink from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import FontFamily from "@tiptap/extension-font-family";

import { deleteNote, findNoteById, hasWindow, saveNote, slugifyClassName } from "@/lib/notes/storage";
import type { OutlineItem } from "@/lib/notes/outline";
import {
	buildOutlineFromEditor,
	copySectionLink as copySectionLinkImpl,
	jumpToOutlineItem,
	loadCollapsedSet,
	saveCollapsedSet,
	setSectionParam,
} from "@/lib/notes/outline";

import NoteToolbar from "@/components/editor/NoteToolbar";
import { buildOutlineTree } from "@/components/editor/outlineTree";

import { CollapseExtension } from "@/components/editor/collapseExtension";
import { CollapsibleHeading } from "@/components/editor/collapsibleHeading";
import { useMobile } from "@/lib/hooks";
import { theme } from "@/lib/theme";

type SaveState = "idle" | "saving" | "saved" | "error";

type FlashcardSource = { quote: string };
type Flashcard = { front: string; back: string; sources: FlashcardSource[] };

const FLASHCARDS_KEY = (noteId: string) => `cortex:notes:${noteId}:flashcards:v1`;

function formatTime(tsMs: number) {
	const d = new Date(tsMs);
	return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function NoteClient({ noteId }: { noteId: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const isMobile = useMobile();

	const [title, setTitle] = useState("");
	const [fontSize, setFontSize] = useState(20);
	const [fontFamily, setFontFamily] = useState(
		"ui-sans-serif, system-ui, -apple-system, sans-serif"
	);
	const [fontColor, setFontColor] = useState("#ecfeff");
	const [highlightColor, setHighlightColor] = useState("#facc15");
	const [wordCount, setWordCount] = useState(0);

	const [editorReady, setEditorReady] = useState(false);

	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [lastSavedAtMs, setLastSavedAtMs] = useState<number | null>(null);
	const [lastSaveError, setLastSaveError] = useState<string | null>(null);

	const [flashcardsStatus, setFlashcardsStatus] = useState<"idle" | "generating" | "error" | "ready">("idle");
	const [flashcardsMessage, setFlashcardsMessage] = useState<string>("");

	// Outline data
	const [outline, setOutline] = useState<OutlineItem[]>([]);

	// Outline collapse state (outline only)
	const [outlineCollapsedIds, setOutlineCollapsedIds] = useState<Set<string>>(() => loadCollapsedSet(noteId));
	const [outlineOpen, setOutlineOpen] = useState(true);

	// Close outline panel by default on mobile
	useEffect(() => {
		if (window.innerWidth < 768) setOutlineOpen(false);
	}, []);

	// Editor collapse state (editor only)
	const [editorCollapsedIds, setEditorCollapsedIds] = useState<Set<string>>(new Set());

	// Refs so ProseMirror plugins always see latest values
	const editorCollapsedIdsRef = useRef<Set<string>>(new Set());
	const outlineRef = useRef<OutlineItem[]>(outline);

	useEffect(() => {
		outlineRef.current = outline;
	}, [outline]);

	// Note data must not touch localStorage during render; load in effect.
	const [noteData, setNoteData] = useState<{
		loaded: boolean;
		notFound: boolean;
		classId: string;
		title: string;
		content: string;
	}>(() => ({
		loaded: false,
		notFound: false,
		classId: "",
		title: "",
		content: "",
	}));

	// "dirty" state without causing rerenders on every keystroke
	const isDirtyRef = useRef(false);
	const isSavingRef = useRef(false);
	const debounceTimerRef = useRef<number | null>(null);
	const pendingContentRef = useRef<string | null>(null);
	const safetyIntervalRef = useRef<number | null>(null);

	useEffect(() => {
		if (!hasWindow()) return;

		const hit = findNoteById(noteId);
		if (!hit) {
			setNoteData({ loaded: true, notFound: true, classId: "", title: "", content: "" });
			return;
		}

		setNoteData({
			loaded: true,
			notFound: false,
			classId: hit.classId,
			title: hit.note.title ?? "",
			content: hit.note.content ?? "",
		});
	}, [noteId]);

	function clearDebounceTimer() {
		if (debounceTimerRef.current != null) {
			window.clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
	}

	function clearSafetyInterval() {
		if (safetyIntervalRef.current != null) {
			window.clearInterval(safetyIntervalRef.current);
			safetyIntervalRef.current = null;
		}
	}

	function scheduleSave(nextContent: string) {
		pendingContentRef.current = nextContent;
		isDirtyRef.current = true;

		setLastSaveError(null);
		setSaveState("saving");

		clearDebounceTimer();
		debounceTimerRef.current = window.setTimeout(() => {
			void flushSave("debounce");
		}, 700);
	}

	async function flushSave(reason: "debounce" | "manual" | "visibility" | "interval" | "blur") {
		if (!isDirtyRef.current) return;
		if (isSavingRef.current) return; // prevent concurrent saves

		const content =
			pendingContentRef.current ??
			(() => {
				const json = editor?.getJSON();
				return json ? JSON.stringify(json) : null;
			})();

		if (!content) return;

		isSavingRef.current = true;
		try {
			setSaveState("saving");
			const updated = saveNote({ noteId, content });

			isDirtyRef.current = false;
			pendingContentRef.current = null;

			setSaveState("saved");
			setLastSavedAtMs(Date.parse(updated.updatedAt) || Date.now());
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Save failed";
			setSaveState("error");
			setLastSaveError(msg);

			isDirtyRef.current = true;
			pendingContentRef.current = content;
		} finally {
			isSavingRef.current = false;
			if (reason !== "debounce") clearDebounceTimer();
		}
	}

	function retrySave() {
		void flushSave("manual");
	}

	async function generateFlashcards() {
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 30000);

		try {
			setFlashcardsStatus("generating");
			setFlashcardsMessage("");

			const noteText = (() => {
				const json = editor?.getJSON();
				if (json) return JSON.stringify(json);
				return noteData.content ?? "";
			})();

			const res = await fetch("/api/flashcards", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ noteId, noteText, maxCards: 10 }),
				signal: controller.signal,
			});

			if (!res.ok) throw new Error(`Flashcard generation failed (${res.status})`);
			const json = (await res.json()) as {
				cards: Flashcard[];
				generated: number;
				skipped: number;
				message?: string;
			};

			localStorage.setItem(
				FLASHCARDS_KEY(noteId),
				JSON.stringify({ cards: json.cards ?? [], message: json.message ?? "" }),
			);

			if ((json.cards ?? []).length === 0) {
				setFlashcardsStatus("error");
				setFlashcardsMessage(json.message ?? "Not enough signal to generate flashcards yet.");
				return;
			}

			setFlashcardsStatus("ready");
			setFlashcardsMessage(json.message ?? `Generated ${(json.cards ?? []).length} flashcards.`);
			router.push(`/note/${noteId}/flashcards`);
		} catch (e) {
			const msg =
				e instanceof Error
					? e.name === "AbortError"
						? "Flashcard generation timed out. Try again."
						: e.message
					: "Flashcard generation failed";
			setFlashcardsStatus("error");
			setFlashcardsMessage(msg);
		} finally {
			window.clearTimeout(timeoutId);
		}
	}

	// Outline-only collapse handlers
	function toggleOutlineCollapsed(id: string) {
		setOutlineCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			saveCollapsedSet(noteId, next);
			return next;
		});
	}

	function collapseAllOutline() {
		const all = new Set(outline.map((o) => o.id));
		setOutlineCollapsedIds(all);
		saveCollapsedSet(noteId, all);
	}

	function expandAllOutline() {
		const none = new Set<string>();
		setOutlineCollapsedIds(none);
		saveCollapsedSet(noteId, none);
	}

	// Editor-only collapse handler (sync ref immediately)
	function toggleEditorCollapsed(id: string) {
		setEditorCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);

			editorCollapsedIdsRef.current = next;
			return next;
		});
	}

	function jumpTo(item: OutlineItem) {
		jumpToOutlineItem(editor, item);
		setSectionParam(item.id);
	}

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({ heading: false }),
			CollapsibleHeading.configure({
				levels: [1, 2, 3],
				getIsCollapsed: (id: string) => editorCollapsedIdsRef.current.has(id),
				onToggle: (id: string) => toggleEditorCollapsed(id),
			} as any),

			TextStyle,
			Color.configure({ types: ["textStyle"] }),
			FontFamily,
			Underline,
			FontSize,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Highlight.configure({ multicolor: true }),
			TiptapLink.configure({ openOnClick: false }),
			Superscript,
			Subscript,
			TaskList,
			TaskItem.configure({ nested: true }),

			CollapseExtension.configure({
				getState: () => ({
					collapsedIds: editorCollapsedIdsRef.current,
					headings: outlineRef.current,
				}),
			}),
		],
		content: "",
		editorProps: { attributes: { class: "tiptap-editor" } },
		onCreate: () => setEditorReady(true),
		onSelectionUpdate: ({ editor }) => {
			const attrs = editor.getAttributes("textStyle");

			if (attrs.fontSize) {
				const size = parseInt(attrs.fontSize);
				if (!isNaN(size)) setFontSize(size);
			} else {
				setFontSize(20);
			}

			if (attrs.color && typeof attrs.color === "string") {
				setFontColor(attrs.color);
			}

			if (attrs.fontFamily && typeof attrs.fontFamily === "string") {
				setFontFamily(attrs.fontFamily);
			}

			const hlAttrs = editor.getAttributes("highlight");
			if (hlAttrs.color && typeof hlAttrs.color === "string") {
				setHighlightColor(hlAttrs.color);
			}
		},
		onUpdate: ({ editor }) => {
			scheduleSave(JSON.stringify(editor.getJSON()));
			setOutline(buildOutlineFromEditor(editor));
			const text = editor.getText();
			setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
		},
	});

	function applyFontColor(next: string) {
		setFontColor(next);
		editor?.chain().focus().setColor(next).run();
	}

	function applyHighlight(next: string) {
		setHighlightColor(next);
		editor?.chain().focus().setHighlight({ color: next }).run();
	}

	function applyFontFamily(next: string) {
		setFontFamily(next);
		editor?.chain().focus().setFontFamily(next).run();
	}

	// Seed content once both editor and noteData are ready
	useEffect(() => {
		if (!editor || !editorReady) return;
		if (!noteData.content) return;

		try {
			editor.commands.setContent(JSON.parse(noteData.content));
		} catch {
			editor.commands.setContent(`<p>${noteData.content}</p>`);
		}

		setOutline(buildOutlineFromEditor(editor));

		const section = searchParams.get("section");
		if (section) {
			const items = buildOutlineFromEditor(editor);
			const hit = items.find((x) => x.id === section);
			if (hit) setTimeout(() => jumpTo(hit), 50);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editorReady, noteData.loaded]);

	useEffect(() => {
		setTitle(noteData.title);
	}, [noteData.title]);

	// Save-on-tab-hidden + beforeunload + timer safety net
	useEffect(() => {
		function onVisibilityChange() {
			if (document.visibilityState === "hidden") {
				void flushSave("visibility");
			}
		}

		function onBeforeUnload() {
			void flushSave("visibility");
		}

		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("beforeunload", onBeforeUnload);

		clearSafetyInterval();
		safetyIntervalRef.current = window.setInterval(() => {
			void flushSave("interval");
		}, 15000);

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("beforeunload", onBeforeUnload);
			clearDebounceTimer();
			clearSafetyInterval();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor]);

	function saveTitleValue(next: string) {
		setTitle(next);

		const editorJson = editor?.getJSON();
		const content = editorJson ? JSON.stringify(editorJson) : pendingContentRef.current ?? noteData.content ?? "";

		try {
			setSaveState("saving");
			setLastSaveError(null);

			const updated = saveNote({ noteId, title: next, content });

			isDirtyRef.current = false;
			pendingContentRef.current = null;

			setSaveState("saved");
			setLastSavedAtMs(Date.parse(updated.updatedAt) || Date.now());
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Save failed";
			setSaveState("error");
			setLastSaveError(msg);

			isDirtyRef.current = true;
			pendingContentRef.current = content;
		} finally {
			clearDebounceTimer();
		}
	}

	function deleteSelf() {
		try {
			const hit = findNoteById(noteId);
			if (!hit) return;

			const label = hit.note.title || "Untitled note";
			if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

			const { classId } = deleteNote(noteId);
			router.push(`/class/${slugifyClassName(classId)}`);
		} catch {
			// ignore
		}
	}

	function onEditorBlurCapture() {
		void flushSave("blur");
	}

	const styles = useMemo(() => {
		const stage: React.CSSProperties = {
			minHeight: "100vh",
			padding: isMobile ? "16px 12px 40px" : "28px 18px 40px",
			backgroundColor: theme.bg,
			backgroundImage: "radial-gradient(ellipse 90% 40% at 50% -5%, rgba(22,163,74,0.07) 0%, transparent 65%)",
			color: theme.text,
			fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
		};

		const container: React.CSSProperties = {
			maxWidth: 1060,
			margin: "0 auto",
			display: "flex",
			flexDirection: "column",
			gap: 14,
		};

		const header: React.CSSProperties = {
			display: "flex",
			alignItems: "baseline",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
		};

		const h1: React.CSSProperties = { fontSize: 15, fontWeight: 600, letterSpacing: "-0.1px", color: "rgba(236,254,255,0.9)" };
		const sub: React.CSSProperties = { fontSize: 11, color: "rgba(236,254,255,0.38)", lineHeight: 1.4, letterSpacing: "0.3px", textTransform: "uppercase" as const };

		const status: React.CSSProperties = {
			fontSize: 11,
			fontWeight: 500,
			color: "rgba(236,254,255,0.38)",
			lineHeight: 1.2,
			marginTop: 5,
			letterSpacing: "0.2px",
		};

		const statusError: React.CSSProperties = { ...status, color: theme.danger };

		const actions: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };

		const action: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.09)",
			borderRadius: 10,
			padding: "7px 14px",
			background: "rgba(255,255,255,0.04)",
			color: "rgba(236,254,255,0.75)",
			cursor: "pointer",
			fontWeight: 500,
			fontSize: 13,
			textDecoration: "none",
			letterSpacing: "0.1px",
		};

		const primaryAction: React.CSSProperties = {
			...action,
			border: "1px solid rgba(22,163,74,0.5)",
			background: "rgba(22,163,74,0.14)",
			color: "#4ade80",
			fontWeight: 600,
		};

		const dangerAction: React.CSSProperties = {
			...action,
			color: "rgba(248,113,113,0.65)",
			border: "1px solid rgba(248,113,113,0.1)",
			background: "rgba(248,113,113,0.04)",
		};

		const retryBtn: React.CSSProperties = {
			border: "1px solid rgba(248,113,113,0.3)",
			borderRadius: 8,
			padding: "3px 10px",
			background: "rgba(248,113,113,0.08)",
			color: "rgba(248,113,113,0.9)",
			cursor: "pointer",
			fontWeight: 600,
			fontSize: 11,
			marginLeft: 8,
			letterSpacing: "0.2px",
		};

		const mainGrid: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: outlineOpen && !isMobile ? "280px 1fr" : "1fr",
			gap: 12,
			alignItems: "start",
		};

		const outlinePanel: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.07)",
			borderRadius: 18,
			background: "rgba(255,255,255,0.025)",
			backdropFilter: "blur(20px)",
			padding: "14px 12px",
			position: "sticky",
			top: 18,
			maxHeight: "calc(100vh - 36px)",
			overflow: "auto",
			boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
		};

		const outlineHeader: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
		};

		const outlineTitle: React.CSSProperties = {
			fontSize: 10,
			fontWeight: 700,
			letterSpacing: "1px",
			color: "rgba(236,254,255,0.35)",
			textTransform: "uppercase",
		};

		const outlineTools: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };

		const outlineToolBtn: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.08)",
			borderRadius: 8,
			padding: "4px 10px",
			background: "transparent",
			color: "rgba(236,254,255,0.55)",
			cursor: "pointer",
			fontWeight: 500,
			fontSize: 11,
			letterSpacing: "0.2px",
		};

		const outlineRow: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 8,
			borderRadius: 8,
			padding: "5px 6px",
			marginTop: 2,
		};

		const outlineItemText: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			minWidth: 0,
		};

		const outlineLinkBtn: React.CSSProperties = {
			border: "none",
			background: "transparent",
			color: "rgba(236,254,255,0.8)",
			cursor: "pointer",
			fontWeight: 450,
			fontSize: 12,
			textAlign: "left",
			padding: 0,
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
			maxWidth: 150,
			letterSpacing: "0.1px",
			lineHeight: 1.4,
		};

		const outlineRight: React.CSSProperties = { display: "flex", gap: 6 };

		const miniBtn: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.07)",
			borderRadius: 6,
			padding: "3px 7px",
			background: "transparent",
			color: "rgba(236,254,255,0.4)",
			cursor: "pointer",
			fontWeight: 600,
			fontSize: 10,
			lineHeight: 1,
		};

		const input: React.CSSProperties = {
			width: "100%",
			border: "none",
			borderBottom: "1px solid rgba(236,254,255,0.08)",
			borderRadius: 0,
			background: "transparent",
			color: theme.text,
			padding: isMobile ? "6px 0 12px" : "8px 0 16px",
			fontSize: isMobile ? 22 : 30,
			fontWeight: 700,
			fontFamily: '"Crimson Pro", Georgia, "Times New Roman", serif',
			letterSpacing: "-0.5px",
			lineHeight: 1.2,
			outline: "none",
		};

		const docShell: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.07)",
			borderRadius: 24,
			background: "rgba(4,8,8,0.65)",
			boxShadow: "0 48px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05)",
			backdropFilter: "blur(40px)",
			padding: isMobile ? 14 : 24,
		};

		const paper: React.CSSProperties = {
			width: "min(816px, 100%)",
			minHeight: isMobile ? "auto" : 1056,
			margin: "0 auto",
			border: "1px solid rgba(255,255,255,0.04)",
			borderRadius: 14,
			background: "rgba(9,13,13,0.98)",
			padding: isMobile ? "20px 18px 32px" : "56px 76px 64px",
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column",
			gap: 18,
			boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
		};

		const wordCountStyle: React.CSSProperties = {
			fontSize: 11,
			color: "rgba(236,254,255,0.22)",
			textAlign: "right" as const,
			paddingTop: 12,
			borderTop: "1px solid rgba(255,255,255,0.04)",
			marginTop: 8,
			letterSpacing: "0.3px",
		};

		// Toolbar styles (single row + background)
		const toolbar: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 8,
			flexWrap: "nowrap",
			border: "1px solid rgba(255,255,255,0.08)",
			borderRadius: 12,
			background: "rgba(7,10,10,0.9)",
			backdropFilter: "blur(20px)",
			padding: "6px 10px",
			overflowX: "auto",
			boxShadow: "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
		};

		const toolGroup: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			flexWrap: "nowrap",
			minWidth: 0,
		};

		const toolLabel: React.CSSProperties = {
			fontSize: 12,
			fontWeight: 800,
			color: theme.muted,
			letterSpacing: 0.2,
			paddingRight: 4,
			whiteSpace: "nowrap",
		};

		const toolDivider: React.CSSProperties = {
			width: 1,
			height: 18,
			background: "rgba(255,255,255,0.08)",
			margin: "0 4px",
			flex: "0 0 auto",
		};

		const toolBtn: React.CSSProperties = {
			border: "1px solid rgba(255,255,255,0.06)",
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 8,
			padding: 0,
			background: "transparent",
			color: "rgba(236,254,255,0.7)",
			cursor: "pointer",
			width: 28,
			height: 28,
			display: "flex",
			lineHeight: 1,
			flex: "0 0 auto",
		};

		const toolBtnActive: React.CSSProperties = {
			...toolBtn,
			background: "rgba(22,163,74,0.18)",
			border: "1px solid rgba(22,163,74,0.45)",
			color: "#4ade80",
		};

		const fontSizePill: React.CSSProperties = {
			display: "inline-flex",
			alignItems: "center",
			border: "1px solid rgba(255,255,255,0.08)",
			borderRadius: 8,
			overflow: "hidden",
			flex: "0 0 auto",
			background: "rgba(255,255,255,0.03)",
		};

		const fontSizePillBtn: React.CSSProperties = {
			border: "none",
			background: "transparent",
			color: "rgba(236,254,255,0.7)",
			padding: "6px 9px",
			fontWeight: 700,
			fontSize: 12,
			lineHeight: 1,
			cursor: "pointer",
			flex: "0 0 auto",
		};

		const error: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: theme.panel,
			padding: 14,
			color: theme.muted,
			fontSize: 13,
			lineHeight: 1.45,
		};

		const errorInline: React.CSSProperties = { marginLeft: 10 };

		return {
			stage,
			container,
			header,
			h1,
			sub,
			status,
			statusError,
			actions,
			action,
			primaryAction,
			dangerAction,
			retryBtn,
			mainGrid,
			outlinePanel,
			outlineHeader,
			outlineTitle,
			outlineTools,
			outlineToolBtn,
			outlineRow,
			outlineItemText,
			outlineLinkBtn,
			outlineRight,
			miniBtn,
			input,
			docShell,
			paper,
			wordCountStyle,
			toolbar,
			toolGroup,
			toolLabel,
			toolDivider,
			toolBtn,
			toolBtnActive,
			fontSizePill,
			fontSizePillBtn,
			error,
			errorInline,
		};
	}, [theme, outlineOpen, isMobile]);

	const outlineTree = useMemo(() => buildOutlineTree(outline), [outline]);

	if (!noteData.loaded) return null;

	if (noteData.notFound) {
		return (
			<main style={styles.stage}>
				<div style={styles.container}>
					<div style={styles.header}>
						<div>
							<div style={styles.h1}>Note not found</div>
							<div style={styles.sub}>This note was not found in local storage.</div>
						</div>
						<div style={styles.actions}>
							<Link href="/dashboard" style={styles.action}>
								Back to dashboard
							</Link>
						</div>
					</div>

					<div style={styles.error}>
						This note id does not exist in any <code>cortex:classes:*:notes:v1</code> bucket.
					</div>
				</div>
			</main>
		);
	}

	const statusText = (() => {
		if (saveState === "saving") return "Saving…";
		if (saveState === "saved" && lastSavedAtMs) return `Saved ${formatTime(lastSavedAtMs)}`;
		if (saveState === "error") return "Couldn’t save";
		return "";
	})();

	function outlineNodeIsCollapsible(node: any) {
		const hasChildren = (node.children?.length ?? 0) > 0;
		const bodyFrom = node.pos + node.nodeSize;
		const hasBody = (node.endPos ?? bodyFrom) > bodyFrom;
		return hasChildren || hasBody;
	}

	function renderOutlineNode(node: any) {
		const hasChildren = (node.children?.length ?? 0) > 0;
		const isCollapsed = outlineCollapsedIds.has(node.id);
		const collapsible = outlineNodeIsCollapsible(node);

		return (
			<div
				key={node.id}
				style={{
					marginTop: 8,
					marginLeft: (node.level - 1) * 12,
				}}
			>
				<div style={styles.outlineRow}>
					<div style={styles.outlineItemText}>
						{collapsible ? (
							<button type="button" style={styles.miniBtn} onClick={() => toggleOutlineCollapsed(node.id)}>
								{isCollapsed ? "▶" : "▼"}
							</button>
						) : (
							<div style={{ width: 34 }} />
						)}

						<button type="button" style={styles.outlineLinkBtn} onClick={() => jumpTo(node)}>
							{node.text}
						</button>
					</div>

					<div style={styles.outlineRight}>
						<button
							type="button"
							style={styles.miniBtn}
							onClick={() => copySectionLinkImpl(node.id)}
							title="Copy link"
						>
							⧉
						</button>
					</div>
				</div>

				{hasChildren && !isCollapsed ? node.children.map(renderOutlineNode) : null}
			</div>
		);
	}

	return (
		<main style={styles.stage}>
			<style>{`
				.tiptap-editor {
					outline: none;
					width: 100%;
					flex: 1 1 auto;
					min-height: 600px;
					color: #ecfeff;
					font-size: 20px;
					line-height: 1.72;
					font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
					caret-color: #4ade80;
				}
				.tiptap-editor ::selection { background: rgba(22,163,74,0.2); }
				.tiptap-editor p { margin: 0 0 6px 0; }
				.tiptap-editor h1 {
					font-size: 30px;
					font-weight: 800;
					line-height: 1.2;
					margin: 30px 0 12px;
					letter-spacing: -0.4px;
					color: #ecfeff;
					border-bottom: 1px solid rgba(22,163,74,0.22);
					padding-bottom: 10px;
				}
				.tiptap-editor h2 {
					font-size: 22px;
					font-weight: 700;
					line-height: 1.3;
					margin: 24px 0 8px;
					letter-spacing: -0.2px;
					color: rgba(236,254,255,0.95);
				}
				.tiptap-editor h3 {
					font-size: 18px;
					font-weight: 600;
					line-height: 1.35;
					margin: 18px 0 6px;
					letter-spacing: -0.1px;
					color: rgba(236,254,255,0.9);
				}
				.tiptap-editor h1:first-child, .tiptap-editor h2:first-child, .tiptap-editor h3:first-child {
					margin-top: 0;
				}
				.tiptap-editor ul {
					list-style-type: disc;
					padding-left: 1.6em;
					margin: 8px 0;
				}
				.tiptap-editor ol {
					list-style-type: decimal;
					padding-left: 1.6em;
					margin: 8px 0;
				}
				.tiptap-editor li { margin: 3px 0; }
				.tiptap-editor span[style*="font-size"] { line-height: 1.4; }
				.tiptap-editor u { text-decoration: underline; text-underline-offset: 3px; }
				.tiptap-editor s, .tiptap-editor del { text-decoration: line-through; opacity: 0.55; }
				.tiptap-editor code {
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
					font-size: 0.85em;
					background: rgba(22,163,74,0.09);
					border: 1px solid rgba(22,163,74,0.22);
					border-radius: 5px;
					padding: 2px 7px;
					color: #86efac;
				}
				.tiptap-editor pre {
					background: rgba(0,0,0,0.55);
					border: 1px solid rgba(255,255,255,0.07);
					border-radius: 12px;
					padding: 16px 20px;
					margin: 14px 0;
					overflow-x: auto;
				}
				.tiptap-editor pre code {
					background: none;
					border: none;
					padding: 0;
					font-size: 14px;
					color: #86efac;
					line-height: 1.65;
				}
				.tiptap-editor blockquote {
					border-left: 2px solid rgba(22,163,74,0.65);
					margin: 14px 0;
					padding: 10px 20px;
					background: rgba(22,163,74,0.05);
					border-radius: 0 10px 10px 0;
					color: rgba(236,254,255,0.72);
					font-style: italic;
				}
				.tiptap-editor hr {
					border: none;
					border-top: 1px solid rgba(255,255,255,0.08);
					margin: 24px 0;
				}
				.tiptap-editor a {
					color: #67e8f9;
					text-decoration: underline;
					text-underline-offset: 3px;
					cursor: pointer;
				}
				.tiptap-editor a:hover { color: #a5f3fc; }
				.tiptap-editor mark {
					border-radius: 3px;
					padding: 1px 3px;
				}
				.tiptap-editor ul[data-type="taskList"] {
					list-style: none;
					padding-left: 0.25em;
				}
				.tiptap-editor ul[data-type="taskList"] li {
					display: flex;
					align-items: flex-start;
					gap: 10px;
					margin: 4px 0;
				}
				.tiptap-editor ul[data-type="taskList"] li > label {
					flex-shrink: 0;
					margin-top: 3px;
				}
				.tiptap-editor ul[data-type="taskList"] li > label input[type="checkbox"] {
					width: 15px;
					height: 15px;
					cursor: pointer;
					accent-color: #22c55e;
				}
				.tiptap-editor ul[data-type="taskList"] li[data-checked="true"] > div {
					opacity: 0.42;
					text-decoration: line-through;
				}
				.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
					content: attr(data-placeholder);
					float: left;
					color: rgba(236,254,255,0.18);
					pointer-events: none;
					height: 0;
				}
				input[placeholder="Untitled note"]::placeholder { color: rgba(236,254,255,0.2); }
			`}</style>

			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>{title || "Untitled note"}</div>
						<div style={styles.sub}>{slugifyClassName(noteData.classId)}</div>

						{statusText ? (
							<div style={saveState === "error" ? styles.statusError : styles.status}>
								{statusText}
								{saveState === "error" ? (
									<>
										<button type="button" style={styles.retryBtn} onClick={retrySave}>
											Retry
										</button>
										{lastSaveError ? <span style={styles.errorInline}>{lastSaveError}</span> : null}
									</>
								) : null}
							</div>
						) : null}

						{flashcardsMessage ? <div style={styles.sub}>{flashcardsMessage}</div> : null}
					</div>

					<div style={styles.actions}>
						<button type="button" style={styles.action} onClick={() => setOutlineOpen((v) => !v)}>
							{outlineOpen ? "Hide outline" : "Show outline"}
						</button>

						<button
							type="button"
							style={styles.primaryAction}
							onClick={generateFlashcards}
							disabled={flashcardsStatus === "generating"}
						>
							{flashcardsStatus === "generating" ? "Generating…" : "Generate flashcards"}
						</button>

						<Link href={`/note/${noteId}/flashcards`} style={styles.action}>
							View flashcards
						</Link>

						<Link href={`/class/${slugifyClassName(noteData.classId)}`} style={styles.action}>
							Back to class
						</Link>

						<button type="button" style={styles.dangerAction} onClick={deleteSelf}>
							Delete
						</button>

						<button
							type="button"
							style={styles.action}
							onClick={() => router.push(`/class/${slugifyClassName(noteData.classId)}`)}
						>
							Done
						</button>
					</div>
				</header>

				<div style={styles.mainGrid}>
					{outlineOpen ? (
						<aside style={styles.outlinePanel} aria-label="Outline">
							<div style={styles.outlineHeader}>
								<div style={styles.outlineTitle}>Outline</div>
								<div style={styles.outlineTools}>
									<button type="button" style={styles.outlineToolBtn} onClick={expandAllOutline}>
										Expand
									</button>
									<button type="button" style={styles.outlineToolBtn} onClick={collapseAllOutline}>
										Collapse
									</button>
								</div>
							</div>

							{outlineTree.length === 0 ? (
								<div style={{ marginTop: 10, fontSize: 13, color: theme.muted, lineHeight: 1.45 }}>
									Add headings (H1–H3) to see an outline here.
								</div>
							) : (
								outlineTree.map(renderOutlineNode)
							)}
						</aside>
					) : null}

					<div style={styles.docShell}>
						<div style={styles.paper} onBlurCapture={onEditorBlurCapture}>
							<input
								value={title}
								onChange={(e) => saveTitleValue(e.target.value)}
								placeholder="Untitled note"
								style={styles.input}
							/>

							<NoteToolbar
								editor={editor}
								theme={theme}
								fontSize={fontSize}
								setFontSize={setFontSize}
								fontColor={fontColor}
								applyFontColor={applyFontColor}
								highlightColor={highlightColor}
								applyHighlight={applyHighlight}
								fontFamily={fontFamily}
								applyFontFamily={applyFontFamily}
								styles={styles}
							/>

							<EditorContent editor={editor} />

							{wordCount > 0 ? (
								<div style={styles.wordCountStyle}>
									{wordCount} {wordCount === 1 ? "word" : "words"}
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}