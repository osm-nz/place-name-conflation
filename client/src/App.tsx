import { StrictMode, useEffect, useState } from 'react';
import { Alert, CircularProgress, CssBaseline } from '@mui/material';
import { HashRouter, Route, Routes } from 'react-router-dom';
import type { Output } from './types';
import { DataContext } from './context';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { OtherPatchFiles } from './pages/OtherPatchFiles';
import { Warnings } from './pages/Warnings';
import './main.css';
import { LayerInfo } from './pages/LayerInfo';

const BASE_URL = localStorage.dev
  ? 'http://localhost:3000'
  : 'https://linz-addr-cdn.kyle.kiwi';

export const App: React.FC = () => {
  const [data, setData] = useState<Output>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    fetch(`${BASE_URL}/place-names.osmPatch.geo.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(setError);
  }, []);

  if (error) {
    return (
      <Alert severity="error" style={{ margin: 32 }}>
        Failed to load data.
      </Alert>
    );
  }

  if (!data) return <CircularProgress style={{ margin: 32 }} />;

  return (
    <StrictMode>
      <HashRouter>
        <DataContext.Provider value={data}>
          <CssBaseline />
          <Navbar />
          <main style={{ height: 'calc(100vh - 69px)', overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/other" element={<OtherPatchFiles />} />
              <Route path="/warnings" element={<Warnings />} />
              <Route path="/layers" element={<LayerInfo />} />
            </Routes>
          </main>
        </DataContext.Provider>
      </HashRouter>
    </StrictMode>
  );
};
