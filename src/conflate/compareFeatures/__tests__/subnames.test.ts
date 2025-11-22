import { describe, expect, it } from 'vitest';
import { checkSubNameForMissingMacrons } from '../subnames.js';

describe(checkSubNameForMissingMacrons, () => {
  it.each`
    osmSubName        | nzgb               | output
    ${'Ōtāhuhu'}      | ${'Ōtāhuhu River'} | ${undefined /* expected 2, got 2 */}
    ${'ŌtāhuHu'}      | ${'Ōtāhuhu River'} | ${undefined /* expected 2, got 2 (case insenstive) */}
    ${'Ōtahuhu'}      | ${'Ōtāhuhu River'} | ${'Ōtāhuhu' /* expected 2, got 1 */}
    ${'ŌtahuhU'}      | ${'Ōtāhuhu River'} | ${'Ōtāhuhu' /* expected 2, got 1 (case insenstive) */}
    ${'Otahuhu'}      | ${'Ōtāhuhu River'} | ${'Ōtāhuhu' /* expected 2, got 0 */}
    ${'otahUhu'}      | ${'Ōtāhuhu River'} | ${'Ōtāhuhu' /* expected 2, got 0 (case insenstive) */}
    ${'Otahuhu'}      | ${'Otahuhu Hill'}  | ${undefined /* expected 0, got 0 */}
    ${'OtaHUhu'}      | ${'Otahuhu Hill'}  | ${undefined /* expected 0, got 0 (case insenstive) */}
    ${'Ōtāhuhu'}      | ${'Otahuhu Hill'}  | ${undefined /* expected 0, got 1 */}
    ${'ŌtāhuHu'}      | ${'Otahuhu Hill'}  | ${undefined /* expected 0, got 1 (case insenstive) */}
    ${'Ōtāhuhu'}      | ${'Otāhuhu Hill'}  | ${'Otāhuhu' /* expected 1, got 2 */}
    ${'ŌtāhuHU'}      | ${'Otāhuhu Hill'}  | ${'Otāhuhu' /* expected 1, got 2 (case insenstive) */}
    ${'ŌtāhuHU'}      | ${'Otāhuhu Hill'}  | ${'Otāhuhu' /* expected 1, got 2 (case insenstive) */}
    ${'Saint Peters'} | ${'St Peters'}     | ${undefined /* normaliseTrivialNameDifferences */}
    ${'St. Peters'}   | ${'Saint Peters'}  | ${undefined /* normaliseTrivialNameDifferences */}
    ${'Saint Peters'} | ${'St. Peters'}    | ${undefined /* normaliseTrivialNameDifferences */}
    ${'St Peters'}    | ${'St. Peters'}    | ${undefined /* normaliseTrivialNameDifferences */}
  `(
    'given $osmSubName and $nzgb, suggests $output',
    ({ osmSubName, nzgb, output }) => {
      expect(checkSubNameForMissingMacrons(nzgb, osmSubName)).toStrictEqual(
        output,
      );
    },
  );
});
