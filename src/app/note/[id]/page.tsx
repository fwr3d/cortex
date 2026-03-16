import NoteClient from "./NoteClient";

export default async function Page({ params }: { params: { id: string } }) {
	return <NoteClient noteId={params.id} />;
}