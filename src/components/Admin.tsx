import React, { useState, useRef, useEffect } from 'react';
import { Database, UploadCloud, Play, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';

export const Admin: React.FC = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>('anime');
  const [uploadMode, setUploadMode] = useState<'overwrite' | 'update'>('update');
  const [vectorProvider, setVectorProvider] = useState<'gemini' | 'qwen' | 'both'>('gemini');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // RBAC Protection: Only SuperAdmin allowed
  if (isAuthLoading) return null;
  if (!user || user.role !== 'SuperAdmin') {
    return <Navigate to="/" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setLogs([`Starting ingestion for ${file.name}...`]);
    setStatus('running');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);
    formData.append('uploadMode', uploadMode);
    formData.append('vectorProvider', vectorProvider);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const message of messages) {
          if (message.startsWith('data: ')) {
            try {
              const data = JSON.parse(message.replace('data: ', ''));

              if (data.status === 'started') {
                setLogs((prev) => [...prev, "Connected to backend. Parser initialized."]);
              } else if (data.status === 'progress') {
                setProgress(data.count);
                setLogs((prev) => [...prev, `Successfully processed and updated ${data.count} documents.`]);
              } else if (data.status === 'log') {
                setLogs((prev) => [...prev, data.message]);
              } else if (data.status === 'complete') {
                setLogs((prev) => [...prev, "Ingestion completed successfully!"]);
                setStatus('success');
                setIsUploading(false);
              } else if (data.status === 'error') {
                setLogs((prev) => [...prev, `ERROR: ${data.message}`]);
                setStatus('error');
                setIsUploading(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE message", message);
            }
          }
        }
      }
    } catch (error: any) {
      setLogs((prev) => [...prev, `CRITICAL ERROR: ${error.message}`]);
      setStatus('error');
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      <header className="app-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            ← Back to Chat
          </button>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>PlotArmor AI Admin</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hi, {user.name} (SuperAdmin)
          </span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="admin-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(255, 61, 113, 0.1)', borderRadius: '12px' }}>
          <Database size={32} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Database Ingestion</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
            Upload a CSV dataset to generate vector embeddings and populate PostgreSQL.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
          <UploadCloud size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 1rem' }}>Select CSV Dataset</h3>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '1rem', color: 'var(--text-secondary)' }}>Dataset Type:</label>
              <select 
                value={mediaType} 
                onChange={(e) => setMediaType(e.target.value)}
                disabled={isUploading}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <option value="anime">Anime (MyAnimeList Format)</option>
                <option value="series">TV Series (Hollywood Format)</option>
                <option value="movies">Movies (Hollywood Format)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '1rem', color: 'var(--text-secondary)' }}>Embedding Model:</label>
              <select 
                value={vectorProvider} 
                onChange={(e) => setVectorProvider(e.target.value as any)}
                disabled={isUploading}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <option value="gemini">Google Gemini (3072 dims)</option>
                <option value="qwen">SiliconFlow Qwen3 (1024 dims)</option>
                <option value="both">Both Concurrently</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: uploadMode === 'update' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              <input 
                type="radio" 
                name="uploadMode" 
                value="update" 
                checked={uploadMode === 'update'} 
                onChange={() => setUploadMode('update')}
                disabled={isUploading}
              />
              Update (Skip Existing)
            </label>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: uploadMode === 'overwrite' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              <input 
                type="radio" 
                name="uploadMode" 
                value="overwrite" 
                checked={uploadMode === 'overwrite'} 
                onChange={() => setUploadMode('overwrite')}
                disabled={isUploading}
              />
              Overwrite (Delete & Replace)
            </label>
          </div>

          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ 
              display: 'block', margin: '0 auto', color: 'var(--text-secondary)' 
            }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || isUploading}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
        >
          {isUploading ? <Database className="spin" size={20} /> : <Play size={20} />}
          {isUploading ? 'Processing...' : 'Start Ingestion'}
        </button>

        {status !== 'idle' && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold' }}>Progress</span>
              <span>{progress} rows inserted</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: status === 'error' ? 'var(--danger, #ff3d71)' : status === 'success' ? 'var(--success, #00e096)' : 'var(--primary)',
                width: progress > 0 ? `${Math.min((progress / 71000) * 100, 100)}%` : '0%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Console Output
        </h3>
        <div className="glass-panel" style={{
          background: 'rgba(0,0,0,0.5)',
          height: '300px',
          overflowY: 'auto',
          padding: '1rem',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {logs.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>Waiting for process to start...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.5rem', color: log.includes('ERROR') ? '#ff3d71' : log.includes('success') ? '#00e096' : '#fff' }}>
                <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>{new Date().toLocaleTimeString()}</span>
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        </div>
      </div>
    </div>
  );
};
