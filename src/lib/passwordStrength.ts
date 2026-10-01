import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as common } from "@zxcvbn-ts/language-common";
import { dictionary as english, translations } from "@zxcvbn-ts/language-en";

const estimator = new ZxcvbnFactory({
  translations,
  graphs: adjacencyGraphs,
  dictionary: { ...common, ...english },
});
export interface PasswordEstimate {
  score: number;
  guessesLog10: number;
  warning: string;
  suggestions: string[];
}
export function estimatePassword(password: string): PasswordEstimate | null {
  if (!password) return null;
  if (password.length > 256)
    throw new Error("Use at most 256 characters. Longer passwords are not evaluated or truncated.");
  const result = estimator.check(password);
  return {
    score: result.score,
    guessesLog10: result.guessesLog10,
    warning: result.feedback.warning ?? "",
    suggestions: result.feedback.suggestions,
  };
}
