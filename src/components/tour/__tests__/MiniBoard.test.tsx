import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MiniBoard } from "../MiniBoard";

function readPercent() {
  return Number(screen.getByText(/controla/).querySelector("strong")!.textContent!.replace("%", ""));
}

describe("MiniBoard", () => {
  it("mostra o controle inicial do azul", () => {
    render(<MiniBoard />);
    const p = readPercent();
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(100);
  });

  it("muda o percentual ao mover o jogador com as setas", () => {
    render(<MiniBoard />);
    const before = readPercent();
    const player = screen.getByRole("button", { name: /Jogador azul 4/ });
    for (let i = 0; i < 6; i++) fireEvent.keyDown(player, { key: "ArrowRight" });
    expect(readPercent()).not.toBe(before);
    expect(screen.getByText(/pontos/)).toBeTruthy();
  });
});