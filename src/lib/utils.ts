export function safeJsonParse<T>(raw: string): T | null {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export function nowIso() {
	return new Date().toISOString();
}

export function newId() {
	return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function stableHash(str: string) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
	}
	return Math.abs(h >>> 0);
}
