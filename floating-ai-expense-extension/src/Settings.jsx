/**
 * Settings Component
 * 
 * Handles user settings including BYOK (Bring Your Own Key)
 */

import React, { useState, useEffect } from 'react';
import { settingsAPI, authAPI } from './api.js';

export default function Settings({ user, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkExistingApiKey();
  }, []);

  const checkExistingApiKey = async () => {
    try {
      const result = await settingsAPI.checkApiKey();
      setHasApiKey(result.hasKey);
    } catch (err) {
      console.error('Error checking API key:', err);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid API key' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await settingsAPI.saveApiKey(apiKey);
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setHasApiKey(true);
      setApiKey('');
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await settingsAPI.removeApiKey();
      setMessage({ type: 'success', text: 'API key removed successfully' });
      setHasApiKey(false);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    await authAPI.signOut();
    window.location.reload(); // Reload to reset state
  };

  return (
    <div className="settings-view">
      {/* User Info Section */}
      <div className="settings-section">
        <h4>Account</h4>
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email || 'user@example.com'}</div>
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={handleSignOut}
          style={{ marginTop: '12px', width: '100%' }}
        >
          Sign Out
        </button>
      </div>

      {/* API Key Section (BYOK) */}
      <div className="settings-section">
        <h4>Gemini API Key (Optional)</h4>
        
        {message && (
          <div className={`status-message status-${message.type}`}>
            {message.text}
          </div>
        )}

        {hasApiKey ? (
          <div>
            <div className="status-message status-success">
              ✓ API key is configured
            </div>
            <button
              className="btn-danger"
              onClick={handleRemoveApiKey}
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : 'Remove API Key'}
            </button>
          </div>
        ) : (
          <div>
            <div className="warning-text">
              ⚠️ Your API key is sent once and stored securely on the server.
              It is never stored in your browser.
            </div>
            
            <input
              type="password"
              className="api-key-input"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            
            <button
              className="btn-primary"
              onClick={handleSaveApiKey}
              disabled={isLoading || !apiKey.trim()}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </button>

            <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
              <p>
                Get your API key from{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667eea' }}
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="settings-section">
        <h4>About</h4>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          <p><strong>Version:</strong> 0.1.0</p>
          <p style={{ marginTop: '8px' }}>
            This extension helps you manage expenses using AI.
            All actions require your confirmation before execution.
          </p>
        </div>
      </div>
    </div>
  );
}
