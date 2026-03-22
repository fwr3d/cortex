import Heading from "@tiptap/extension-heading";
import { Plugin, PluginKey } from "prosemirror-state";

export const collapsibleHeadingPluginKey = new PluginKey("collapsibleHeadingUi");

export const CollapsibleHeading = Heading.extend({
	name: "heading",

	addAttributes() {
		return {
			...this.parent?.(),
			"data-heading-id": {
				default: null,
				parseHTML: (element) => element.getAttribute("data-heading-id"),
				renderHTML: (attrs) => {
					if (!attrs["data-heading-id"]) return {};
					return { "data-heading-id": attrs["data-heading-id"] };
				},
			},
		};
	},

	addProseMirrorPlugins() {
		const base = this.parent?.() ?? [];
		return [
			...base,
			new Plugin({
				key: collapsibleHeadingPluginKey,
			}),
		];
	},

	addNodeView() {
		const getIsCollapsed = (this.options as any)?.getIsCollapsed as ((id: string) => boolean) | undefined;
		const onToggle = (this.options as any)?.onToggle as ((id: string) => void) | undefined;

		return ({ node, getPos, editor }) => {
			let dom = document.createElement(`h${node.attrs.level || 1}`);
			dom.style.position = "relative";
			dom.style.paddingLeft = "30px";
			dom.style.minHeight = "28px";

			const btn = document.createElement("button");
			btn.type = "button";
			btn.setAttribute("data-collapse-btn", "true");

			btn.style.position = "absolute";
			btn.style.left = "0px";
			btn.style.top = "50%";
			btn.style.transform = "translateY(-50%)";

			btn.style.width = "22px";
			btn.style.height = "22px";
			btn.style.display = "inline-flex";
			btn.style.alignItems = "center";
			btn.style.justifyContent = "center";

			btn.style.border = "1px solid rgba(255,255,255,0.14)";
			btn.style.background = "rgba(0,0,0,0.22)";
			btn.style.color = "rgba(236,254,255,0.9)";
			btn.style.borderRadius = "10px";
			btn.style.cursor = "pointer";
			btn.style.fontWeight = "900";
			btn.style.fontSize = "14px";
			btn.style.lineHeight = "1";

			// Always visible
			btn.style.opacity = "1";
			btn.style.pointerEvents = "auto";

			// ProseMirror-owned content must be separate from the button.
			const contentDOM = document.createElement("span");
			contentDOM.style.display = "inline";

			function ensureId(updatedNode: any) {
				const existing = updatedNode.attrs?.["data-heading-id"];
				if (typeof existing === "string" && existing.length > 0) {
					dom.setAttribute("data-heading-id", existing);
					btn.setAttribute("data-heading-id", existing);
					return existing;
				}

				const pos = typeof getPos === "function" ? (getPos() ?? 0) : 0;
				const nextId = `h-${pos}`;

				editor
					.chain()
					.command(({ tr }) => {
						tr.setNodeMarkup(pos, undefined, {
							...updatedNode.attrs,
							"data-heading-id": nextId,
						});
						return true;
					})
					.run();

				dom.setAttribute("data-heading-id", nextId);
				btn.setAttribute("data-heading-id", nextId);
				return nextId;
			}

			function isCollapsedNow(): boolean {
				const id = dom.getAttribute("data-heading-id") ?? "";
				if (!id || !getIsCollapsed) return false;
				return !!getIsCollapsed(id);
			}

			function updateButton() {
				const collapsed = isCollapsedNow();
				btn.textContent = collapsed ? "+" : "−";
				btn.setAttribute("aria-label", collapsed ? "Expand section" : "Collapse section");
			}

			btn.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();

				const id = btn.getAttribute("data-heading-id");
				if (!id) return;

				if (onToggle) onToggle(id);

				// Force decorations to recompute now
				editor.view.dispatch(editor.view.state.tr);

				// Re-sync label after state settles
				setTimeout(() => updateButton(), 0);
				setTimeout(() => updateButton(), 50);
			});

			dom.appendChild(btn);
			dom.appendChild(contentDOM);

			ensureId(node);
			updateButton();

			return {
				dom,
				contentDOM,
				update(updatedNode) {
					if (updatedNode.type.name !== "heading") return false;

					const nextLevel = updatedNode.attrs.level || 1;
					const nextTag = `h${nextLevel}`;

					if (dom.tagName.toLowerCase() !== nextTag) {
						const nextDom = document.createElement(nextTag);

						nextDom.style.position = dom.style.position;
						nextDom.style.paddingLeft = dom.style.paddingLeft;
						nextDom.style.minHeight = dom.style.minHeight;

						nextDom.appendChild(btn);
						nextDom.appendChild(contentDOM);

						dom.replaceWith(nextDom);
						dom = nextDom;
					}

					ensureId(updatedNode);
					updateButton();
					return true;
				},
			};
		};
	},
});