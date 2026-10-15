import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { HomeScreen } from "./components/ui/HomeScreen";
import { MarkerPage } from "./components/ui/MarkerPage";
import { NotFound } from "./components/ui/NotFound";

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
          <Route path="/marcador" element={<MarkerPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
