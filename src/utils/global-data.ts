declare global {
  var idToken: string | null;
}

export {};

global.idToken = null;

export const setGlobalIdToken = (token: string | null): void => {
  global.idToken = token;
};

export const getGlobalIdToken = (): string | null => {
  return global.idToken;
};
