import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SUS_URL } from "../../lib/config";
import { TOUR_STEPS, type TourContext } from "../../tour/steps";
import { MiniBoard } from "./MiniBoard";
import styles from "./GuidedTour.module.css";

interface Props {
  context: TourContext;
  /** "header" cabe numa barra de topo; "overlay" flutua sobre a câmera (AR). */
  variant?: "header" | "overlay";
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;

/**
 * Guia passo a passo "Como usar": destaca partes da tela, tem um mini-campo
 * para praticar e, no fim, leva ao questionário SUS. Abre sozinho com ?tour=1.
 */
export function GuidedTour({ context, variant = "header" }: Props) {
  const steps = TOUR_STEPS[context];
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(() => params.get("tour") === "1");
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const last = index === steps.length - 1;

  const close = useCallback(() => {
    setOpen(false);
    if (params.has("tour")) {
      const next = new URLSearchParams(params);
      next.delete("tour");
      setParams(next, { replace: true });
    }
    launcherRef.current?.focus();
  }, [params, setParams]);

  const start = () => {
    setIndex(0);
    setOpen(true);
  };

  const measure = useCallback(() => {
    const el = step.target
      ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      : null;
    const rect = el?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      setBox(null);
      return;
    }
    setBox({
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    });
  }, [step.target]);

  // Rola até o alvo do passo e mede a posição dele.
  useEffect(() => {
    if (!open) return;
    if (step.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView?.({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [open, step, measure]);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, measure]);

  // Teclado: Esc fecha, setas navegam.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, steps.length]);

  // Leva o foco para o cartão ao abrir e a cada passo.
  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, index]);

  // O cartão fica do lado que tem mais espaço livre, para não cobrir o destaque.
  const placeTop =
    box !== null && box.top > window.innerHeight - (box.top + box.height);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={variant === "overlay" ? styles.launcherOverlay : styles.launcher}
        onClick={start}
        aria-haspopup="dialog"
      >
        Como usar
      </button>

      {open && (
        <div className={styles.root}>
          <div className={styles.blocker} aria-hidden="true" />
          {box ? (
            <div
              className={styles.spot}
              aria-hidden="true"
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            />
          ) : (
            <div className={styles.dim} aria-hidden="true" />
          )}

          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`${styles.card} ${placeTop ? styles.cardTop : ""}`}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={close}
              aria-label="Fechar o guia"
            >
              ×
            </button>
            <p className={styles.counter}>
              Passo {index + 1} de {steps.length}
            </p>
            <h2 id={titleId} className={styles.title}>
              {step.title}
            </h2>
            <p className={styles.text}>{step.text}</p>
            {step.points && (
              <ul className={styles.points}>
                {step.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
            {step.demo === "practice" && <MiniBoard />}
            {step.link && (
              <Link to={step.link.to} className={styles.link} onClick={close}>
                {step.link.label}
              </Link>
            )}
            {step.survey && SUS_URL && (
              <a href={SUS_URL} target="_blank" rel="noopener noreferrer" className={styles.survey}>
                Responder o questionário (SUS)
              </a>
            )}

            <div className={styles.dots} aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s.id} className={i === index ? styles.dotActive : styles.dot} />
              ))}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                disabled={index === 0}
              >
                Voltar
              </button>
              {last ? (
                <button type="button" className={styles.primary} onClick={close}>
                  Concluir
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
                >
                  Próximo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}