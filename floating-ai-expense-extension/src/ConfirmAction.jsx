/**
 * Confirmation Component
 * 
 * Shows action details and requires user confirmation before execution
 * 
 * CRITICAL SAFETY RULE:
 * - NEVER auto-execute actions
 * - Always show what will be executed
 * - Clear confirmation required
 */

import React, { useState } from 'react';
import { llmAPI } from './api.js';

export default function ConfirmAction({ tool, args, onCancel, onSuccess }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await llmAPI.executeAction(tool, args);
      console.log('Execution result:', result);
      onSuccess(result);
    } catch (err) {
      console.error('Execution error:', err);
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Format the tool name for display
  const formatToolName = (tool) => {
    return tool
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render arguments in a readable way
  const renderArguments = () => {
    return Object.entries(args).map(([key, value]) => {
      const formattedKey = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return (
        <div key={key} className="detail-row">
          <span className="detail-label">{formattedKey}:</span>
          <span className="detail-value">{String(value)}</span>
        </div>
      );
    });
  };

  return (
    <div className="confirmation-view">
      <div className="confirmation-header">
        <h4>⚠️ Confirm Action</h4>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
          Please review before confirming
        </p>
      </div>

      {error && (
        <div className="status-message status-error">
          {error}
        </div>
      )}

      <div className="confirmation-details">
        <div className="detail-row">
          <span className="detail-label">Action:</span>
          <span className="detail-value">{formatToolName(tool)}</span>
        </div>
        {renderArguments()}
      </div>

      <div className="confirmation-actions">
        <button
          className="btn-secondary"
          onClick={onCancel}
          disabled={isExecuting}
        >
          Cancel
        </button>
        <button
          className="btn-confirm"
          onClick={handleConfirm}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <span className="loading-spinner" style={{ borderTopColor: 'white' }}></span>
              Executing...
            </>
          ) : (
            'Execute'
          )}
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
        This action will be sent to the MCP server for execution
      </div>
    </div>
  );
}
