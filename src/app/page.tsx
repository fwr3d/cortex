import * as prismic from "@prismicio/client";
import { createClient } from "../../prismicio";
import HomeClient from "./HomeClient";

export default async function Page() {
	const client = createClient();
	const doc = await client.getSingle("homepage");

	return (
		<HomeClient
			wordmarkText={String(doc.data.wordmark_text ?? "CORTEX")}
			tagline={String(doc.data.tagline ?? "the everything platform for students")}
			ctaLabel={String(doc.data.primary_btn_label ?? "Get started")}
			ctaHref={prismic.asLink(doc.data.primary_button_href) ?? "#"}
		/>
	);
}