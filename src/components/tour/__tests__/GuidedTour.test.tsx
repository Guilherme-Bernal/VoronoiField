import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GuidedTour } from "../GuidedTour";
import { TOUR_STEPS } from "../../../tour/steps";

vi.mock("../../../lib/config", () => ({ SUS_URL: "https://forms.example.com/sus" }));

function renderTour(context: "sim" | "ar", url = "/") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <GuidedTour context={context} />
    </MemoryRouter>
  );
}

describe("GuidedTour", () => {
  it("fica fechado até clicar em Como usar", () => {
    renderTour("sim");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Como usar" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(`Passo 1 de ${TOUR_STEPS.sim.length}`)).toBeTruthy();
  });

  it("abre sozinho com ?tour=1", () => {
    renderTour("sim", "/sim?tour=1");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("avança, volta e conclui", () => {
    renderTour("ar", "/ar?tour=1");
    const total = TOUR_STEPS.ar.length;
    const back = screen.getByRole("button", { name: "Voltar" }) as HTMLButtonElement;
    expect(back.disabled).toBe(true);

    for (let i = 1; i < total; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    }
    expect(screen.getByText(`Passo ${total} de ${total}`)).toBeTruthy();
    expect(back.disabled).toBe(false);
    fireEvent.click(back);
    expect(screen.getByText(`Passo ${total - 1} de ${total}`)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra o link do questionário SUS só no último passo", () => {
    renderTour("sim", "/sim?tour=1");
    expect(screen.queryByRole("link", { name: /questionário/i })).toBeNull();
    for (let i = 1; i < TOUR_STEPS.sim.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    }
    const link = screen.getByRole("link", { name: /questionário/i }) as HTMLAnchorElement;
    expect(link.href).toBe("https://forms.example.com/sus");
    expect(link.rel).toContain("noopener");
  });

  it("fecha com Esc", () => {
    renderTour("sim", "/sim?tour=1");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("todo passo tem id único e texto", () => {
    for (const steps of Object.values(TOUR_STEPS)) {
      const ids = steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      steps.forEach((s) => {
        expect(s.title.length).toBeGreaterThan(0);
        expect(s.text.length).toBeGreaterThan(0);
      });
      expect(steps[steps.length - 1].survey).toBe(true);
    }
  });
});