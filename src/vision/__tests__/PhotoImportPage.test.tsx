import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PhotoImportPage } from "../PhotoImportPage";

describe("PhotoImportPage", () => {
  it("mostra o envio de foto e explica o que faz", () => {
    render(
      <MemoryRouter>
        <PhotoImportPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Importar escalação por foto")).toBeTruthy();
    expect(screen.getByText(/Tirar foto ou escolher print/)).toBeTruthy();
    expect(screen.getByLabelText(/Tirar foto ou escolher print/)).toBeTruthy();
  });
});