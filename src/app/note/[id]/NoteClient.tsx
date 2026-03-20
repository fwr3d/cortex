"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {TextStyle} from "@tiptap/extension-text-style";
import FontSize from "@/lib/FontSize";

type NoteRow = {
    id: string;
    classId: string;
    title: string;
    updatedAt: string;
    content: string;
};

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36];

function stepFontSize(current: number, dir: 1 | -1): number {
    const idx = FONT_SIZES.indexOf(current);
    if (idx === -1) {
        return FONT_SIZES.reduce((a, b) =>
            Math.abs(b - current) < Math.abs(a - current) ? b : a
        );
    }
    return FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, idx + dir))];
}

function safeJsonParse<T>(raw: string): T | null {
    try { return JSON.parse(raw) as T; }
    catch { return null; }
}

function nowIso() { return new Date().toISOString(); }

function isNotesBucketKey(k: string) {
    return k.startsWith("cortex:classes:") && k.endsWith(":notes:v1");
}

function extractClassIdFromBucketKey(k: string) {
    return k.slice("cortex:classes:".length, k.length - ":notes:v1".length);
}

function loadAllBuckets(): Array<{ key: string; classId: string; notes: NoteRow[] }> {
    const out: Array<{ key: string; classId: string; notes: NoteRow[] }> = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !isNotesBucketKey(k)) continue;
        const raw = localStorage.getItem(k);
        const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
        const notes = Array.isArray(parsed) ? parsed : [];
        out.push({ key: k, classId: extractClassIdFromBucketKey(k), notes });
    }
    return out;
}

function findNoteById(noteId: string) {
    for (const b of loadAllBuckets()) {
        const found = b.notes.find((n) => n.id === noteId);
        if (found) {
            return { classId: found.classId || b.classId, bucketKey: b.key, notes: b.notes, note: found };
        }
    }
    return null;
}

