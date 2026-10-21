// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Preview } from '../src/Preview';

it('keeps GFM table content inside a labelled, locally scrollable region', () => {
  render(
    <Preview
      content={[
        '| Sponsor | Responsibility | Notes |',
        '| --- | :---: | ---: |',
        '| Product Owner | Leads decisions for the customer team | TBD pending discovery |',
        '| IT owner | Coordinates identity, network, and platform reviews | See RFQ section 6.3 |',
      ].join('\n')}
      onLink={() => {}}
    />,
  );

  const region = screen.getByRole('region', { name: 'Scrollable table' });
  expect(region.getAttribute('tabindex')).toBe('0');
  const table = within(region).getByRole('table');
  for (const cell of [
    ...within(table).getAllByRole('columnheader'),
    ...within(table).getAllByRole('cell'),
  ]) {
    expect((cell as HTMLElement).style.textAlign).toBe('left');
  }
  expect(
    within(table).getByRole('columnheader', { name: 'Sponsor' }),
  ).toBeTruthy();
  expect(
    within(table).getByRole('cell', {
      name: 'Leads decisions for the customer team',
    }),
  ).toBeTruthy();
  expect(within(table).getAllByRole('row')).toHaveLength(3);
});
