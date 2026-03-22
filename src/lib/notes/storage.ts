import type { NoteRow } from "@/types";
import { safeJsonParse, nowIso } from "@/lib/utils";

export type { NoteRow } from "@/types";

export function hasWindow() {
	return typeof window !== "undefined";
}

export function slugifyClassName(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 80);
}

function notesBucketKey(classIdSlug: string) {
	return `cortex:classes:${classIdSlug}:notes:v1`;
}

function isNotesBucketKey(k: string) {
	return k.startsWith("cortex:classes:") && k.endsWith(":notes:v1");
}

function extractClassIdFromBucketKey(k: string) {
	return k.slice("cortex:classes:".length, k.length - ":notes:v1".length);
}

export function loadAllBuckets(): Array<{ key: string; classId: string; notes: NoteRow[] }> {
	if (!hasWindow()) return [];

	const keys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i);
		if (k && isNotesBucketKey(k)) keys.push(k);
	}

	return keys.map((k) => {
		const raw = localStorage.getItem(k);
		const parsed = raw ? safeJsonParse<NoteRow[]>(raw) : null;
		const notes = Array.isArray(parsed) ? parsed : [];
		return { key: k, classId: extractClassIdFromBucketKey(k), notes };
	});
}

export function loadAllNotes(): NoteRow[] {
	const out: NoteRow[] = [];
	for (const b of loadAllBuckets()) {
		for (const n of b.notes) {
			out.push({ ...n, classId: n.classId || b.classId });
		}
	}
	return out;
}

export function findNoteById(noteId: string) {
	for (const b of loadAllBuckets()) {
		const found = b.notes.find((n) => n.id === noteId);
		if (found) {
			return {
				classId: found.classId || b.classId,
				bucketKey: b.key,
				notes: b.notes,
				note: found,
			};
		}
	}
	return null;
}

export function saveNote(args: { noteId: string; title?: string; content?: string }) {
	if (!hasWindow()) throw new Error("No window");
	const hit = findNoteById(args.noteId);
	if (!hit) throw new Error("Note not found");

	const rawLatest = localStorage.getItem(hit.bucketKey);
	const latestParsed = rawLatest ? safeJsonParse<NoteRow[]>(rawLatest) : null;
	const latestNotes = Array.isArray(latestParsed) ? latestParsed : hit.notes;

	const latestIdx = latestNotes.findIndex((n) => n.id === args.noteId);
	const latestRow = latestIdx >= 0 ? latestNotes[latestIdx] : hit.notes.find((n) => n.id === args.noteId)!;

	const updated: NoteRow = {
		...latestRow,
		classId: hit.classId,
		title: args.title ?? latestRow.title,
		content: args.content ?? latestRow.content,
		updatedAt: nowIso(),
	};

	const nextNotes = latestNotes.slice();
	if (latestIdx >= 0) nextNotes[latestIdx] = updated;
	else nextNotes.unshift(updated);

	localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
	return updated;
}

export function deleteNote(noteId: string) {
	if (!hasWindow()) throw new Error("No window");
	const hit = findNoteById(noteId);
	if (!hit) throw new Error("Note not found");

	const nextNotes = hit.notes.filter((n) => n.id !== noteId);
	localStorage.setItem(hit.bucketKey, JSON.stringify(nextNotes));
	return { classId: hit.classId, deletedTitle: hit.note.title || "Untitled note" };
}

export function getNotesBucketKey(classIdSlug: string) {
	return notesBucketKey(classIdSlug);
}
