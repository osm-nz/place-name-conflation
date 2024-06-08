export type Config = {
  allowInconsistentDiacritics: {
    [nzgbId: string]: string;
  };
  overrides: {
    [nzgbId: string]: string;
  };
  ignore: {
    [nzgbId: string]: string;
  };
};
