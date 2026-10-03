import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { tools } from "@/tools/registry";
import ToolSearch from "./ToolSearch";

describe("ToolSearch", () => {
  it("updates links and announcements with the query and restores the catalog on Escape", () => {
    const { getByRole, getAllByRole, queryAllByRole, getByText } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });
    fireEvent.input(input, { target: { value: "cron" } });
    expect(getAllByRole("link")).toHaveLength(1);
    expect(getByRole("link")).toHaveAttribute("href", "/tools/cron");
    expect(getByRole("status")).toHaveTextContent("1 tool available for cron.");

    fireEvent.input(input, { target: { value: "no-such-tool" } });
    expect(queryAllByRole("link")).toHaveLength(0);
    expect(getByText("No matching tools.")).toBeInTheDocument();
    expect(getByRole("status")).toHaveTextContent("0 tools available for no-such-tool.");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    expect(getAllByRole("link")).toHaveLength(tools.length);
  });

  it("announces arrow-key selection and stops at the result boundary", () => {
    const { getByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });
    fireEvent.input(input, { target: { value: "cron" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(getByRole("status")).toHaveTextContent("Cron Schedule highlighted.");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(getByRole("status")).toHaveTextContent("Cron Schedule highlighted.");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(getByRole("status")).not.toHaveTextContent("highlighted");
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
    expect(getByRole("status")).not.toHaveTextContent("highlighted");
  });
});
