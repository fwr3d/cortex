import type { CourseParse } from "./types";

export function parseCollegeCourse(input: string): CourseParse | null {
	const raw = input.trim();
	if (!raw) return null;

	const cleaned = raw.replace(/\s+/g, " ");
	const m = cleaned.match(
		/^([A-Za-z]{2,6})\s*[- ]?\s*(\d{2,4}[A-Za-z]?)\s*(?:[-:–]\s*(.+))?$/,
	);
	if (!m) return null;

	const subject = m[1].toUpperCase();
	const number = m[2];
	const title = String(m[3] ?? "").trim();
	return { subject, number, title: title || "" };
}

export function formatCollegeCourse(subject: string, number: string, title?: string) {
	const subj = subject.trim().toUpperCase();
	const num = number.trim();
	const t = String(title ?? "").trim();
	return t ? `${subj} ${num} - ${t}` : `${subj} ${num}`;
}