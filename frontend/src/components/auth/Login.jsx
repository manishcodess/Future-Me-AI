import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate network delay for effect
    setTimeout(() => {
      setIsSubmitting(false);
      // For mockup purposes, pass the email as name and empty github/leetcode
      onLogin({
        name: formData.email.split('@')[0],
        email: formData.email,
        github: '',
        leetcode: ''
      });
    }, 1200);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-bg">
            <Zap size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to continue your developer journey.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              className="auth-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              className="auth-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="auth-spinner"></div>
            ) : (
              <>
                Log In
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <span className="auth-link" onClick={onSwitchToSignup}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
