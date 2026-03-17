import NoteClient from "./NoteClient";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function NotePage({ params }: PageProps) {
	const { id } = await params;
	return <NoteClient noteId={id} />;
}