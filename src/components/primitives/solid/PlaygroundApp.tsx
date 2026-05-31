import { createSignal } from "solid-js";
import Button from "@/components/primitives/solid/Button";
import Input from "@/components/primitives/solid/Input";
import Textarea from "@/components/primitives/solid/Textarea";
import Select from "@/components/primitives/solid/Select";
import Badge from "@/components/primitives/solid/Badge";
import Card from "@/components/primitives/solid/Card";

export default function PlaygroundApp() {
  const [name, setName] = createSignal("");
  const [framework, setFramework] = createSignal("astro");
  const [desc, setDesc] = createSignal("");

  return (
    <div class="max-w-lg">
      <Card>
        <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-4">Interactive Form</h3>
        <div class="flex flex-col gap-4">
          <Input label="Name" value={name()} onInput={setName} placeholder="Type something..." />
          <Select
            label="Framework"
            value={framework()}
            onChange={setFramework}
            options={[
              { value: "astro", label: "Astro" },
              { value: "solid", label: "SolidJS" },
              { value: "react", label: "React" },
            ]}
          />
          <Textarea
            label="Description"
            value={desc()}
            onInput={setDesc}
            placeholder="Write something..."
          />
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              {framework() === "astro" ? <Badge tone="success">Astro</Badge> : null}
              {framework() === "solid" ? <Badge tone="warning">Solid</Badge> : null}
              {framework() === "react" ? <Badge tone="error">React</Badge> : null}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setName("");
                setFramework("astro");
                setDesc("");
              }}
            >
              Reset
            </Button>
          </div>
          {name() ? (
            <p class="text-xs text-[var(--text-muted)]">
              Hello, <span class="text-[var(--text-primary)]">{name()}</span>!
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
