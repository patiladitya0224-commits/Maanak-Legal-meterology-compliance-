import { Route, Routes } from "react-router-dom";
import Protected, { AdminOnly } from "./components/Protected";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ScanNew from "./pages/ScanNew";
import ScanResult from "./pages/ScanResult";
import Repository from "./pages/Repository";
import ProductDetail from "./pages/ProductDetail";
import Reports from "./pages/Reports";
import Rules from "./pages/Rules";
import UsersAdmin from "./pages/UsersAdmin";
import Settings from "./pages/Settings";
import ToastHost from "./components/ToastHost";

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected />}>
        <Route path="/app" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="scan" element={<ScanNew />} />
          <Route path="scans/:id" element={<ScanResult />} />
          <Route path="repository" element={<Repository />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="rules" element={<Rules />} />
          <Route element={<AdminOnly />}>
            <Route path="users" element={<UsersAdmin />} />
          </Route>
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
    <ToastHost />
    </>
  );
}
