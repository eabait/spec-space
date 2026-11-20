import dagre from '@dagrejs/dagre';
import type { CSSProperties } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { relationshipsForView, type ArchitectureModel } from './adapter';
import type { ModelElement, View } from './upstream/model';

export interface ElementData extends Record<string, unknown> {
  label: string;
  kind: string;
  technology?: string;
  boundary: boolean;
  shape?: string;
  appearance?: CSSProperties;
}
export type ArchitectureNode = Node<ElementData>;

const safeColor = (value: string | undefined) =>
  value && /^(#[\da-f]{3,8}|[a-z]+)$/i.test(value) ? value : undefined;

function elementPresentation(
  model: ArchitectureModel,
  element: ModelElement,
): {
  style: CSSProperties;
  shape?: string;
} {
  const typeTag = {
    person: 'Person',
    softwareSystem: 'Software System',
    container: 'Container',
    component: 'Component',
  }[element.type];
  const tags = [
    'Element',
    typeTag,
    ...element.tags.filter((tag) => tag !== 'Element' && tag !== typeTag),
  ];
  const declarations = model.workspace.views.configuration.styles.elements;
  const style = Object.assign(
    {},
    ...tags.flatMap((tag) => declarations.filter((entry) => entry.tag === tag)),
  );
  return {
    shape: style.shape,
    style: {
      background: safeColor(style.background),
      color: safeColor(style.color),
      borderColor: safeColor(style.stroke),
      borderWidth: style.strokeWidth,
      borderStyle:
        style.border === 'Dashed'
          ? 'dashed'
          : style.border === 'Dotted'
            ? 'dotted'
            : undefined,
      opacity: style.opacity == null ? undefined : style.opacity / 100,
      fontSize:
        style.fontSize == null
          ? undefined
          : Math.min(24, Math.max(10, style.fontSize)),
    },
  };
}

export function layoutView(
  model: ArchitectureModel,
  view: View,
): { nodes: ArchitectureNode[]; edges: Edge[] } {
  const elements = new Map(
    model.elements.map((element) => [element.id, element]),
  );
  const members = new Set(view.elements.map((element) => element.id));
  const relationships = relationshipsForView(model, view);
  const nodes = new Map<string, ArchitectureNode>();
  const parents = new Map<string, string>();

  for (const id of members) {
    const element = elements.get(id);
    if (!element) continue;
    const presentation = elementPresentation(model, element);
    nodes.set(id, {
      id,
      type: 'architectureElement',
      position: { x: 0, y: 0 },
      width: 230,
      height: 126,
      style: { width: 230, height: 126 },
      data: {
        label: element.name,
        kind: element.type,
        technology: 'technology' in element ? element.technology : undefined,
        boundary: false,
        shape: presentation.shape,
        appearance: presentation.style,
      },
    });
  }
  for (const id of members) {
    let child = id;
    let parent = model.parents[id];
    while (parent) {
      // The parent is a boundary even when a declared view lists it alongside descendants.
      parents.set(child, parent);
      const parentElement = elements.get(parent)!;
      nodes.set(parent, {
        id: parent,
        type: 'architectureElement',
        position: { x: 0, y: 0 },
        data: {
          label: parentElement.name,
          kind: `${parentElement.type} boundary`,
          boundary: true,
        },
        style: { width: 270, height: 180 },
      });
      child = parent;
      parent = model.parents[parent];
    }
  }

  // Groups are containers for the view's visible members, never additional architecture elements.
  const groups = new Map(
    model.workspace.model.groups.map((group) => [group.id, group]),
  );
  const groupDepth = (id?: string): number =>
    id ? 1 + groupDepth(groups.get(id)?.parentId) : 0;
  for (const group of [...groups.values()].sort(
    (a, b) =>
      groupDepth(a.id) - groupDepth(b.id) ||
      b.elementIds.length - a.elementIds.length,
  )) {
    const shown = group.elementIds.filter((id) => nodes.has(id));
    if (!shown.length) continue;
    const groupId = `boundary:group:${group.id}`;
    const parentIds = new Set(shown.map((id) => parents.get(id)));
    const commonParent =
      parentIds.size === 1 ? parents.get(shown[0]) : undefined;
    nodes.set(groupId, {
      id: groupId,
      type: 'architectureElement',
      position: { x: 0, y: 0 },
      data: { label: group.name, kind: 'group', boundary: true },
      style: { width: 270, height: 180 },
    });
    if (commonParent) parents.set(groupId, commonParent);
    for (const id of shown) {
      if (parents.get(id) === commonParent) parents.set(id, groupId);
    }
  }

  const positionLevel = (parent?: string) => {
    const children = [...nodes.values()].filter(
      (node) => parents.get(node.id) === parent,
    );
    for (const node of children) if (node.data.boundary) positionLevel(node.id);
    const graph = new dagre.graphlib.Graph({ multigraph: true })
      .setGraph({
        rankdir: view.autoLayout?.direction ?? 'LR',
        nodesep: view.autoLayout?.nodeSeparation ?? 42,
        ranksep: view.autoLayout?.rankSeparation ?? 90,
        marginx: 28,
        marginy: parent ? 64 : 28,
      })
      .setDefaultEdgeLabel(() => ({}));
    for (const node of children)
      graph.setNode(node.id, {
        width: Number(node.style?.width),
        height: Number(node.style?.height),
      });
    const directChild = (id: string) => {
      let current = id;
      while (parents.has(current) && parents.get(current) !== parent)
        current = parents.get(current)!;
      return graph.hasNode(current) ? current : undefined;
    };
    for (const relationship of relationships) {
      const source = directChild(relationship.sourceId);
      const target = directChild(relationship.destinationId);
      if (source && target && source !== target)
        graph.setEdge(source, target, {}, relationship.id);
    }
    dagre.layout(graph);
    for (const node of children) {
      const point = graph.node(node.id);
      node.position = {
        x: point.x - point.width / 2,
        y: point.y - point.height / 2,
      };
      if (parents.has(node.id)) node.parentId = parents.get(node.id);
    }
    if (parent) {
      const boundary = nodes.get(parent)!;
      boundary.width = Math.max(270, graph.graph().width ?? 270);
      boundary.height = Math.max(180, graph.graph().height ?? 180);
      boundary.style = {
        ...boundary.style,
        width: boundary.width,
        height: boundary.height,
      };
    }
  };
  positionLevel();
  const ordered: ArchitectureNode[] = [];
  const append = (parent?: string) => {
    for (const node of nodes.values()) {
      if (parents.get(node.id) !== parent) continue;
      ordered.push(node);
      append(node.id);
    }
  };
  append();
  const edges: Edge[] = relationships.map((relationship) => {
    const tags = new Set(['Relationship', ...relationship.tags]);
    const style = Object.assign(
      {},
      ...model.workspace.views.configuration.styles.relationships.filter(
        (entry) => tags.has(entry.tag),
      ),
    );
    return {
      id: relationship.id,
      source: relationship.sourceId,
      target: relationship.destinationId,
      type: 'smoothstep',
      label: [relationship.description, relationship.technology]
        .filter(Boolean)
        .join(' · '),
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        stroke: safeColor(style.color) ?? '#627f81',
        strokeWidth: style.thickness ?? 1.5,
        strokeDasharray: style.dashed ? '6 4' : undefined,
        opacity: style.opacity == null ? undefined : style.opacity / 100,
      },
      labelStyle: {
        fontSize: Math.min(20, Math.max(10, style.fontSize ?? 11)),
        fill: safeColor(style.color) ?? '#324e55',
      },
    };
  });
  return { nodes: ordered, edges };
}
