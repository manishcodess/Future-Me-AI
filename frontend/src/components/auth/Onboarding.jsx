import React, { useState } from 'react';
import { Code2, User, ArrowRight, Save, MessageSquare, FileText } from 'lucide-react';
import { ai } from '../../services/aiService';
import { readFileAsBase64, readFileAsText } from '../../utils/file';

export default function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    github: '',
    leetcode: '',
    bio: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingText("Saving profile...");
    setError(null);

    let generatedResumeContext = undefined;

    try {
      if (resumeFile) {
        setLoadingText("Analyzing resume via AI...");
        const promptText = `You are a senior tech recruiter at a top product company.
      Analyze this resume for a Software Engineering role. Analyze the full profile including education, experience, and projects.
      
      ${resumeFile.type !== "application/pdf" ? (await readFileAsText(resumeFile)).slice(0, 3000) : 'See attached PDF.'}
      
      Give feedback in exactly this format:
      SCORE: X/10
      
      STRONG POINTS (3 bullet points):
      - 
      
      WEAK POINTS (3 bullet points):
      - 
      MISSING KEYWORDS (comma separated, max 8):if have that only otherise dont mention in response
      
      ONE LINE VERDICT:
      be good and answer like its your younger bro and suggeste things that are achievable and doable`;
        
        const parts = [{ text: promptText }];
        if (resumeFile.type === "application/pdf") {
          const pdfBase64 = await readFileAsBase64(resumeFile);
          parts.unshift({
            inlineData: {
              data: pdfBase64,
              mimeType: "application/pdf"
            }
          });
        }

        const result = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: parts
        });
        generatedResumeContext = result.text;
      }

      setLoadingText("Finalizing setup...");
      const token = localStorage.getItem('devpulse_token');
      const response = await fetch('http://localhost:3001/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          githubUsername: formData.github,
          leetcodeUsername: formData.leetcode,
          bio: formData.bio,
          resumeContext: generatedResumeContext
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profiles');

      onComplete(data.user);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during onboarding.");
    } finally {
      setIsSubmitting(false);
      setLoadingText("");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
      </div>
      
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo-bg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Save size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Complete Your Profile</h1>
          <p className="auth-subtitle">Link your developer profiles to unlock personalized insights and stats.</p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input 
              type="text" 
              name="github"
              placeholder="GitHub Username (e.g. octocat)" 
              className="auth-input"
              value={formData.github}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Code2 className="input-icon" size={18} />
            <input 
              type="text" 
              name="leetcode"
              placeholder="LeetCode Username (e.g. leetcode_user)" 
              className="auth-input"
              value={formData.leetcode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group" style={{ alignItems: 'flex-start' }}>
            <MessageSquare className="input-icon" size={18} style={{ marginTop: '14px' }} />
            <textarea 
              name="bio"
              placeholder="Tell me about yourself (Optional). E.g. 'I am a backend dev trying to learn React...'" 
              className="auth-input"
              value={formData.bio}
              onChange={handleChange}
              style={{ minHeight: '80px', resize: 'vertical', paddingTop: '12px' }}
            />
          </div>

          <div className="input-group">
            <FileText className="input-icon" size={18} />
            <input 
              type="file" 
              accept=".pdf,.txt"
              className="auth-input"
              onChange={(e) => setResumeFile(e.target.files[0])}
              style={{ padding: '12px 16px 12px 44px', color: resumeFile ? '#fff' : '#71717a' }}
            />
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', marginTop: '16px' }}
          >
            {isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="auth-spinner"></div>
                <span style={{ fontSize: '14px' }}>{loadingText}</span>
              </div>
            ) : (
              <>
                Save & Continue
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
