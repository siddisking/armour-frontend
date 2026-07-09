
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { Admin } from './components/Admin';
import { Login } from './components/Login';

const RATE_LIMIT_EVENT = 'app:rate_limited';

// Globally intercept all fetch calls to catch any 429 rate limit errors
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent(RATE_LIMIT_EVENT));
    }
    return response;
  };
}

function App() {
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    const handleRateLimit = () => {
      setIsRateLimited(true);
    };

    window.addEventListener(RATE_LIMIT_EVENT, handleRateLimit);
    return () => {
      window.removeEventListener(RATE_LIMIT_EVENT, handleRateLimit);
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>

      {isRateLimited && (
        <div className="modal-backdrop">
          <div className="rate-limit-modal">
            <div className="rate-limit-icon">⏱️</div>
            <h3 className="rate-limit-title">Rate Limit Exceeded</h3>
            <p className="rate-limit-message">
              You are sending requests too quickly. Please wait a moment and try again.
            </p>
            <button 
              className="rate-limit-btn" 
              onClick={() => setIsRateLimited(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
