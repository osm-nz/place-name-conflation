export type RawWikidata = {
  results: {
    bindings: {
      qid: { type: 'uri'; value: string };
      etymology?: { type: 'uri'; value: string };
      etymologyLabel?: { type: 'literal'; value: string };
      wikipedia?: { type: 'uri'; value: string };
      ref: { type: 'literal'; value: string };
    }[];
  };
};

export type WikidataItem = {
  nzgbRef: number;
  qId: string;
  etymologyQId?: string;
  etymology?: string;
  wikipedia?: string;
};

export type TransformedWikidata = {
  [nzgbRef: number]: WikidataItem[];
};
