import { type JSX, splitProps } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";

type NativeFileInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "aria-hidden" | "class" | "onChange" | "tabIndex" | "type"
>;

export interface ToolFilePickerProps extends NativeFileInputProps {
  label?: string;
  buttonClass?: string;
  onFileChange?: (file: File) => void;
}

export default function ToolFilePicker(props: ToolFilePickerProps) {
  const [local, inputProps] = splitProps(props, ["buttonClass", "label", "onFileChange"]);
  let inputElement: HTMLInputElement | undefined;

  function handleChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      local.onFileChange?.(file);
    }
    input.value = "";
  }

  return (
    <>
      <ToolActionButton
        variant="secondary"
        onClick={() => inputElement?.click()}
        class={local.buttonClass}
      >
        {local.label ?? "Open file"}
      </ToolActionButton>
      <input
        {...inputProps}
        ref={(element) => {
          inputElement = element;
        }}
        type="file"
        aria-label={local.label ?? "Open file"}
        tabindex={-1}
        class="sr-only"
        onChange={handleChange}
      />
    </>
  );
}
