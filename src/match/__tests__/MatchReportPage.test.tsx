import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { MatchReportPage } from "../MatchReportPage";

function setup() {
  return render(
    <MemoryRouter>
      <MatchReportPage />
    </MemoryRouter>
  );
}

describe("MatchReportPage", () => {
  beforeEach(() => localStorage.clear());

  it("mostra os dois times com 11 titulares e o dominio somando 100%", () => {
    setup();
    expect(screen.getAllByLabelText(/Nome do titular/)).toHaveLength(22);
    const pcts = screen.getAllByText(/^\d+%$/).map((e) => parseInt(e.textContent!, 10));
    expect(pcts[0] + pcts[1]).toBe(100);
  });

  it("atualiza o nome do time e salva no navegador", () => {
    setup();
    const [name] = screen.getAllByLabelText("Nome do time") as HTMLInputElement[];
    fireEvent.change(name, { target: { value: "Facens FC" } });
    expect(screen.getAllByText("Facens FC").length).toBeGreaterThan(0);
    expect(localStorage.getItem("voronoifield.leitura.v1")).toContain("Facens FC");
  });

  it("trocar a formacao muda as funcoes dos jogadores", () => {
    setup();
    const [form] = screen.getAllByLabelText("Formação") as HTMLSelectElement[];
    fireEvent.change(form, { target: { value: "4-2-3-1" } });
    expect(screen.getAllByText("VOL").length).toBe(2);
  });

  it("tem os botoes de PDF e de abrir no simulador", () => {
    setup();
    expect(screen.getByRole("button", { name: "Gerar PDF" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abrir no simulador" })).toBeTruthy();
  });
});