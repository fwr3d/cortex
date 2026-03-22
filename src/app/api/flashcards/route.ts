import { NextResponse } from "next/server";

type FlashcardSource = { quote: string };

type Flashcard = {
	front: string;
	back: string;
	sources: FlashcardSource[];
};

type ReqBody = {
	noteId: string;
	noteText: string;
	maxCards?: number;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function splitIntoCandidateSentences(text: string): string[] {
	return text
		.replace(/\r/g, "")
		.split(/\n+/)
		.map((s) => s.trim())
		.filter(Boolean)
		.flatMap((line) => line.split(/(?<=[.!?])\s+/))
		.map((s) => s.trim())
		.filter((s) => s.length >= 40);
}

/**
 * v1 stub generator:
 * - picks up to N sentences from the note
 * - creates "recall" style cards
 * - citations are exact sentences (meets guardrail)
 *
 * Replace this function with your AI call later, but keep the same output contract.
 */
function generateFlashcardsStub(noteText: string, maxCards: number): Flashcard[] {
	const sentences = splitIntoCandidateSentences(noteText);
	const picked = sentences.slice(0, maxCards);

	return picked.map((s) => ({
		front: "Recall the key idea in this excerpt.",
		back: "Try to explain it in your own words before re-reading the excerpt.",
		sources: [{ quote: s }],
	}));
}

function validateAndGate(cards: Flashcard[], requested: number) {
	const valid: Flashcard[] = [];
	for (const c of cards) {
		const sources = Array.isArray(c.sources) ? c.sources : [];
		const hasMinSource =
			sources.length >= 1 &&
			typeof sources[0]?.quote === "string" &&
			sources[0].quote.trim().length > 0;
		const hasText =
			typeof c.front === "string" &&
			c.front.trim() &&
			typeof c.back === "string" &&
			c.back.trim();
		if (!hasMinSource || !hasText) continue;

		// Best-effort target: cap sources to 2 for UI cleanliness
		valid.push({ ...c, sources: sources.slice(0, 2) });
	}

	return {
		cards: valid,
		generated: valid.length,
		skipped: Math.max(0, requested - valid.length),
	};
}

export async function POST(req: Request) {
	const body = (await req.json()) as ReqBody;

	const noteId = String(body.noteId || "");
	const noteText = String(body.noteText || "");
	const maxCards = clamp(Number(body.maxCards ?? 10), 1, 20);

	if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

	if (!noteText.trim()) {
		return NextResponse.json(
			{
				cards: [],
				generated: 0,
				skipped: maxCards,
				message: "Not enough specific information to generate trustworthy flashcards yet.",
			},
			{ status: 200 },
		);
	}

	// TODO: Replace with AI call later (keep the same output shape)
	const rawCards = generateFlashcardsStub(noteText, maxCards);
	const result = validateAndGate(rawCards, maxCards);

	if (result.generated === 0) {
		return NextResponse.json(
			{
				...result,
				message:
					"Not enough specific information to generate trustworthy flashcards yet. Add more detail, then try again.",
			},
			{ status: 200 },
		);
	}

	return NextResponse.json(
		{
			...result,
			message:
				result.skipped > 0
					? `Generated ${result.generated} flashcards. Skipped ${result.skipped} because the note did not contain enough specific information to cite.`
					: `Generated ${result.generated} flashcards.`,
		},
		{ status: 200 },
	);
}