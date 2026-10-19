// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Preview } from '../src/Preview';
const mocks = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(true),
  png: vi.fn().mockResolvedValue([137, 80, 78, 71]),
}));
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: mocks.invoke,
}));
vi.mock('../src/diagram-image', () => ({ diagramPng: mocks.png }));
vi.mock('mermaid', () => ({
  default: {
    initialize() {},
    render: async (_id: string, source: string) => {
      if (source === 'invalid') throw new Error('Invalid diagram');
      return { svg: `<svg viewBox="0 0 100 50"><text>${source}</text></svg>` };
    },
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('exports the selected diagram with its document name and blocks stale and invalid renders', async () => {
  const source = '```mermaid\nfirst\n```\n\n```mermaid\nsecond\n```';
  const { rerender } = render(
    <Preview content={source} filename="spec.md" onLink={() => {}} />,
  );
  const save = screen.getByRole('button', {
    name: 'Save diagram 2 as PNG',
  }) as HTMLButtonElement;
  expect(save.disabled).toBe(true);
  await waitFor(() => expect(save.disabled).toBe(false));
  fireEvent.click(save);
  await screen.findByText('PNG saved.');
  expect(mocks.png.mock.calls[0][0].textContent).toBe('second');
  expect(mocks.invoke).toHaveBeenCalledWith('save_diagram_png', {
    bytes: [137, 80, 78, 71],
    filename: 'spec-diagram-2.png',
  });
  rerender(
    <Preview
      content={'```mermaid\ninvalid\n```'}
      filename="spec.md"
      onLink={() => {}}
    />,
  );
  expect(
    (
      screen.getByRole('button', {
        name: 'Copy diagram 1 as image',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await screen.findByRole('alert');
  expect(
    (
      screen.getByRole('button', {
        name: 'Copy diagram 1 as image',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
