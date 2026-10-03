import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { tools } from "@/tools/registry";
import ToolSearch from "./ToolSearch";

describe("ToolSearch", () => {
  it("renders every registered tool with the curated tools ordered first", () => {
    const { getAllByRole } = render(() => <ToolSearch />);

    const links = getAllByRole("link");
    expect(links).toHaveLength(tools.length);
    expect(links[0]).toHaveTextContent("JSON Formatter");
  });

  it("filters results by name, description, and keywords", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "cron" } });
    let links = getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("Cron Schedule");

    fireEvent.input(input, { target: { value: "sha256" } });
    links = getAllByRole("link");
    expect(links[0]).toHaveTextContent("Hash Generator");
  });

  it("shows an empty state when nothing matches", () => {
    const { getByRole, getByText } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "blockchain" } });

    expect(getByText(/No matching tools/i)).toBeInTheDocument();
  });

  it("announces arrow-key selection and stops at the result boundary", () => {
    const { getByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });
    fireEvent.input(input, { target: { value: "cron" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(getByRole("status")).toHaveTextContent(
      "1 tool available for cron. Cron Schedule highlighted."
    );
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(getByRole("status")).toHaveTextContent("Cron Schedule highlighted.");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(getByRole("status")).toHaveTextContent("1 tool available for cron.");
    expect(getByRole("status")).not.toHaveTextContent("highlighted");
  });

  it("clears the query on Escape", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "diff" } });
    expect(getAllByRole("link")).toHaveLength(1);

    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toHaveValue("");
    expect(getAllByRole("link")).toHaveLength(tools.length);
  });

  it("announces result counts as the query changes", () => {
    const { getByRole, getByText } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    expect(input).toHaveAttribute("name", "tool-search");
    expect(getByText(`${tools.length} tools available.`)).toBeInTheDocument();

    fireEvent.input(input, { target: { value: "cron" } });

    expect(getByText("1 tool available for cron.")).toBeInTheDocument();
  });

  it("keeps Home and End selection within the filtered results", () => {
    const { getByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });
    fireEvent.input(input, { target: { value: "formatter" } });

    fireEvent.keyDown(input, { key: "Home" });
    expect(getByRole("status")).toHaveTextContent("JSON Formatter highlighted.");

    fireEvent.keyDown(input, { key: "End" });
    expect(getByRole("status")).toHaveTextContent("XML Formatter highlighted.");

    fireEvent.input(input, { target: { value: "no-such-tool" } });
    fireEvent.keyDown(input, { key: "Home" });
    fireEvent.keyDown(input, { key: "End" });
    expect(getByRole("status")).toHaveTextContent("0 tools available for no-such-tool.");
    expect(getByRole("status")).not.toHaveTextContent("highlighted");
  });

  it("keeps native links for direct keyboard navigation", () => {
    const { getAllByRole } = render(() => <ToolSearch />);

    for (const link of getAllByRole("link")) {
      expect(link).toHaveAttribute("href");
      expect(link).not.toHaveAttribute("role", "option");
    }
  });
});
