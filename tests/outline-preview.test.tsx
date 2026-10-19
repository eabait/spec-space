// @vitest-environment jsdom
import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Preview, type PreviewHandle } from '../src/Preview';
import { extractOutline, outlineTargetId } from '../src/outline';

it('assigns the outline source positions to rendered headings and navigates to the exact duplicate', () => {
  const content =
    '\uFEFF---\ntitle: Test\n---\n\n# Overview\n\n## Details\n\n# Overview\n';
  const sections = extractOutline(content);
  const ref = createRef<PreviewHandle>();
  const scrollIntoView = vi.fn();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  render(<Preview ref={ref} content={content} onLink={() => {}} />);

  const headings = screen.getAllByRole('heading', {
    name: 'Overview',
    level: 1,
  });
  expect(document.getElementById(outlineTargetId(sections[0].offset))).toBe(
    headings[0],
  );
  expect(document.getElementById(outlineTargetId(sections[1].offset))).toBe(
    headings[1],
  );
  act(() => ref.current?.scrollToOffset(sections[1].offset));
  expect(scrollIntoView).toHaveBeenCalledWith({
    block: 'start',
    behavior: 'smooth',
  });
  expect(document.activeElement).toBe(headings[1]);
});
