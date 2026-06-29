import React from 'react';

const formatText = (text) => {
  if (!text) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function ResumeReview({
  fileInputRef,
  handleResumeUpload,
  resumeLoading,
  resumeAnalysis
}) {
  const renderResumeAnalysis = (analysisText) => {
    if (!analysisText) return null;
    
    const scoreMatch = analysisText.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const scoreColor = score > 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';

    const strongMatch = analysisText.match(/STRONG POINTS[^\n]*\n([\s\S]*?)(?=WEAK POINTS)/i);
    const strongPoints = strongMatch ? strongMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

    const weakMatch = analysisText.match(/WEAK POINTS[^\n]*\n([\s\S]*?)(?=MISSING KEYWORDS)/i);
    const weakPoints = weakMatch ? weakMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

    const keywordMatch = analysisText.match(/MISSING KEYWORDS:?\s*([^\n]*)/i);
    const keywords = keywordMatch ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [];

    const verdictMatch = analysisText.match(/ONE LINE VERDICT:?\s*([^\n]*)/i);
    const verdict = verdictMatch ? verdictMatch[1] : "";

    return (
      <div className="resume-analysis-container">
        <div className="resume-score-card" style={{ borderColor: scoreColor }}>
          <div className="resume-score-label">Resume Score</div>
          <div className="resume-score-value" style={{ color: scoreColor }}>{score}/10</div>
        </div>
        
        <div className="resume-feedback-grid">
          <div className="feedback-card strong">
            <h3>Strong Points</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{strongPoints.map((p,i)=><li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-','').trim())}</li>)}</ul>
          </div>
          <div className="feedback-card weak">
            <h3>Areas to Improve</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{weakPoints.map((p,i)=><li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-','').trim())}</li>)}</ul>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="resume-keywords-section">
            <h3>Missing Keywords</h3>
            <div className="keyword-pills">
              {keywords.map((k,i)=><span key={i} className="pill pill-hard">{k}</span>)}
            </div>
          </div>
        )}

        {verdict && (
          <div className="resume-verdict-box" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            <strong>Verdict:</strong> {formatText(verdict)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="resume-container">
      <div 
        className="upload-dropzone" 
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept=".pdf,.txt" 
          hidden 
          ref={fileInputRef} 
          onChange={handleResumeUpload} 
        />
        <div className="upload-icon">📄</div>
        <div>Drop your resume PDF/TXT here or click to upload</div>
        <div className="upload-subtext">(Basic text extraction works for .txt and text-based PDFs)</div>
      </div>

      {resumeLoading && (
        <div className="resume-loading">
          <div className="shimmer-loader" style={{ height: '200px' }}></div>
          <p style={{textAlign:'center', marginTop:'16px', color:'var(--text-muted)'}}>DevPulse is reviewing your resume against 20+ LPA standards...</p>
        </div>
      )}

      {!resumeLoading && resumeAnalysis && renderResumeAnalysis(resumeAnalysis)}
    </div>
  );
}
