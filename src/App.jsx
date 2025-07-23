import "./App.css";
import Dashboard from "./Components/Dashboard/Dashboard";
import Home from "./Components/Home/Home";
import Login from "./Components/Login/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      {/* <Login /> */}
      {/* <Dashboard /> */}
      <Router>
        <Routes>
          <Route path="/*" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
