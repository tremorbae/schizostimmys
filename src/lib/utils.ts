// Shared validation utilities
export const validateWallet = (wallet: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
};

export const validateTwitter = (twitter: string): boolean => {
  return twitter.length >= 1 && twitter.length <= 15 && /^[a-zA-Z0-9_]+$/.test(twitter);
};

export const validatePhase2Code = (code: string): boolean => {
  return code.length === 5 && /^69[a-zA-Z0-9]{3}$/.test(code);
};

export const normalizeTwitter = (twitter: string) => twitter.trim().toLowerCase();
export const normalizeWallet = (wallet: string) => wallet.trim().toLowerCase();
