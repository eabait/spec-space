import { generateDefaultViews } from '../src/c4/upstream/dsl/auto-views';
import { parse } from '../src/c4/upstream/dsl/parser';

export function parseDSL(source: string) {
  const result = parse(source);
  generateDefaultViews(result.workspace);
  return result;
}
