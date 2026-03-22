import { Extension } from "@tiptap/core";
import { createCollapsePlugin, type HeadingPos } from "@/components/editor/collapsePlugin";

export const CollapseExtension = Extension.create<{
	getState: () => { collapsedIds: Set<string>; headings: HeadingPos[] };
}>({
	name: "cortexCollapse",
	addProseMirrorPlugins() {
		return [createCollapsePlugin(this.options.getState)];
	},
});