import { Routes, Route } from 'react-router-dom';
import { ViewPage } from './components/ViewPage';
import { ManagePage } from './components/ManagePage';
import './App.css';
import './styles/manage.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ViewPage />} />
      <Route path="/manage" element={<ManagePage />} />
    </Routes>
  );
}

export default App;