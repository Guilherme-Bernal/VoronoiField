import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomeScreen } from "./components/ui/HomeScreen";
import { ARExperience } from "./components/ar/ARExperience";
import { SimulatorPage } from "./components/sim/SimulatorPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/ar" element={<ARExperience />} />
        <Route path="/sim" element={<SimulatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