export default function NoteClient({ noteId }: { noteId: string }) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [fontSize, setFontSize] = useState(20);
    const [editorReady, setEditorReady] = useState(false);

    const noteData = useMemo(() => {
        const hit = findNoteById(noteId);
        if (!hit) return { loaded: true, notFound: true, classId: "", title: "", content: "" };
        return {
            loaded: true,
            notFound: false,
            classId: hit.classId,
            title: hit.note.title ?? "",
            content: hit.note.content ?? "",
        };
    }, [noteId]);

    const theme = useMemo(() => ({
        bg: "#070a0a",
        panel: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.12)",
        text: "#ecfeff",
        muted: "rgba(236,254,255,0.72)",
        danger: "rgba(248,113,113,0.95)",
    }), []);

    const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextStyle, FontSize],
    content: "",
    editorProps: {
        attributes: { class: "tiptap-editor" },
    },
    onCreate: () => setEditorReady(true),
    onSelectionUpdate: ({ editor }) => {
        const attrs = editor.getAttributes("textStyle");
        if (attrs.fontSize) {
            const size = parseInt(attrs.fontSize);
            if (!isNaN(size)) setFontSize(size);
        } else {
            setFontSize(20); // default when no mark
        }
    },
    onUpdate: ({ editor }) => {
        saveContent(JSON.stringify(editor.getJSON()));
    },
});

    // Seed content once both editor and noteData are ready
    useEffect(() => {
        if (!editor || !editorReady || !noteData.content) return;
        try {
            editor.commands.setContent(JSON.parse(noteData.content));
        } catch {
            editor.commands.setContent(`<p>${noteData.content}</p>`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorReady, noteData]);

    useEffect(() => {
        setTitle(noteData.title);
    }, [noteData]);

    function saveContent(content: string) {
        const hit = findNoteById(noteId);
        if (!hit) return;
        const idx = hit.notes.findIndex((n) => n.id === noteId);
        if (idx === -1) return;
        const updated: NoteRow = {
            ...hit.notes[idx],
            classId: hit.classId,
            title,
            content,
            updatedAt: nowIso(),
        };
        const nextNotes = hit.notes.slice();
        nextNotes[idx] = updated;
        localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
    }

    function saveTitle(next: string) {
        const hit = findNoteById(noteId);
        if (!hit) return;
        const idx = hit.notes.findIndex((n) => n.id === noteId);
        if (idx === -1) return;
        const updated: NoteRow = {
            ...hit.notes[idx],
            classId: hit.classId,
            title: next,
            content: JSON.stringify(editor?.getJSON() ?? ""),
            updatedAt: nowIso(),
        };
        const nextNotes = hit.notes.slice();
        nextNotes[idx] = updated;
        localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
    }

    function deleteSelf() {
        const hit = findNoteById(noteId);
        if (!hit) return;
        const label = hit.note.title || "Untitled note";
        if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
        const nextNotes = hit.notes.filter((n) => n.id !== noteId);
        localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
        router.push(`/class/${encodeURIComponent(hit.classId)}`);
    }

    function applyFontSize(next: number) {
    setFontSize(next);
    if (editor?.state.selection.empty) {
        // No selection — set stored mark so next typed chars use this size
        editor.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
    } else {
        // Apply to selected text
        editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
    }
}

    const styles = useMemo(() => {
        const stage: React.CSSProperties = {
            minHeight: "100vh",
            padding: "28px 18px 40px",
            backgroundColor: theme.bg,
            color: theme.text,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        };
        const container: React.CSSProperties = {
            maxWidth: 980,
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
        const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
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
        const dangerAction: React.CSSProperties = { ...action, color: theme.danger };
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
            minHeight: 1056,
            margin: "0 auto",
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            background: "rgba(0,0,0,0.22)",
            padding: "56px 64px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 14,
        };
        const toolbar: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            background: "rgba(0,0,0,0.22)",
            padding: "8px 10px",
        };
        const toolGroup: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
        };
        const toolLabel: React.CSSProperties = {
            fontSize: 12,
            fontWeight: 800,
            color: theme.muted,
            letterSpacing: 0.2,
            paddingRight: 4,
        };
        const toolDivider: React.CSSProperties = {
            width: 1,
            height: 22,
            background: theme.border,
            margin: "0 2px",
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
        };
        const toolBtnActive: React.CSSProperties = {
            ...toolBtn,
            background: "rgba(255,255,255,0.14)",
            border: `1px solid rgba(255,255,255,0.3)`,
        };
        const fontSizePill: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            overflow: "hidden",
            opacity: 0.85,
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
        return {
            stage, container, header, h1, sub, actions, action, dangerAction,
            docShell, paper, toolbar, toolGroup, toolLabel, toolDivider,
            toolBtn, toolBtnActive, fontSizePill, fontSizePillBtn, input, error,
        };
    }, [theme]);

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
                            <Link href="/dashboard" style={styles.action}>Back to dashboard</Link>
                        </div>
                    </div>
                    <div style={styles.error}>
                        This note id does not exist in any <code>cortex:classes:\*:notes:v1</code> bucket.
                    </div>
                </div>
            </main>
        );
    }

    const isBold = editor?.isActive("bold") ?? false;
    const isItalic = editor?.isActive("italic") ?? false;
    const isUnderline = editor?.isActive("underline") ?? false;

    return (
        <main style={styles.stage}>
            {/* Scoped editor styles */}
            <style>{`
    .tiptap-editor {
        outline: none;
        width: 100%;
        flex: 1 1 auto;
        min-height: 600px;
        color: #ecfeff;
        font-size: 20px;           /* fixed default, not ${fontSize}px */
        line-height: 1.5;          /* tighter, won't balloon with large text */
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        caret-color: #ecfeff;
    }
    .tiptap-editor p {
        margin: 0 0 2px 0;         /* tighter paragraph gap */
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
    .tiptap-editor span[style*="font-size"] {
        line-height: 1.4;          /* large text stays tight */
    }
`}</style>

            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <div style={styles.h1}>Note</div>
                        <div style={styles.sub}>{noteData.classId}</div>
                    </div>
                    <div style={styles.actions}>
                        <Link href={`/class/${encodeURIComponent(noteData.classId)}`} style={styles.action}>
                            Back to class
                        </Link>
                        <button type="button" style={styles.dangerAction} onClick={deleteSelf}>
                            Delete
                        </button>
                        <button
                            type="button"
                            style={styles.action}
                            onClick={() => router.push(`/class/${encodeURIComponent(noteData.classId)}`)}
                        >
                            Done
                        </button>
                    </div>
                </header>

                <div style={styles.docShell}>
                    <div style={styles.paper}>
                        <input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                saveTitle(e.target.value);
                            }}
                            placeholder="Untitled note"
                            style={styles.input}
                        />

                        <div style={styles.toolbar} aria-label="Editor toolbar">
                            {/* Formatting group */}
                            <div style={styles.toolGroup}>
                                <span style={styles.toolLabel}>Text</span>

                                <button
                                    type="button"
                                    style={isBold ? styles.toolBtnActive : styles.toolBtn}
                                    aria-label="Bold"
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M9 7V11H13C14.1046 11 15 10.1046 15 9C15 7.89543 14.1046 7 13 7H9ZM15.9365 11.7161C16.5966 11.0028 17 10.0485 17 9C17 6.79086 15.2091 5 13 5H8.5C7.67157 5 7 5.67157 7 6.5V12V18.5C7 19.3284 7.67157 20 8.5 20H13.5C15.9853 20 18 17.9853 18 15.5C18 13.9126 17.178 12.5171 15.9365 11.7161ZM13 13H9V18H13.5C14.8807 18 16 16.8807 16 15.5C16 14.1193 14.8807 13 13.5 13H13Z" fill="#ffffff"/>
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    style={isItalic ? styles.toolBtnActive : styles.toolBtn}
                                    aria-label="Italic"
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M8 6C8 5.44772 8.44772 5 9 5H12H15C15.5523 5 16 5.44772 16 6C16 6.55228 15.5523 7 15 7H12.8579L11.1656 18H13C13.5523 18 14 18.4477 14 19C14 19.5523 13.5523 20 13 20H10H7C6.44772 20 6 19.5523 6 19C6 18.4477 6.44772 18 7 18H9.14208L10.8344 7H9C8.44772 7 8 6.55228 8 6Z" fill="#ffffff"/>
                                    </svg>
                                </button>

                                <div style={styles.toolDivider} />
                            </div>

                            {/* Font size + lists group */}
                            <div style={styles.toolGroup}>
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
                                            <option key={s} value={s}>{s}</option>
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

                                <div style={styles.toolDivider} />

                               <button
	type="button"
	style={editor?.isActive("bulletList") ? styles.toolBtnActive : styles.toolBtn}
	aria-label="Bulleted list"
	onClick={() => editor?.chain().focus().toggleBulletList().run()}
