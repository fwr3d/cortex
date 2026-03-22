import type { OutlineItem } from "@/lib/notes/outline";

export type OutlineNode = OutlineItem & {
	children: OutlineNode[];
};

export function buildOutlineTree(items: OutlineItem[]): OutlineNode[] {
	const roots: OutlineNode[] = [];
	const stack: OutlineNode[] = [];

	for (const it of items) {
		const node: OutlineNode = { ...it, children: [] };

		while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
			stack.pop();
		}

		if (stack.length === 0) {
			roots.push(node);
		} else {
			stack[stack.length - 1].children.push(node);
		}

		stack.push(node);
	}

	return roots;
}