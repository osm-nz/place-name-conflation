const NONSENSE = new Set([
  'Reipae. Reitu,',
  'Policy',
  'Hay. There',
  'English',
  'Soviet',
  'German',
  'French',
  'United',
  'American',
  'original',
  'family',
  'Airman',
]);
// maintaining a list of overrides here is probably a crap idea. Better to manually enter the
// right data into OSM and then the system can ignore that entry.
const OVERRIDES: Record<number, string | undefined> = {
  14837: 'RV Tangaroa',
  14838: 'RV Tangaroa',
  31103: 'Johann Wolfgang von Goethe',
  44138: undefined,
};

const TITLES = new Set(
  'Mr Lt Capt Prof Cdt Dr Mrs Miss Ms Mr Col Lieut Rev Hon Cdr Cmdr Comm CMSgt S/Sgt Sgt Maj St Brig Gen Jr Jnr Co III Adm Commander'
    .toLowerCase()
    .split(' '),
);

// this first regex is based on the convinient fact that english capitalizes
// all proper nouns. This makes it trivial to find the end of the name.
// There are a few excepts like `and` and `von`
const REGEX_1 =
  /(N|n)amed (it )?(by .*?)?(after|for|in (honour|memory) of)(( (["(A-ZĀĒĪŌŪ“]|the|von|and|or|of|family)[")./A-Za-zäöøüĀāĒēĪīŌōŪū”-]*)+)/;

const isCrap = (match: string, name: string) =>
  match.length < 6 || // very short results are probably not meaningful
  name.includes(match) || // if the final result is just a substring of the name, it's not insightful and not worth tagging
  NONSENSE.has(match);

export function parseNameEtymology(
  _info: string,
  name: string,
  ref: number,
): string | 0xbad | undefined {
  if (ref in OVERRIDES) return OVERRIDES[ref];

  let info = _info;
  const infoLower = info.toLowerCase();

  // this description has no information about name etymologies
  if (!infoLower.includes('named')) return 0xbad;

  // this is a non-meaningful etymology e.g. "Akaroa Post Office" is named after "Akaroa"
  if (infoLower.includes('in association with')) return 0xbad;
  if (infoLower.includes('in assocation with')) return 0xbad; // 17 typos in the dataset...

  // if the string is in the format `'XXX' Source: YYY` then keep only the XXX part
  if (info.includes("' Source:") && info[0] === "'") {
    [info] = info.slice(1).split("' Source:");
  }

  let match1 = info.match(REGEX_1)?.[6].trim();
  if (match1 && !isCrap(match1, name)) {
    // we only allow "." if it's for someone's initials, not if it's a full stop.
    // We have to do this outside the regex to avoid making the regex really complex
    // This converts `J.H. B. Buttress. Who was from Wellington` into `J.H. B. Buttress`
    for (let index = 0; index < match1.length; index += 1) {
      if (match1[index] === '.') {
        const wordBeforeDot = match1
          .slice(0, index)
          .split(/([ (.])/)
          .at(-1)!;
        const wordIsOkay =
          wordBeforeDot.length === 1 || TITLES.has(wordBeforeDot.toLowerCase());
        if (!wordIsOkay) {
          // console.log('\tRejected', wordBeforeDot);
          match1 = match1.slice(0, index);
        }
      }
    }

    if (match1.endsWith('.')) match1 = match1.slice(0, -1);
    if (match1.endsWith('(')) match1 = match1.slice(0, -1);
    if (match1.startsWith('"') && match1.endsWith('"')) {
      match1 = match1.slice(1).slice(0, -1);
    }
    if (match1.startsWith('the ')) match1 = match1.replace(/^the /, '');

    // brackets don't add up
    const openBracesCount = match1.match(/\(/g)?.length || 0;
    const closeBracesCount = match1.match(/\)/g)?.length || 0;
    if (openBracesCount !== closeBracesCount) {
      // E.g. "John (F.) Smith (captian of " so we split at the last open braces
      match1 = match1.slice(0, match1.lastIndexOf('('));
    }

    // if the result is unexpectedly long, it's probably `NAME of the JOB_DESC` so
    // trim out the rest if it contains ' of the '
    if (match1.length > 45 && match1.includes(' of the ')) {
      [match1] = match1.split(' of the ');
    }

    match1 = match1.trim();

    // if this happens we cleaned up the result so much that we've broken it...
    if (isCrap(match1, name)) return undefined;

    return match1;
  }

  // if we get to here, none of the regexes worked, so mark this entry as failed

  return undefined;
}
