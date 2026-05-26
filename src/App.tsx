
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { Admin } from './components/Admin';
import { Login } from './components/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
