// scratchpad.ts
type Flashcard = {
	front: string
	back: string
	tag?: string
}

export function makeFlashcardsFromNotes(note: string): Flashcard[] {
	const lines = note
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0)

	const cards: Flashcard[] = []

	for (const line of lines) {
		const colonIndex = line.indexOf(":")
		if (colonIndex !== -1) {
			const term = line.slice(0, colonIndex).trim()
			const def = line.slice(colonIndex + 1).trim()

			if (term && def) {
				cards.push({
					front: `Define: ${term}`,
					back: def,
					tag: "definition",
				})
				continue
			}
		}

		cards.push({
			front: `Quick recall: what does this mean?`,
			back: line,
			tag: "concept",
		})
	}

	return cards
}

export function shuffle<T>(arr: T[]): T[] {
	const copy = [...arr]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

const sampleNotes = `
Spaced repetition: reviewing at increasing intervals improves retention.
Active recall: retrieving from memory beats rereading.
Interleaving: mixing topics improves transfer.
`

const cards = makeFlashcardsFromNotes(sampleNotes)
const queue = shuffle(cards)

console.log(`generated ${cards.length} cards\n`)
for (const c of queue) {
	console.log("Q:", c.front)
	console.log("A:", c.back)
	console.log("---")
}