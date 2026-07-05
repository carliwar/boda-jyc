import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './routes/Home';
import { Details } from './routes/Details';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <header className="topbar page">
        <NavLink to="/" className="brand">
          boda-jyc
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Inicio
          </NavLink>
          <NavLink to="/details" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Detalles
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/details" element={<Details />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
