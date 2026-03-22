"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@/lib/FontSize";

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

	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const [title, setTitle] = useState("");
	const [fontSize, setFontSize] = useState(20);

	// ✅ Font color state for toolbar
	const [fontColor, setFontColor] = useState("#ecfeff");

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

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
			danger: "rgba(248,113,113,0.95)",
			accent: "#16a34a",
		}),
		[],
	);

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
			}),

			// ✅ Color support (must target textStyle)
			TextStyle,
			Color.configure({ types: ["textStyle"] }),

			FontSize,

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
		},
		onUpdate: ({ editor }) => {
			scheduleSave(JSON.stringify(editor.getJSON()));
			setOutline(buildOutlineFromEditor(editor));
		},
	});

	function applyFontColor(next: string) {
		setFontColor(next);
		editor?.chain().focus().setColor(next).run();
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

		const h1: React.CSSProperties = { fontSize: 20, fontWeight: 850, letterSpacing: 0.2 };
		const sub: React.CSSProperties = { fontSize: 13, color: theme.muted, lineHeight: 1.4 };

		const status: React.CSSProperties = {
			fontSize: 12,
			fontWeight: 800,
			color: theme.muted,
			lineHeight: 1.2,
			marginTop: 4,
		};

		const statusError: React.CSSProperties = { ...status, color: theme.danger };

		const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

		const action: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			padding: "10px 12px",
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 700,
			fontSize: 13,
			textDecoration: "none",
		};

		const primaryAction: React.CSSProperties = {
			...action,
			border: `1px solid rgba(22,163,74,0.55)`,
			background: "rgba(22,163,74,0.12)",
		};

		const dangerAction: React.CSSProperties = { ...action, color: theme.danger };

		const retryBtn: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			padding: "6px 10px",
			background: "rgba(0,0,0,0.22)",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 800,
			fontSize: 12,
			marginLeft: 8,
		};

		const mainGrid: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: outlineOpen && !isMobile ? "280px 1fr" : "1fr",
			gap: 12,
			alignItems: "start",
		};

		const outlinePanel: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: theme.panel,
			padding: 12,
			position: "sticky",
			top: 18,
			maxHeight: "calc(100vh - 36px)",
			overflow: "auto",
		};

		const outlineHeader: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
		};

		const outlineTitle: React.CSSProperties = {
			fontSize: 12,
			fontWeight: 900,
			letterSpacing: 0.2,
			color: theme.muted,
			textTransform: "uppercase",
		};

		const outlineTools: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };

		const outlineToolBtn: React.CSSProperties = {
			border: `1px solid rgba(255,255,255,0.12)`,
			borderRadius: 10,
			padding: "6px 8px",
			background: "rgba(0,0,0,0.16)",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 800,
			fontSize: 12,
		};

		const outlineRow: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 8,
			borderRadius: 12,
			padding: "8px 8px",
			border: `1px solid rgba(255,255,255,0.08)`,
			background: "rgba(0,0,0,0.18)",
			marginTop: 8,
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
			color: theme.text,
			cursor: "pointer",
			fontWeight: 850,
			fontSize: 12,
			textAlign: "left",
			padding: 0,
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
			maxWidth: 150,
		};

		const outlineRight: React.CSSProperties = { display: "flex", gap: 6 };

		const miniBtn: React.CSSProperties = {
			border: `1px solid rgba(255,255,255,0.12)`,
			borderRadius: 10,
			padding: "6px 8px",
			background: "rgba(0,0,0,0.16)",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 900,
			fontSize: 12,
			lineHeight: 1,
		};

		const input: React.CSSProperties = {
			width: "100%",
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			background: theme.panel,
			color: theme.text,
			padding: "12px 14px",
			fontSize: 15,
			fontWeight: 850,
			outline: "none",
		};

		const docShell: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 18,
			background: "rgba(255,255,255,0.02)",
			boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
			padding: 18,
		};

		const paper: React.CSSProperties = {
			width: "min(816px, 100%)",
			minHeight: isMobile ? "auto" : 1056,
			margin: "0 auto",
			border: `1px solid ${theme.border}`,
			borderRadius: 10,
			background: "rgba(0,0,0,0.22)",
			padding: isMobile ? "20px 16px" : "56px 64px",
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column",
			gap: 14,
		};

		// Toolbar styles (single row + background)
		const toolbar: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
			flexWrap: "nowrap",
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			background: "rgba(0,0,0,0.22)",
			padding: "8px 10px",
			overflowX: "auto",
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
			height: 22,
			background: theme.border,
			margin: "0 2px",
			flex: "0 0 auto",
		};

		const toolBtn: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 10,
			padding: 0,
			background: "rgba(255,255,255,0.03)",
			color: theme.text,
			cursor: "pointer",
			width: 30,
			height: 30,
			display: "flex",
			lineHeight: 1,
			flex: "0 0 auto",
		};

		const toolBtnActive: React.CSSProperties = {
			...toolBtn,
			background: "rgba(255,255,255,0.14)",
			border: "1px solid rgba(255,255,255,0.3)",
		};

		const fontSizePill: React.CSSProperties = {
			display: "inline-flex",
			alignItems: "center",
			border: `1px solid ${theme.border}`,
			borderRadius: 10,
			overflow: "hidden",
			opacity: 0.95,
			flex: "0 0 auto",
		};

		const fontSizePillBtn: React.CSSProperties = {
			border: "none",
			background: "rgba(255,255,255,0.03)",
			color: theme.text,
			padding: "7px 10px",
			fontWeight: 900,
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
					line-height: 1.5;
					font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
					caret-color: #ecfeff;
				}
				.tiptap-editor p { margin: 0 0 2px 0; }
				.tiptap-editor h1, .tiptap-editor h2, .tiptap-editor h3 {
					margin: 14px 0 6px 0;
					font-weight: 900;
					letter-spacing: 0.2px;
				}
				.tiptap-editor h1 { font-size: 28px; line-height: 1.25; margin-top: 22px; }
				.tiptap-editor h2 { font-size: 22px; line-height: 1.3;  margin-top: 18px; }
				.tiptap-editor h3 { font-size: 18px; line-height: 1.35; margin-top: 14px; }
				.tiptap-editor h1:first-child, .tiptap-editor h2:first-child, .tiptap-editor h3:first-child {
					margin-top: 0;
				}
				.tiptap-editor ul {
					list-style-type: disc;
					padding-left: 1.5em;
					margin: 4px 0;
				}
				.tiptap-editor ol {
					list-style-type: decimal;
					padding-left: 1.5em;
					margin: 4px 0;
				}
				.tiptap-editor li { margin: 1px 0; }
				.tiptap-editor span[style*="font-size"] { line-height: 1.4; }
			`}</style>

			<div style={styles.container}>
				<header style={styles.header}>
					<div>
						<div style={styles.h1}>Note</div>
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
								fontColor={fontColor}
								applyFontColor={applyFontColor}
								setFontSize={setFontSize}
								styles={styles}
							/>

							<EditorContent editor={editor} />
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}