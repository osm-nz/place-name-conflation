import type {
  RawWikidata,
  TransformedWikidata,
} from '../core/types/wikidata.def.js';

export function transformWikidata(raw: RawWikidata) {
  const out: TransformedWikidata = {};

  for (const item of raw.results.bindings) {
    const qId = item.qid.value.split('/entity/')[1]!;
    const wikipedia = item.wikipedia?.value
      ? decodeURIComponent(
          `en:${item.wikipedia.value.split('/wiki/')[1]!.replaceAll('_', ' ')}`,
        )
      : undefined;
    const etymologyQId = item.etymology?.value.split('/entity/')[1];
    const etymology = item.etymologyLabel?.value;
    const ref = +item.ref.value;

    out[ref] ||= [];
    out[ref]!.push({ nzgbRef: ref, qId, etymologyQId, etymology, wikipedia });
  }

  return out;
}
