
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import GeneratorPage from './pages/GeneratorPage';
import HistoryPage from './pages/HistoryPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GeneratorPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
