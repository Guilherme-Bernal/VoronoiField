import type { CameraOption } from "../../lib/ar/useCameras";
import styles from "./CameraPicker.module.css";

interface CameraPickerProps {
  cameras: CameraOption[];
  value: string | null;
  onChange: (deviceId: string | null) => void;
}

export function CameraPicker({ cameras, value, onChange }: CameraPickerProps) {
  if (cameras.length < 2 && !value) return null;

  return (
    <label className={styles.picker}>
      <span className={styles.label}>Câmera</span>
      <select
        className={styles.select}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Automática</option>
        {cameras.map((camera) => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label}
          </option>
        ))}
      </select>
    </label>
  );
}
