import ts from 'typescript';

export const parseJsonc = async (fileContent: string) => {
  // using the TypeScript compiler's API since it can parse jsonc without adding another dependency
  const { config, error } = ts.readConfigFile('irrelevant', () => fileContent);
  if (error) throw new Error(JSON.stringify(error.messageText));

  return config;
};
