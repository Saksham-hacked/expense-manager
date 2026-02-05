
import React from 'react';
import { createRoot } from 'react-dom/client';
import FloatingWidget from './FloatingWidget.jsx';

// Prevent multiple injections
if (!document.getElementById('floating-expense-widget-root')) {
  console.log('[Floating Expense Widget] Initializing...');

  // Create root container
  const rootElement = document.createElement('div');
  rootElement.id = 'floating-expense-widget-root';
  
  // Append to body
  document.body.appendChild(rootElement);

  // Mount React app
  const root = createRoot(rootElement);
  root.render(<FloatingWidget />);

  console.log('[Floating Expense Widget] Initialized successfully');
}
