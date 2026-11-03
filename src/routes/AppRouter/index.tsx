import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from '../../components/AppShell';
import Home from '../../pages/Home';
import WorkDetails from '../../pages/WorkDetails';
import NotFound from '../../pages/NotFound';

const ChapterReader = lazy(() => import('../../pages/ChapterReader'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/obra/:slug" element={<WorkDetails />} />
          <Route path="/obra/:slug/capitulo/:number" element={<Suspense fallback={<p className="container" role="status">Abrindo leitor…</p>}><ChapterReader /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
