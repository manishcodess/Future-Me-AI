import React from 'react';
import { Bot } from 'lucide-react';

export default function RightPanel({ dailyBrief, briefLoading }) {
  return (
    <aside className="right-panel" style={{ padding: '20px', overflowY: 'auto' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Overview</div>
      
      <div className="ai-brief-card" style={{ marginBottom: 0 }}>
        <div className="brief-bot-icon">
          <Bot size={20} color="white" />
        </div>
        <div className="brief-content">
          <div className="brief-title">AI Daily Brief</div>
          {briefLoading ? (
            <div className="shimmer-loader"></div>
          ) : (
            <div className="brief-text">{dailyBrief}</div>
          )}
        </div>
      </div>
    </aside>
  );
}
