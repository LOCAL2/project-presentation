import { Routes, Route } from 'react-router-dom';
import { ViewPage } from './components/ViewPage';
import { ManagePage } from './components/ManagePage';
import { TestConnection } from './components/TestConnection';
import './App.css';
import './styles/manage-pro.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ViewPage />} />
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/test" element={<TestConnection />} />
    </Routes>
  );
}

export default App;