export interface TokenGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export interface TokenGenerationSuccess {
  ok: true;
  token: string;
  alphabet: string;
}

export interface TokenGenerationFailure {
  ok: false;
  error: string;
}

export type TokenGenerationResult = TokenGenerationSuccess | TokenGenerationFailure;
export type RandomByteSource = (length: number) => Uint8Array;

export const MIN_TOKEN_LENGTH = 1;
export const MAX_TOKEN_LENGTH = 512;
export const SYMBOL_ALPHABET = '!"#$%&()*+,-./:;<=>?@[\\]^_{|}~';

export const DEFAULT_TOKEN_OPTIONS: TokenGeneratorOptions = {
  length: 32,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: false,
};

function defaultRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function normalizeTokenOptions(options: TokenGeneratorOptions): TokenGeneratorOptions {
  return {
    ...options,
    length: Math.min(MAX_TOKEN_LENGTH, Math.max(MIN_TOKEN_LENGTH, Math.trunc(options.length) || 1)),
  };
}

export function buildTokenAlphabet(options: TokenGeneratorOptions): string {
  let alphabet = "";

  if (options.uppercase) {
    alphabet += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  if (options.lowercase) {
    alphabet += "abcdefghijklmnopqrstuvwxyz";
  }

  if (options.digits) {
    alphabet += "0123456789";
  }

  if (options.symbols) {
    alphabet += SYMBOL_ALPHABET;
  }

  return alphabet;
}

export function generateToken(
  input: TokenGeneratorOptions,
  randomBytes: RandomByteSource = defaultRandomBytes
): TokenGenerationResult {
  const options = normalizeTokenOptions(input);
  const alphabet = buildTokenAlphabet(options);

  if (alphabet.length === 0) {
    return {
      ok: false,
      error: "Select at least one character set.",
    };
  }

  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let token = "";

  while (token.length < options.length) {
    const remaining = options.length - token.length;
    const bytes = randomBytes(remaining);

    for (const byte of bytes) {
      if (byte >= limit) {
        continue;
      }

      token += alphabet[byte % alphabet.length];

      if (token.length === options.length) {
        break;
      }
    }
  }

  return {
    ok: true,
    token,
    alphabet,
  };
}
