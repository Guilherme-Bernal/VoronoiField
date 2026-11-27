import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { HomeScreen } from "./components/ui/HomeScreen";
import { MarkerPage } from "./components/ui/MarkerPage";
import { NotFound } from "./components/ui/NotFound";
import { MatchReportPage } from "./match/MatchReportPage";
import { PhotoImportPage } from "./vision/PhotoImportPage";

const ARExperience = lazy(() =>
  import("./components/ar/ARExperience").then((m) => ({ default: m.ARExperience }))
);
const SimulatorPage = lazy(() =>
  import("./components/sim/SimulatorPage").then((m) => ({ default: m.SimulatorPage }))
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/ar" element={<ARExperience />} />
          <Route path="/sim" element={<SimulatorPage />} />
          <Route path="/leitura" element={<MatchReportPage />} />
          <Route path="/importar" element={<PhotoImportPage />} />
          <Route path="/marcador" element={<MarkerPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
