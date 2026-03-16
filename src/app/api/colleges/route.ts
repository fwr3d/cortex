import { NextResponse } from "next/server";

type CollegeSuggestion = {
	id: string;
	name: string;
	city: string;
	state: string;
	label: string;
};

type ScorecardRow = {
	id?: number | string;
	"school.name"?: string;
	"school.city"?: string;
	"school.state"?: string;
};

type ScorecardResponse = {
	results?: ScorecardRow[];
};

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const q = String(searchParams.get("q") ?? "").trim();

	if (q.length < 2) {
		return NextResponse.json({ results: [] as CollegeSuggestion[] });
	}

	const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ error: "Missing COLLEGE_SCORECARD_API_KEY" }, { status: 500 });
	}

	const url = new URL("https://api.data.gov/ed/collegescorecard/v1/schools");
	url.searchParams.set("api_key", apiKey);
	url.searchParams.set("school.name", q);
	url.searchParams.set("fields", "id,school.name,school.city,school.state");
	url.searchParams.set("per_page", "10");

	try {
		const res = await fetch(url.toString(), { cache: "no-store" });

		if (!res.ok) {
			return NextResponse.json(
				{ error: `CollegeScorecard request failed (${res.status})` },
				{ status: 502 },
			);
		}

		const json: ScorecardResponse = (await res.json()) as ScorecardResponse;
		const resultsRaw: ScorecardRow[] = Array.isArray(json.results) ? json.results : [];

		const results: CollegeSuggestion[] = resultsRaw
			.map((r): CollegeSuggestion | null => {
				const id = r.id === undefined ? "" : String(r.id);
				const name = String(r["school.name"] ?? "");
				const city = String(r["school.city"] ?? "");
				const state = String(r["school.state"] ?? "");

				if (!id || !name) return null;

				return {
					id,
					name,
					city,
					state,
					label: `${name} - ${city}, ${state}`.trim(),
				};
			})
			.filter((r): r is CollegeSuggestion => r !== null);

		return NextResponse.json({ results });
	} catch {
		return NextResponse.json({ error: "CollegeScorecard request failed" }, { status: 502 });
	}
}