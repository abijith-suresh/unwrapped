import { createMemo, createSignal } from "solid-js";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import { useToolHandoff } from "@/components/toolHandoff";
import { convertCaseVariants } from "@/lib/caseConverter";
import { EXAMPLE_CASE_TEXT } from "@/lib/exampleData";

const VARIANT_LABELS = [
  ["lowercase", "lowercase"],
  ["uppercase", "UPPERCASE"],
  ["camelCase", "camelCase"],
  ["pascalCase", "PascalCase"],
  ["snakeCase", "snake_case"],
  ["kebabCase", "kebab-case"],
  ["constantCase", "CONSTANT_CASE"],
  ["dotCase", "dot.case"],
  ["pathCase", "path/case"],
  ["sentenceCase", "Sentence case"],
  ["headerCase", "Header-Case"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof convertCaseVariants>, string]>;

export default function CaseConverter() {
  const [input, setInput] = createSignal("");
  useToolHandoff("case-converter", (handoff) => setInput(handoff.value));
  const isExample = () => input() === "";
  const variants = createMemo(() => convertCaseVariants(input() || EXAMPLE_CASE_TEXT));
  const hasInput = createMemo(() => input().trim().length > 0);

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        input={
          <ToolInputPanel
            compact
            label="Source text"
            value={input()}
            onInput={setInput}
            placeholder={EXAMPLE_CASE_TEXT}
            rows={6}
          />
        }
        fields={
          isExample() || hasInput()
            ? VARIANT_LABELS.map(([key, label]) => ({ label, value: variants()[key] }))
            : []
        }
      />
    </ToolContainer>
  );
}
