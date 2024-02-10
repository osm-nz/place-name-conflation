import { maybeTeReoName } from '../maybeTeReoName';
import type { TempName } from '../preprocessNZGB';

const $ = (...names: string[]): TempName[] =>
  names.map((name) => ({
    name,
    teReo: true,
    ref: 0,
    status: 'O',
    etymology: undefined,
  }));

describe('maybeTeReoName', () => {
  it.each`
    officialNames                                            | output
    ${$('Fox Glacier / Te Moeka o Tuawe')}                   | ${'Te Moeka o Tuawe'}
    ${$('Lake Tekapo / Takapo')}                             | ${'Tekapo' /* not ideal */}
    ${$('Lake Tekapo / Takapō')}                             | ${'Takapō'}
    ${$('Jericho')}                                          | ${undefined}
    ${$('Borough of Little Karapiro Downs Railway Station')} | ${'Karapiro'}
    ${$('Te Atatū South')}                                   | ${undefined /* because of the banned suffix */}
    ${$('Whanganui', 'Wanganui')}                            | ${'Whanganui'}
    ${$()}                                                   | ${undefined}
  `(
    'deduces that $output is the te reo name for $officialNames.0.name',
    ({ officialNames, output }) => {
      expect(maybeTeReoName(officialNames)).toBe(output);
    },
  );
});
