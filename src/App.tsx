import { Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ViewPage } from './components/ViewPage';
import { ManagePage } from './components/ManagePage';
import { GalleryPage } from './components/GalleryPage';
import { TestConnection } from './components/TestConnection';
import { NotFound } from './components/NotFound';
import { MembersPage } from './components/MembersPage';
import './App.css';
import './styles/manage-pro.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/picture" element={<GalleryPage />} />
      <Route path="/data" element={<ViewPage />} />
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="/test" element={<TestConnection />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;