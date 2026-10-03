import { CircleAlert, Download } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import { downloadBlob, downloadText, type TextDownloadOptions } from "@/lib/download";

interface Props extends TextDownloadOptions {
  value?: string;
  blob?: Blob;
  label?: string;
  compact?: boolean;
}

export default function ToolDownloadButton(props: Props) {
  const [failed, setFailed] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  const label = () => props.label ?? "Download output";
  function download() {
    clearTimeout(timer);
    try {
      if (props.blob) downloadBlob(props.blob, props.fileName ?? "output.bin");
      else downloadText(props.value ?? "", props);
      setFailed(false);
    } catch {
      setFailed(true);
      timer = setTimeout(() => setFailed(false), 2_000);
    }
  }
  return (
    <>
      <ToolActionButton
        onClick={download}
        disabled={!props.value && !props.blob}
        aria-label={label()}
        title={label()}
        class={props.compact ? "px-3 sm:px-3.5" : undefined}
      >
        {failed() ? (
          <CircleAlert size={16} aria-hidden="true" />
        ) : (
          <Download size={16} aria-hidden="true" />
        )}
        <span class={props.compact ? "hidden sm:inline" : undefined}>
          {failed() ? "Retry download" : "Download"}
        </span>
      </ToolActionButton>
      <span class="sr-only" role="status" aria-live="polite">
        {failed() ? "Could not download the output. Try again." : ""}
      </span>
    </>
  );
}
