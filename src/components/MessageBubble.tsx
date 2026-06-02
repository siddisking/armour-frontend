import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, User, ExternalLink, X } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.trim().toLowerCase();
  return (
    (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) &&
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanUrl)
  );
};

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // RegEx to scan for bold text (**bold**), images (![alt](url)), and markdown links ([label](url))
  const regex = /(\*\*.*?\*\*|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\))/g;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];

    // Push preceding text segment
    if (matchIndex > currentIndex) {
      parts.push(text.substring(currentIndex, matchIndex));
    }

    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      const boldContent = matchText.substring(2, matchText.length - 2);
      parts.push(<strong key={keyIdx++}>{boldContent}</strong>);
    } else if (matchText.startsWith('!') && matchText.includes('](')) {
      const closeBracket = matchText.indexOf(']');
      const imgAlt = matchText.substring(2, closeBracket);
      const imgUrl = matchText.substring(closeBracket + 2, matchText.length - 1);
      
      if (isValidImageUrl(imgUrl)) {
        parts.push(
          <div key={keyIdx++} style={{ margin: '10px 0', display: 'block', maxWidth: '100%' }}>
            <img 
              src={imgUrl} 
              alt={imgAlt} 
              style={{ 
                maxWidth: '160px', 
                borderRadius: 'var(--radius-md, 8px)', 
                boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'block'
              }} 
            />
          </div>
        );
      } else {
        parts.push(matchText);
      }
    } else if (matchText.startsWith('[') && matchText.includes('](')) {
      const closeBracket = matchText.indexOf(']');
      const linkText = matchText.substring(1, closeBracket);
      const linkUrl = matchText.substring(closeBracket + 2, matchText.length - 1);
      
      parts.push(
        <a 
          key={keyIdx++} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'var(--accent-primary)', 
            textDecoration: 'underline', 
            wordBreak: 'break-all',
            fontWeight: 500
          }}
        >
          {linkText}
        </a>
      );
    }

    currentIndex = regex.lastIndex;
  }

  // Push remaining trailing segment
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : text;
};

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    // 1. Parse bullet point listings (* item or - item)
    const listMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
    if (listMatch) {
      const indent = listMatch[1].length * 10;
      return (
        <div 
          key={index} 
          style={{ 
            paddingLeft: `${indent + 16}px`, 
            textIndent: '-16px', 
            margin: '6px 0',
            lineHeight: 1.6 
          }}
        >
          • {parseInlineMarkdown(listMatch[3])}
        </div>
      );
    }

    // 2. Default line block rendering
    return (
      <div key={index} style={{ margin: '6px 0', minHeight: '1.2em', lineHeight: 1.6 }}>
        {parseInlineMarkdown(line)}
      </div>
    );
  });
};

interface CardData {
  title?: string;
  image?: string;
  year?: string;
  studio?: string;
  status?: string;
  score?: string;
  genres?: string;
  description?: string;
  mal?: string;
  episodes?: string;
  startdate?: string;
  enddate?: string;
}

const parseCardBlock = (blockText: string): CardData => {
  const lines = blockText.split('\n').map(l => l.trim()).filter(Boolean);
  const cardData: CardData = {};
  
  // 1. Check if the first line is a title without bracket keys (e.g. "Kono Subarashii...")
  if (lines.length > 0) {
    const firstLine = lines[0];
    const hasBracketKey = firstLine.match(/^[-*\s]*(?:\*\*|)?\[(Title|Image|Year|Studio|Status|Score|Genres|Description|MAL|Episodes|StartDate|EndDate)\]/i);
    if (!hasBracketKey) {
      cardData.title = firstLine
        .replace(/^(?:[-*\s]*)(?:\*\*|)?Title(?:\*\*|)?(?:\s*:\s*|\s+)/i, '')
        .replace(/^(?:[-*\s]+)/i, '')
        .trim();
    }
  }

  // 2. Parse all bracket-key lines
  lines.forEach(line => {
    const match = line.match(/^(?:[-*\s]*)(?:\*\*|)?\[(Title|Image|Year|Studio|Status|Score|Genres|Description|MAL|Episodes|StartDate|EndDate)\](?:\*\*|)?(?:\s*:\s*|\s+)(.*)$/i);
    if (match) {
      const key = match[1].toLowerCase() as keyof CardData;
      const val = match[2].trim();
      cardData[key] = val;
    }
  });
  
  return cardData;
};

