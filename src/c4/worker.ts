import { parseArchitecture, type ArchitectureModel } from './adapter';
import { layoutView } from './layout';

let current: ArchitectureModel | undefined;
let version = 0;

self.onmessage = (
  event: MessageEvent<
    | { type: 'parse'; version: number; source: string }
    | { type: 'layout'; version: number; key: string }
  >,
) => {
  const request = event.data;
  try {
    if (request.type === 'parse') {
      version = request.version;
      const outcome = parseArchitecture(request.source);
      current = outcome.model;
      self.postMessage({ type: 'parsed', version, outcome });
    } else if (request.version === version && current) {
      const view = current.views.find(
        (candidate) => candidate.key === request.key,
      );
      if (view)
        self.postMessage({
          type: 'layout',
          version,
          key: view.key,
          layout: layoutView(current, view),
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'failure',
      version: request.version,
      message: String(error),
    });
  }
};
