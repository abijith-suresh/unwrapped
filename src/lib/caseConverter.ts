export interface CaseVariants {
  lowercase: string;
  uppercase: string;
  camelCase: string;
  pascalCase: string;
  snakeCase: string;
  kebabCase: string;
  constantCase: string;
  dotCase: string;
  pathCase: string;
  sentenceCase: string;
  headerCase: string;
}

function splitIntoWords(input: string): string[] {
  const normalized = input
    .replace(/([\p{Ll}\p{Nd}])([\p{Lu}])/gu, "$1 $2")
    .replace(/([\p{Lu}])(\p{Lu}[\p{Ll}])/gu, "$1 $2")
    .replace(/([\p{L}])(\p{Nd})/gu, "$1 $2")
    .replace(/(\p{Nd})(\p{L})/gu, "$1 $2")
    .replace(/[^\p{L}\p{Nd}]+/gu, " ")
    .trim();

  if (normalized.length === 0) {
    return [];
  }

  return normalized
    .split(/\s+/)
    .map((word) => word.toLocaleLowerCase())
    .filter((word) => word.length > 0);
}

function capitalize(word: string): string {
  return word.length === 0 ? word : `${word[0].toLocaleUpperCase()}${word.slice(1)}`;
}

function joinWords(words: string[], separator: string): string {
  return words.join(separator);
}

function buildCamelCase(words: string[]): string {
  const [first = "", ...rest] = words;
  return `${first}${rest.map(capitalize).join("")}`;
}

function buildPascalCase(words: string[]): string {
  return words.map(capitalize).join("");
}

export function convertCaseVariants(input: string): CaseVariants {
  const words = splitIntoWords(input);

  if (words.length === 0) {
    return {
      lowercase: "",
      uppercase: "",
      camelCase: "",
      pascalCase: "",
      snakeCase: "",
      kebabCase: "",
      constantCase: "",
      dotCase: "",
      pathCase: "",
      sentenceCase: "",
      headerCase: "",
    };
  }

  const lowercase = joinWords(words, " ");
  const uppercase = lowercase.toLocaleUpperCase();

  return {
    lowercase,
    uppercase,
    camelCase: buildCamelCase(words),
    pascalCase: buildPascalCase(words),
    snakeCase: joinWords(words, "_"),
    kebabCase: joinWords(words, "-"),
    constantCase: joinWords(words, "_").toLocaleUpperCase(),
    dotCase: joinWords(words, "."),
    pathCase: joinWords(words, "/"),
    sentenceCase: `${capitalize(words[0])}${words.length > 1 ? ` ${words.slice(1).join(" ")}` : ""}`,
    headerCase: words.map(capitalize).join("-"),
  };
}
