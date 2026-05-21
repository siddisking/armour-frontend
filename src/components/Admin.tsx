import React, { useState, useRef, useEffect } from 'react';
import { Database, UploadCloud, Play } from 'lucide-react';

export const Admin: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>('anime');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus('running');
    setLogs((prev) => [...prev, `Starting ingestion for ${file.name}...`]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
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
          
          <div style={{ marginBottom: '1.5rem' }}>
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
  );
};