>
	<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.25 7C6.25 7.69036 5.69036 8.25 5 8.25C4.30964 8.25 3.75 7.69036 3.75 7C3.75 6.30964 4.30964 5.75 5 5.75C5.69036 5.75 6.25 6.30964 6.25 7ZM9 6C8.44771 6 8 6.44772 8 7C8 7.55228 8.44771 8 9 8H19C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6H9ZM9 11C8.44771 11 8 11.4477 8 12C8 12.5523 8.44771 13 9 13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H9ZM9 16C8.44771 16 8 16.4477 8 17C8 17.5523 8.44771 18 9 18H19C19.5523 18 20 17.5523 20 17C20 16.4477 19.5523 16 19 16H9ZM5 13.25C5.69036 13.25 6.25 12.6904 6.25 12C6.25 11.3096 5.69036 10.75 5 10.75C4.30964 10.75 3.75 11.3096 3.75 12C3.75 12.6904 4.30964 13.25 5 13.25ZM5 18.25C5.69036 18.25 6.25 17.6904 6.25 17C6.25 16.3096 5.69036 15.75 5 15.75C4.30964 15.75 3.75 16.3096 3.75 17C3.75 17.6904 4.30964 18.25 5 18.25Z" fill="#ffffff"/>
</svg>
</button>

                                <button
	type="button"
	style={editor?.isActive("orderedList") ? styles.toolBtnActive : styles.toolBtn}
	aria-label="Numbered list"
	onClick={() => editor?.chain().focus().toggleOrderedList().run()}
>
	<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99999 5.5C5.99999 5.22386 5.77613 5 5.49999 5C5.22385 5 4.99999 5.22386 4.99999 5.5V8.5C4.99999 8.77614 5.22385 9 5.49999 9C5.77613 9 5.99999 8.77614 5.99999 8.5V5.5ZM5.25046 11.2673C5.38308 11.1789 5.55766 11.1864 5.68212 11.286C5.85245 11.4223 5.86653 11.6764 5.71228 11.8306L4.39644 13.1464C4.25344 13.2894 4.21066 13.5045 4.28805 13.6913C4.36544 13.8782 4.54776 14 4.74999 14H6.49999C6.77613 14 6.99999 13.7761 6.99999 13.5C6.99999 13.2239 6.77613 13 6.49999 13H5.9571L6.41939 12.5377C6.99508 11.962 6.94256 11.0137 6.30681 10.5051C5.8423 10.1335 5.19072 10.1053 4.69576 10.4352L4.47264 10.584C4.24288 10.7372 4.18079 11.0476 4.33397 11.2773C4.48714 11.5071 4.79758 11.5692 5.02734 11.416L5.25046 11.2673ZM4.74999 15.5C4.47385 15.5 4.24999 15.7239 4.24999 16C4.24999 16.2761 4.47385 16.5 4.74999 16.5H5.29288L4.64644 17.1464C4.50344 17.2894 4.46066 17.5045 4.53805 17.6913C4.61544 17.8782 4.79776 18 4.99999 18H5.74999C5.88806 18 5.99999 18.1119 5.99999 18.25C5.99999 18.3881 5.88806 18.5 5.74999 18.5H4.74999C4.47385 18.5 4.24999 18.7239 4.24999 19C4.24999 19.2761 4.47385 19.5 4.74999 19.5H5.74999C6.44035 19.5 6.99999 18.9404 6.99999 18.25C6.99999 17.6972 6.6412 17.2283 6.1438 17.0633L6.85355 16.3536C6.99654 16.2106 7.03932 15.9955 6.96193 15.8087C6.88454 15.6218 6.70222 15.5 6.49999 15.5H4.74999ZM8.99999 6C8.44771 6 7.99999 6.44772 7.99999 7C7.99999 7.55228 8.44771 8 8.99999 8H19C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6H8.99999ZM8.99999 11C8.44771 11 7.99999 11.4477 7.99999 12C7.99999 12.5523 8.44771 13 8.99999 13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H8.99999ZM8.99999 16C8.44771 16 7.99999 16.4477 7.99999 17C7.99999 17.5523 8.44771 18 8.99999 18H19C19.5523 18 20 17.5523 20 17C20 16.4477 19.5523 16 19 16H8.99999Z" fill="#ffffff"/>
</svg>
</button>
                            </div>
                        </div>

                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </main>
    );
}