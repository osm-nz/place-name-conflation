import config from 'eslint-config-kyle';

export { default } from 'eslint-config-kyle';

config.push({
  rules: {
    'unicorn/prevent-abbreviations': 'off',
  },
});
