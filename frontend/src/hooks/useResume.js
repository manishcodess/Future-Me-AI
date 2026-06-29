import { useState, useRef } from 'react';
import { ai } from '../services/aiService';
import { readFileAsBase64, readFileAsText } from '../utils/file';

export function useResume(showToast, userCredentials, setUserCredentials) {
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeResume = async (text, pdfBase64 = null) => {
    setResumeLoading(true);
    setResumeAnalysis("");
    try {
      const promptText = `You are a senior tech recruiter at a top product company.
      Analyze this resume for a Software Engineering role. Analyze the full profile including education, experience, and projects.
      
      ${text ? text.slice(0, 3000) : 'See attached PDF.'}
      
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
      if (pdfBase64) {
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
      
      const analysisText = result.text;
      setResumeAnalysis(analysisText);
      showToast("Resume analyzed ✨");

      // Save to DB for context injection
      if (userCredentials) {
        const token = localStorage.getItem('devpulse_token');
        if (token) {
          try {
            const res = await fetch('http://localhost:3001/api/auth/resume', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ resumeContext: analysisText })
            });
            const data = await res.json();
            if (data.success) {
              setUserCredentials(data.user);
            }
          } catch (err) {
            console.error("Failed to save resume context", err);
          }
        }
      }

    } catch {
      setResumeAnalysis("SCORE: 0/10\n\nONE LINE VERDICT: Failed to analyze resume.");
      showToast("Failed to analyze resume", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    try {
      if (file.type === "application/pdf") {
        const base64Data = await readFileAsBase64(file);
        await analyzeResume("", base64Data);
      } else {
        const text = await readFileAsText(file);
        await analyzeResume(text, null);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      showToast("Failed to read file", "error");
    }
  };

  return {
    resumeAnalysis,
    resumeLoading,
    fileInputRef,
    handleResumeUpload
  };
}
