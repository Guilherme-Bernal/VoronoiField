import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { qrDataUrl, renderCard } from "../../marker/cardCanvas";
import styles from "./MarkerPage.module.css";

const NAME_KEY = "voronoifield.card.v1";

function readSaved(): { name: string; team: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(NAME_KEY) ?? "{}") as Record<string, unknown>;
    return {
      name: typeof raw.name === "string" ? raw.name.slice(0, 28) : "",
      team: typeof raw.team === "string" ? raw.team.slice(0, 40) : "",
    };
  } catch {
    return { name: "", team: "" };
  }
}

/** Cartão do campo: marcador da AR + QR + nome, para baixar, imprimir ou compartilhar. */
export function MarkerPage() {
  const [saved] = useState(readSaved);
  const [name, setName] = useState(saved.name);
  const [team, setTeam] = useState(saved.team);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const arUrl = `${window.location.origin}/ar`;

  useEffect(() => {
    let alive = true;
    qrDataUrl(arUrl)
      .then((u) => alive && setQr(u))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [arUrl]);

  function remember(n: string, t: string) {
    try {
      localStorage.setItem(NAME_KEY, JSON.stringify({ name: n, team: t }));
    } catch {
      /* sem armazenamento: ok */
    }
  }

  async function download() {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await renderCard({ name, team, arUrl });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cartao-voronoifield.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setMsg("Não foi possível gerar o cartão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setMsg(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "VoronoiField", url: arUrl });
      } else {
        await navigator.clipboard.writeText(arUrl);
        setMsg("Link do AR copiado.");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <Link to="/" className={styles.link}>
          ← Início
        </Link>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={share}>
            Compartilhar link
          </button>
          <button type="button" className={styles.secondary} onClick={() => window.print()}>
            Imprimir
          </button>
          <button type="button" className={styles.print} onClick={download} disabled={busy}>
            {busy ? "Gerando…" : "Baixar cartão (PNG)"}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.card} aria-label="Cartão do campo">
          <div className={styles.cardHead}>
            <strong className={styles.brand}>VORONOIFIELD</strong>
            <span>Cartão do campo · realidade aumentada</span>
          </div>
          <div className={styles.sheet}>
            <img
              className={styles.marker}
              src="/markers/campo-marcador.png"
              alt="Marcador do campo para o modo de realidade aumentada"
            />
          </div>
          <div className={styles.cardFoot}>
            {qr && <img className={styles.qr} src={qr} alt="QR code para abrir o modo AR" />}
            <div>
              <strong className={styles.step}>Escaneie e aponte para o campo</strong>
              <ol className={styles.steps}>
                <li>Abra o QR code no celular.</li>
                <li>Deixe o campo inteiro visível.</li>
                <li>Aponte a câmera e mova os jogadores.</li>
              </ol>
            </div>
          </div>
          {(name || team) && (
            <div className={styles.owner}>
              <strong>{name.toUpperCase()}</strong>
              <span>{team}</span>
            </div>
          )}
        </section>

        <aside className={styles.side}>
          <h1 className={styles.h1}>Seu cartão</h1>
          <label className={styles.field}>
            Nome no cartão
            <input
              value={name}
              maxLength={28}
              onChange={(e) => {
                setName(e.target.value);
                remember(e.target.value, team);
              }}
            />
          </label>
          <label className={styles.field}>
            Time ou turma
            <input
              value={team}
              maxLength={40}
              onChange={(e) => {
                setTeam(e.target.value);
                remember(name, e.target.value);
              }}
            />
          </label>
          <p className={styles.help}>
            Baixe o PNG ou imprima em papel fosco A4. A imagem do campo não muda: ela é o que a
            câmera reconhece. Para jogar sem imprimir, deixe o cartão aberto numa tela com brilho
            alto.
          </p>
          {msg && (
            <p role="status" className={styles.msg}>
              {msg}
            </p>
          )}
          <Link to="/ar" className={styles.link}>
            Abrir o modo AR
          </Link>
        </aside>
      </div>
    </main>
  );
}