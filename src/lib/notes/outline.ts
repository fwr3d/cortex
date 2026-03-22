import { hasWindow } from "./storage";
import { safeJsonParse } from "@/lib/utils";

export type OutlineItem = {
	id: string;
	level: number; // 1-3
	text: string;
	pos: number;
	nodeSize: number;
	endPos: number;
};

export const COLLAPSE_KEY = (noteId: string) => `cortex:notes:${noteId}:collapsedHeadings:v1`;

function normalizeHeadingText(text: string) {
	return text.trim().replace(/\s+/g, " ");
}

function buildFallbackHeadingId(level: number, text: string, index: number) {
	const base = normalizeHeadingText(text)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return `h${level}-${base || "untitled"}-${index}`;
}

export function buildOutlineFromEditor(editor: any): OutlineItem[] {
	if (!editor) return [];
	const doc = editor.state.doc;

	const items: OutlineItem[] = [];
	let headingIndex = 0;

	doc.descendants((node: any, pos: number) => {
		if (node.type?.name !== "heading") return;
		const level = Number(node.attrs?.level ?? 1);
		if (level < 1 || level > 3) return;

		const text = normalizeHeadingText(node.textContent || "");
		headingIndex += 1;

		const idFromAttrs = node.attrs?.["data-heading-id"];
		const id = typeof idFromAttrs === "string" && idFromAttrs.length > 0 ? idFromAttrs : buildFallbackHeadingId(level, text, headingIndex);

		items.push({
			id,
			level,
			text: text || "Untitled section",
			pos,
			nodeSize: node.nodeSize,
			endPos: pos, // overwritten below
		});
	});

	// Compute endPos for each heading: next heading of same-or-higher level, else doc end.
	const docEnd = doc.content.size;
	for (let i = 0; i < items.length; i++) {
		let end = docEnd;

		for (let j = i + 1; j < items.length; j++) {
			if (items[j].level <= items[i].level) {
				end = items[j].pos;
				break;
			}
		}

		items[i].endPos = end;
	}

	return items;
}

export function loadCollapsedSet(noteId: string) {
	if (!hasWindow()) return new Set<string>();
	try {
		const raw = localStorage.getItem(COLLAPSE_KEY(noteId));
		const parsed = raw ? safeJsonParse<string[]>(raw) : null;
		const arr = Array.isArray(parsed) ? parsed : [];
		return new Set(arr.filter((x) => typeof x === "string"));
	} catch {
		return new Set<string>();
	}
}

export function saveCollapsedSet(noteId: string, set: Set<string>) {
	if (!hasWindow()) return;
	try {
		localStorage.setItem(COLLAPSE_KEY(noteId), JSON.stringify(Array.from(set)));
	} catch {
		// ignore
	}
}

export function jumpToOutlineItem(editor: any, item: OutlineItem) {
	if (!editor) return;
	editor.chain().focus().setTextSelection(item.pos + 1).run();
}

export function setSectionParam(sectionId: string) {
	if (!hasWindow()) return;
	try {
		const url = new URL(window.location.href);
		url.searchParams.set("section", sectionId);
		window.history.replaceState({}, "", url.toString());
	} catch {
		// ignore
	}
}

export function copySectionLink(sectionId: string) {
	if (!hasWindow()) return;
	try {
		const url = new URL(window.location.href);
		url.searchParams.set("section", sectionId);
		navigator.clipboard.writeText(url.toString()).catch(() => {});
	} catch {
		// ignore
	}
}