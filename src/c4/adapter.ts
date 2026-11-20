import { parse } from './upstream/dsl/parser';
import { lex } from './upstream/dsl/lexer';
import { generateDefaultViews } from './upstream/dsl/auto-views';
import { wildcardImpliedRelationships } from './upstream/dsl/wildcard';
import type {
  ModelElement,
  Relationship,
  View,
  Workspace,
} from './upstream/model';

export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  line?: number;
  column?: number;
}

export interface ArchitectureModel {
  workspace: Workspace;
  elements: ModelElement[];
  parents: Record<string, string>;
  views: View[];
  diagnostics: Diagnostic[];
}

export interface ParseOutcome {
  model?: ArchitectureModel;
  diagnostics: Diagnostic[];
}

export function parseArchitecture(source: string): ParseOutcome {
  const input = source.replace(/^\uFEFF/, '');
  const scanned = lex(input);
  const diagnostics: Diagnostic[] = scanned.errors.map((error) => ({
    ...error,
    severity: 'error',
  }));
  const tokens = scanned.tokens.filter(
    (token) => !['COMMENT', 'NEWLINE', 'EOF'].includes(token.type),
  );
  if (tokens[0]?.value !== 'workspace') {
    diagnostics.push({
      severity: 'error',
      line: 1,
      column: 1,
      message: 'Start this document with a workspace { … } declaration.',
    });
  }
  let depth = 0;
  let opened = false;
  let rootClosed = false;
  for (const token of tokens) {
    if (rootClosed) {
      diagnostics.push({
        ...token,
        severity: 'error',
        message: 'Place every declaration inside the single workspace block.',
      });
      break;
    }
    if (token.type === 'LBRACE') {
      depth += 1;
      opened = true;
    }
    if (token.type === 'RBRACE') {
      depth -= 1;
      if (depth === 0) rootClosed = true;
    }
    if (depth < 0) {
      diagnostics.push({
        ...token,
        severity: 'error',
        message: 'Unexpected closing brace.',
      });
      break;
    }
  }
  const header = tokens.slice(
    1,
    tokens.findIndex((token) => token.type === 'LBRACE'),
  );
  if (
    header.some((token) => token.type !== 'STRING' && token.value !== 'extends')
  ) {
    diagnostics.push({
      severity: 'error',
      message:
        'Use workspace followed by an optional quoted name and description, then an opening brace.',
    });
  }
  if (!opened || depth !== 0) {
    diagnostics.push({
      severity: 'error',
      message: 'Close every DSL block with a matching brace.',
    });
  }
  for (const token of tokens) {
    const directive = token.value.startsWith('!') && token.type === 'KEYWORD';
    if (directive && token.value !== '!identifiers hierarchical') {
      diagnostics.push({
        severity: 'warning',
        line: token.line,
        column: token.column,
        message: `Unresolved directive ${token.value}. This model is incomplete. Includes, scripts, and plugins are never executed.`,
      });
    }
    if (
      [
        'extends',
        'theme',
        'themes',
        'image',
        'icon',
        'filtered',
        'custom',
        'dynamic',
        'deployment',
      ].includes(token.value) &&
      token.type !== 'STRING'
    ) {
      diagnostics.push({
        severity: 'warning',
        line: token.line,
        column: token.column,
        message: [
          'filtered',
          'custom',
          'dynamic',
          'deployment',
          'image',
        ].includes(token.value)
          ? `${token.value} is unsupported. This model has incomplete view coverage.`
          : `${token.value} is unsupported. External model and visual resources are not loaded.`,
      });
    }
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error'))
    return { diagnostics };
  try {
    const result = parse(input);
    diagnostics.push(
      ...result.errors.map((error) => ({
        ...error,
        severity: 'error' as const,
      })),
    );
    diagnostics.push(
      ...result.warnings.map((warning) => ({
        ...warning,
        severity: 'warning' as const,
        message: warning.message.replace(
          /Saving writes the file in Structurizr's format\./gi,
          'The original source buffer is preserved when saving.',
        ),
      })),
    );
    if (result.errors.length) return { diagnostics };
    const workspace = result.workspace;
    generateDefaultViews(workspace);
    const views = [
      ...workspace.views.systemLandscapeViews,
      ...workspace.views.systemContextViews,
      ...workspace.views.containerViews,
      ...workspace.views.componentViews,
    ];
    for (const view of [
      ...workspace.views.dynamicViews,
      ...workspace.views.deploymentViews,
    ]) {
      diagnostics.push({
        severity: 'warning',
        message: `View ${view.key} uses unsupported ${view.type} syntax and is unavailable.`,
      });
    }
    const keys = new Set<string>();
    for (const view of views) {
      if (keys.has(view.key))
        diagnostics.push({
          severity: 'error',
          message: `Duplicate view key ${view.key}. Give each view a unique key.`,
        });
      keys.add(view.key);
    }
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error'))
      return { diagnostics };
    const elements: ModelElement[] = [...workspace.model.people];
    const parents: Record<string, string> = Object.create(null);
    for (const system of workspace.model.softwareSystems) {
      elements.push(system);
      for (const container of system.containers) {
        elements.push(container);
        parents[container.id] = system.id;
        for (const component of container.components) {
          elements.push(component);
          parents[component.id] = container.id;
        }
      }
    }
    const model = { workspace, elements, parents, views, diagnostics };
    for (const style of workspace.views.configuration.styles.elements) {
      if (
        style.shape &&
        !['Box', 'RoundedBox', 'Circle', 'Ellipse', 'Cylinder'].includes(
          style.shape,
        )
      ) {
        diagnostics.push({
          severity: 'warning',
          message: `Element shape ${style.shape} uses a box fallback. Supported shapes are Box, RoundedBox, Circle, Ellipse, and Cylinder.`,
        });
      }
    }
    return { model, diagnostics };
  } catch (error) {
    return {
      diagnostics: [
        ...diagnostics,
        {
          severity: 'error',
          message: `Unable to parse this DSL. ${String(error)}`,
        },
      ],
    };
  }
}

export function relationshipsForView(
  model: ArchitectureModel,
  view: View,
): Relationship[] {
  const members = new Set(view.elements.map((element) => element.id));
  const declared = new Set(
    view.relationships.map((relationship) => relationship.id),
  );
  const relationships = model.workspace.model.relationships.filter(
    (relationship) =>
      declared.has(relationship.id) &&
      members.has(relationship.sourceId) &&
      members.has(relationship.destinationId),
  );
  return [
    ...relationships,
    ...wildcardImpliedRelationships(model.workspace.model, view).map(
      (implied) => ({
        ...implied.relationship,
        id: implied.id,
        sourceId: implied.sourceId,
        destinationId: implied.destinationId,
      }),
    ),
  ];
}

export function childViews(
  model: ArchitectureModel,
  element: ModelElement,
  currentView?: View,
): View[] {
  return model.views.filter((view) =>
    element.type === 'softwareSystem'
      ? view.softwareSystemId === element.id &&
        (view.type === 'container' ||
          (view.type === 'systemContext' &&
            currentView?.type === 'systemLandscape'))
      : element.type === 'container' &&
        view.type === 'component' &&
        view.containerId === element.id,
  );
}
