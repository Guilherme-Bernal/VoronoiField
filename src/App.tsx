import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomeScreen } from "./components/ui/HomeScreen";
import { ARExperience } from "./components/ar/ARExperience";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/ar" element={<ARExperience />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
