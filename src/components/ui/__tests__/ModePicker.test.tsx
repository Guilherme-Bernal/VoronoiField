import { act, render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ModePicker } from "../ModePicker";
import { useTacticalStore } from "../../../state/tacticalStore";

describe("ModePicker", () => {
  beforeEach(() => {
    act(() => useTacticalStore.getState().resetFormation());
  });

  it("alterna entre 4x4 e 11x11", () => {
    render(<ModePicker />);
    expect(useTacticalStore.getState().players).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /11 x 11/ }));
    expect(useTacticalStore.getState().players).toHaveLength(22);
    fireEvent.click(screen.getByRole("button", { name: /4 x 4/ }));
    expect(useTacticalStore.getState().players).toHaveLength(8);
  });
});