const AnimeCard: React.FC<{ data: CardData }> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const genresList = data.genres ? data.genres.split(',').map(g => g.trim()) : [];
  
  let scorePercent = '';
  let ratingEmoji = '😊';
  if (data.score) {
    const numericScore = parseFloat(data.score);
    if (!isNaN(numericScore)) {
      if (numericScore <= 10) {
        scorePercent = `${Math.round(numericScore * 10)}%`;
      } else {
        scorePercent = `${numericScore}%`;
      }
      
      if (numericScore >= 8.5) ratingEmoji = '😊';
      else if (numericScore >= 7.0) ratingEmoji = '🙂';
      else ratingEmoji = '😐';
    }
  }

  let statusClass = 'status-finished';
  if (data.status) {
    const s = data.status.toLowerCase();
    if (s.includes('airing') || s.includes('current')) {
      statusClass = 'status-airing';
    } else if (s.includes('not yet') || s.includes('upcoming') || s.includes('future')) {
      statusClass = 'status-upcoming';
    }
  }

  const getGenreClass = (genre: string) => {
    const g = genre.toLowerCase();
    if (g.includes('action')) return 'genre-action';
    if (g.includes('adventure')) return 'genre-adventure';
    if (g.includes('comedy')) return 'genre-comedy';
    if (g.includes('drama')) return 'genre-drama';
    if (g.includes('fantasy')) return 'genre-fantasy';
    if (g.includes('sci-fi') || g.includes('science fiction') || g.includes('scifi')) return 'genre-sci-fi';
    return 'genre-default';
  };

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formattedStart = formatDateString(data.startdate);
  const formattedEnd = formatDateString(data.enddate);
  let airingPeriod = '';
  if (formattedStart) {
    airingPeriod = formattedEnd ? `${formattedStart} – ${formattedEnd}` : `${formattedStart} – Present`;
  }

  return (
    <div className="anime-card-row">
      {/* Poster Image */}
      {isValidImageUrl(data.image) && (
        <div className="anime-poster-wrapper">
          <img 
            src={data.image} 
            alt={data.title || 'Anime Poster'} 
            className="anime-poster"
            loading="lazy"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="anime-content-col">
        <div className="anime-card-header">
          {data.title && <h4 className="anime-card-title">{data.title}</h4>}
          
          {/* Genres */}
          {genresList.length > 0 && (
            <div className="anime-genres">
              {genresList.map((genre, idx) => (
                <span 
                  key={idx} 
                  className={`anime-genre-pill ${getGenreClass(genre)}`}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Synopsis / Description */}
        {data.description && (
          <p className="anime-desc">
            {data.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="anime-metrics-grid">
          {scorePercent && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Avg Score</span>
              <span className="anime-metric-val">
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {ratingEmoji} {scorePercent}
                </span>
              </span>
            </div>
          )}

          {data.year && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Year</span>
              <span className="anime-metric-val">{data.year}</span>
            </div>
          )}

          {data.episodes && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Episodes</span>
              <span className="anime-metric-val">{data.episodes}</span>
            </div>
          )}

          {airingPeriod && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Aired</span>
              <span className="anime-metric-val">{airingPeriod}</span>
            </div>
          )}

          {data.studio && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Studio</span>
              <span className="anime-metric-val" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                {data.studio}
              </span>
            </div>
          )}

          {data.status && (
            <div className="anime-metric-item">
              <span className="anime-metric-label">Status</span>
              <span className="anime-metric-val">
                <span className={`anime-status-dot ${statusClass}`} style={{ marginRight: '4px' }} />
                {data.status}
              </span>
            </div>
          )}
        </div>

        {/* More Details Modal trigger */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="anime-mal-link"
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: 0, 
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left'
          }}
        >
          More Details <ExternalLink size={12} />
        </button>
      </div>

      {isModalOpen && createPortal(
        <div className="anime-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="anime-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="anime-modal-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={16} />
            </button>
            
            <div className="anime-modal-content">
              <div className="anime-modal-hero">
                {/* Bigger poster */}
                {isValidImageUrl(data.image) && (
                  <div className="anime-modal-poster-wrapper">
                    <img 
                      src={data.image} 
                      alt={data.title || 'Anime Poster'} 
                      className="anime-modal-poster"
                    />
                  </div>
                )}
                
                <div className="anime-modal-hero-details">
                  {data.title && <h3 className="anime-modal-title">{data.title}</h3>}
                  
                  {/* Genres */}
                  {genresList.length > 0 && (
                    <div className="anime-genres">
                      {genresList.map((genre, idx) => (
                        <span 
                          key={idx} 
                          className={`anime-genre-pill ${getGenreClass(genre)}`}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Clean alignment of metrics inside modal */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {scorePercent && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Score:</span>{' '}
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{ratingEmoji} {scorePercent}</span>
                      </div>
                    )}
                    {data.year && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Year:</span> {data.year}
                      </div>
                    )}
                    {data.episodes && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Episodes:</span> {data.episodes}
                      </div>
                    )}
                    {airingPeriod && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Airing Period:</span> {airingPeriod}
                      </div>
                    )}
                    {data.studio && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Studio:</span> {data.studio}
                      </div>
                    )}
                    {data.status && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status:</span>
                        <span className={`anime-status-dot ${statusClass}`} />
                        {data.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body - Unclamped Entire Description */}
              <div className="anime-modal-body">
                <span className="anime-modal-section-title">Synopsis</span>
                {data.description && (
                  <p className="anime-modal-synopsis">
                    {data.description}
                  </p>
                )}

                {data.mal && (
                  <a 
                    href={data.mal} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="anime-modal-button"
                  >
                    View on MyAnimeList <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const parsedDate = message.timestamp ? new Date(message.timestamp) : null;
  const formattedTime = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        width: '100%',
      }}
    >
      {/* Avatar */}
      <div
        className="flex-center"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          background: isUser ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
          flexShrink: 0,
        }}
      >
        {isUser ? <User size={20} color="var(--text-primary)" /> : <Bot size={20} color="white" />}
      </div>

      {/* Message Content */}
      <div
        className={isUser ? '' : 'glass-panel'}
        style={{
          maxWidth: '85%',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          background: isUser ? 'var(--bg-tertiary)' : undefined,
          borderTopRightRadius: isUser ? '0' : 'var(--radius-lg)',
          borderTopLeftRadius: !isUser ? '0' : 'var(--radius-lg)',
        }}
      >
        <div style={{ margin: 0, color: 'var(--text-primary)' }}>
          {message.content.includes(':::anime-card') ? (
            (() => {
              const segments: React.ReactNode[] = [];
              const parts = message.content.split(/:::\s*anime-card\s*\n([\s\S]*?)(?:\n:::\s*(?:\n|$)|$)/gi);

              parts.forEach((part, index) => {
                if (index % 2 === 0) {
                  if (part.trim()) {
                    segments.push(
                      <div key={`text-${index}`} style={{ margin: '4px 0' }}>
                        {renderMarkdown(part.trim())}
                      </div>
                    );
                  }
                } else {
                  const cardData = parseCardBlock(part);
                  
                  // Check if it's currently a completely empty card being streamed
                  if (!cardData.title && !cardData.description && !cardData.image) {
                    segments.push(
                      <div key={`loader-${index}`} className="glass-panel animate-pulse" style={{ padding: 'var(--space-lg)', margin: 'var(--space-md) 0', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                          <div style={{ width: '90px', height: '130px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', flexShrink: 0 }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                            <div style={{ height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', width: '60%' }} />
                            <div style={{ height: '14px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', width: '40%' }} />
                            <div style={{ height: '14px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', width: '80%' }} />
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    segments.push(
                      <AnimeCard key={`card-${index}`} data={cardData} />
                    );
                  }
                }
              });
              
              return segments;
            })()
          ) : (
            renderMarkdown(message.content)
          )}
        </div>
        {formattedTime && (
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-xs)',
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
};
