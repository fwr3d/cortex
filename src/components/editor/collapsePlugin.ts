import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export type HeadingPos = {
	id: string;
	level: number; // 1-3
	pos: number; // expected position of heading node
	nodeSize: number; // may be stale, do not trust
	endPos: number; // may be stale, do not trust
};

export const collapsePluginKey = new PluginKey("cortexCollapse");

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

export function createCollapsePlugin(getState: () => { collapsedIds: Set<string>; headings: HeadingPos[] }) {
	return new Plugin({
		key: collapsePluginKey,
		props: {
			decorations(state) {
				const snapshot = getState?.();
				const collapsedIds = snapshot?.collapsedIds;
				const headings = snapshot?.headings;

				if (!collapsedIds || collapsedIds.size === 0) return null;
				if (!headings || headings.length === 0) return null;

				const doc = state.doc;

				// ProseMirror doc positions are valid in [0, doc.content.size]
				// Using doc.content.size here avoids out-of-range errors.
				const docMax = doc.content.size;

				const decos: Decoration[] = [];

				for (const h of headings) {
					if (!collapsedIds.has(h.id)) continue;

					// Clamp heading pos/endPos to current doc bounds
					const headingPos = clamp(Number(h.pos) || 0, 0, docMax);
					const endPos = clamp(Number(h.endPos) || 0, 0, docMax);

					// Resolve the *actual* node at the stored position.
					// If it does not exist anymore (stale outline), skip safely.
					const headingNode = doc.nodeAt(headingPos);
					if (!headingNode) continue;
					if (headingNode.type?.name !== "heading") continue;

					const from = clamp(headingPos + headingNode.nodeSize, 0, docMax);
					const to = clamp(endPos, 0, docMax);

					if (to <= from) continue;

					// Hide every block node inside the range (safe traversal).
					// nodesBetween can throw if from/to are invalid, so we clamp above.
					doc.nodesBetween(from, to, (node, pos) => {
						if (!node) return;
						if (!node.isBlock) return;
						if (pos < from) return;
						if (pos >= to) return;

						decos.push(Decoration.node(pos, pos + node.nodeSize, { style: "display:none" }));
					});
				}

				return DecorationSet.create(doc, decos);
			},
		},
	});
}