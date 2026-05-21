
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { Admin } from './components/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
