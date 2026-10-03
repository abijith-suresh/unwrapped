import { type JSX, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import ToolDownloadButton from "@/components/ToolDownloadButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolCodeBlock from "@/components/tool/ToolCodeBlock";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolPanel, {
  TOOL_EDITOR_BODY_CLASSES,
  TOOL_EDITOR_PANEL_CLASSES,
} from "@/components/tool/ToolPanel";
import type { CodeHighlightSegment } from "@/lib/codeHighlight";
import type { TextDownloadOptions } from "@/lib/download";

export interface ToolOutputPanelProps {
  title: string;
  value: string;
  isExample?: boolean;
  showExampleNotice?: boolean;
  error?: string;
  errorId?: string;
  copyLabel?: string;
  download?: TextDownloadOptions | false;
  actions?: JSX.Element;
  compact?: boolean;
  segments?: readonly CodeHighlightSegment[];
}

export default function ToolOutputPanel(props: ToolOutputPanelProps) {
  return (
    <ToolPanel
      title={props.title}
      class={props.compact ? undefined : TOOL_EDITOR_PANEL_CLASSES}
      bodyClass={props.compact ? undefined : TOOL_EDITOR_BODY_CLASSES}
      actions={
        <>
          <ToolExampleNotice when={!!props.isExample && props.showExampleNotice !== false} />
          <Show when={!props.isExample && !props.error && props.value}>
            {props.actions ?? (
              <CopyButton text={props.value} label={props.copyLabel ?? "Copy output"} compact />
            )}
            <Show when={props.download !== false}>
              <ToolDownloadButton
                value={props.value}
                {...(props.download || {})}
                compact
                label={`Download ${props.title.toLowerCase()}`}
              />
            </Show>
          </Show>
        </>
      }
    >
      <Show
        when={!props.error}
        fallback={
          <ToolStatusMessage id={props.errorId} tone="error">
            {props.error}
          </ToolStatusMessage>
        }
      >
        <ToolCodeBlock
          fill={!props.compact}
          class={
            props.compact
              ? "!min-h-0 whitespace-pre-wrap break-all"
              : "whitespace-pre-wrap break-words"
          }
          segments={props.segments}
          aria-label={props.title}
        >
          {props.value || "—"}
        </ToolCodeBlock>
      </Show>
    </ToolPanel>
  );
}
