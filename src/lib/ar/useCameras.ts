import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "voronoifield.cameraId";

export interface CameraOption {
  deviceId: string;
  label: string;
}

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function storeId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // armazenamento indisponivel: a escolha vale so ate recarregar
  }
}

/**
 * Lista as cameras do aparelho e guarda a escolhida. Os nomes (labels) so
 * aparecem depois que o navegador libera a camera, por isso `refresh` e
 * chamado de novo quando o AR inicia ou falha.
 */
export function useCameras() {
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [deviceId, setDeviceIdState] = useState<string | null>(readStoredId);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(
        devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Câmera ${i + 1}`,
          }))
      );
    } catch {
      setCameras([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () =>
      navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, [refresh]);

  const setDeviceId = useCallback((id: string | null) => {
    storeId(id);
    setDeviceIdState(id);
  }, []);

  return { cameras, deviceId, setDeviceId, refresh };
}
