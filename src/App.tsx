import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/HomePage';
import { BoardPage } from './pages/BoardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:slug" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
