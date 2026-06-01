import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Criteria from "./pages/Criteria";
import Nav from "./components/Nav";

function Layout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/criteria" element={<Criteria />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

