// /**
//  * Floating Widget Container
//  * 
//  * Main UI component that manages all views and states
//  */

// import React, { useState, useEffect } from 'react';
// import Auth from './Auth.jsx';
// import Settings from './Settings.jsx';
// import ConfirmAction from './ConfirmAction.jsx';
// import { authAPI, llmAPI } from './api.js';

// export default function FloatingWidget() {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [currentView, setCurrentView] = useState('input'); // 'input' | 'confirm' | 'settings'
//   const [user, setUser] = useState(null);
//   const [executionResult, setExecutionResult] = useState(null);
// const [lastTool, setLastTool] = useState(null);
  
//   // Input state
//   const [userInput, setUserInput] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
  
//   // Confirmation state
//   const [pendingAction, setPendingAction] = useState(null);
  
//   // Message state
//   const [message, setMessage] = useState(null);

  

//   // Check authentication on mount
//   useEffect(() => {
//     checkAuth();
//   }, []);

//   // const checkAuth = async () => {
//   //   try {
//   //     const isAuth = await authAPI.isAuthenticated();
//   //     setIsAuthenticated(isAuth);
      
//   //     if (isAuth) {
//   //       const userData = await authAPI.getCurrentUser();
//   //       setUser(userData.user);

//   //     }
//   //   } catch (err) {
//   //     console.error('Auth check failed:', err);
//   //     setIsAuthenticated(false);
//   //   }
//   // };
// const checkAuth = async () => {
//   try {
//     const { jwt, user } = await new Promise((resolve) => {
//       chrome.storage.local.get(['jwt', 'user'], resolve);
//     });

//     if (!jwt) {
//       setIsAuthenticated(false);
//       setUser(null);
//       return;
//     }

//     // OPTIONAL but recommended: verify JWT with backend
//     // await authAPI.validateToken();

//     setIsAuthenticated(true);
//     setUser(user);

//   } catch (err) {
//     console.error('Auth check failed:', err);
//     setIsAuthenticated(false);
//     setUser(null);
//   }
// };

//   const handleAuthSuccess = (userData) => {
//     setIsAuthenticated(true);
//     setUser(userData.user);
//   };

//   const handleSubmitInput = async () => {
//     if (!userInput.trim()) {
//       return;
//     }

//     setIsProcessing(true);
//     setMessage(null);

//     try {
//       // Send to backend for intent parsing
//       const result = await llmAPI.parseIntent(userInput);
      
//       // Show confirmation screen
//       setPendingAction({
//         tool: result.tool,
//         args: result.arguments,
//       });
//       setCurrentView('confirm');
//     } catch (err) {
//       console.error('Intent parsing error:', err);
//       setMessage({ type: 'error', text: err.message });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleCancelConfirm = () => {
//     setPendingAction(null);
//     setCurrentView('input');
//   };

//   const handleExecutionSuccess = (result) => {
//     setMessage({
//       type: 'success',
//       text: result.message || 'Action executed successfully!',
//     });
    
//     // Reset state
//     setPendingAction(null);
//     setUserInput('');
//     setCurrentView('input');

//     // Clear message after 3 seconds
//     setTimeout(() => setMessage(null), 3000);
//   };

//   const renderContent = () => {
//     if (!isAuthenticated) {
//       return <Auth onAuthSuccess={handleAuthSuccess} />;
//     }

//     switch (currentView) {
//       case 'settings':
//         return (
//           <Settings
//             user={user}
//             onClose={() => setCurrentView('input')}
//           />
//         );

//       case 'confirm':
//         return (
//           <ConfirmAction
//             tool={pendingAction.tool}
//             args={pendingAction.args}
//             onCancel={handleCancelConfirm}
//             onSuccess={handleExecutionSuccess}
//           />
//         );

//       case 'input':
//       default:
//         return (
//           <div className="input-view">
//             {message && (
//               <div className={`status-message status-${message.type}`}>
//                 {message.text}
//               </div>
//             )}

//             <div className="input-group">
//               <label htmlFor="expense-input">
//                 What would you like to do?
//               </label>
//               <input
//                 id="expense-input"
//                 type="text"
//                 className="text-input"
//                 placeholder="e.g., add 50 rupees burger to my expenses"
//                 value={userInput}
//                 onChange={(e) => setUserInput(e.target.value)}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter' && !isProcessing) {
//                     handleSubmitInput();
//                   }
//                 }}
//                 disabled={isProcessing}
//                 autoFocus
//               />
//             </div>

//             <button
//               className="btn-primary"
//               onClick={handleSubmitInput}
//               disabled={isProcessing || !userInput.trim()}
//             >
//               {isProcessing ? (
//                 <>
//                   <span className="loading-spinner"></span>
//                   Processing...
//                 </>
//               ) : (
//                 '→ Process Request'
//               )}
//             </button>

//             <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
//               Tip: Try "add expense", "show my expenses", or "create budget"
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className={`floating-expense-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
//       {/* Collapsed State - Floating Button */}
//       <button
//         className="widget-toggle"
//         onClick={() => setIsExpanded(true)}
//         title="Open AI Expense Assistant"
//       >
//         💰
//       </button>

//       {/* Expanded State - Full Widget */}
//       {isExpanded && (
//         <>
//           <div className="widget-header">
//             <h3>💰 AI Expense Assistant</h3>
//             <div className="header-actions">
//               {isAuthenticated && (
//                 <button
//                   className="header-btn"
//                   onClick={() => setCurrentView(currentView === 'settings' ? 'input' : 'settings')}
//                   title="Settings"
//                 >
//                   ⚙️
//                 </button>
//               )}
//               <button
//                 className="header-btn"
//                 onClick={() => setIsExpanded(false)}
//                 title="Minimize"
//               >
//                 ─
//               </button>
//             </div>
//           </div>

//           <div className="widget-content">
//             {renderContent()}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


/**
 * Floating Widget Container
 *
 * Main UI component that manages all views and states
 */

import React, { useState, useEffect } from "react";
import Auth from "./Auth.jsx";
import ResultViewer from "./ExpensesResultUI.jsx";
import Settings from "./Settings.jsx";
import ConfirmAction from "./ConfirmAction.jsx";
import { authAPI, llmAPI } from "./api.js";

/**
 * Tool classification
 * WRITE tools → success message only
 * READ tools → result UI
 */
const READ_TOOLS = new Set([
  "list_expenses",
  "summarize_expenses",
  "monthly_report",
]);

const WRITE_TOOLS = new Set([
  "add_expense",
]);

export default function FloatingWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("input"); // input | confirm | settings | result
  const [user, setUser] = useState(null);

  // Input state
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation + execution
  const [pendingAction, setPendingAction] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [lastTool, setLastTool] = useState(null);

  // UI feedback
  const [message, setMessage] = useState(null);

  /* ---------------- AUTH REHYDRATION ---------------- */

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { jwt, user } = await new Promise((resolve) => {
        chrome.storage.local.get(["jwt", "user"], resolve);
      });

      if (!jwt) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      setIsAuthenticated(true);
      setUser(user);
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData.user);
  };

  /* ---------------- INPUT → PARSE ---------------- */

  const handleSubmitInput = async () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const result = await llmAPI.parseIntent(userInput);

      setPendingAction({
        tool: result.tool,
        args: result.arguments,
      });

      setCurrentView("confirm");
    } catch (err) {
      console.error("Intent parsing error:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------------- CONFIRMATION ---------------- */

  const handleCancelConfirm = () => {
    setPendingAction(null);
    setCurrentView("input");
  };

  const handleExecutionSuccess = (result, tool) => {
    setPendingAction(null);
    setUserInput("");

    // READ tools → show result UI
    if (READ_TOOLS.has(tool)) {
      setExecutionResult(result);
      setLastTool(tool);
      setCurrentView("result");
      return;
    }

    // WRITE tools → success message only
    if (WRITE_TOOLS.has(tool)) {
      setMessage({
        type: "success",
        text: "Expense added successfully ✅",
      });

      setCurrentView("input");
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    // Fallback
    setCurrentView("input");
  };

  /* ---------------- VIEW RENDERING ---------------- */

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Auth onAuthSuccess={handleAuthSuccess} />;
    }

    switch (currentView) {
      case "settings":
        return (
          <Settings
            user={user}
            onClose={() => setCurrentView("input")}
          />
        );

      case "confirm":
        return (
          <ConfirmAction
            tool={pendingAction.tool}
            args={pendingAction.args}
            onCancel={handleCancelConfirm}
            onSuccess={(result) =>
              handleExecutionSuccess(result, pendingAction.tool)
            }
          />
        );

      case "result":
        return (
          <ResultViewer
            result={executionResult}
            tool={lastTool}
          />
        );

      case "input":
      default:
        return (
          <div className="input-view">
            {message && (
              <div className={`status-message status-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="expense-input">
                What would you like to do?
              </label>
              <input
                id="expense-input"
                type="text"
                className="text-input"
                placeholder="e.g., add 50 rupees burger to my expenses"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isProcessing) {
                    handleSubmitInput();
                  }
                }}
                disabled={isProcessing}
                autoFocus
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmitInput}
              disabled={isProcessing || !userInput.trim()}
            >
              {isProcessing ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                "→ Process Request"
              )}
            </button>

            <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
              Tip: Try “add expense”, “show my expenses”, or “monthly report”
            </div>
          </div>
        );
    }
  };

  /* ---------------- ROOT ---------------- */

  return (
    <div
      className={`floating-expense-widget ${
        isExpanded ? "expanded" : "collapsed"
      }`}
    >
      {/* Floating Button */}
      <button
        className="widget-toggle"
        onClick={() => setIsExpanded(true)}
        title="Open AI Expense Assistant"
      >
        💰
      </button>

      {/* Expanded Widget */}
      {isExpanded && (
        <>
          <div className="widget-header">
            <h3>💰 AI Expense Assistant</h3>
            <div className="header-actions">
              {isAuthenticated && (
                <button
                  className="header-btn"
                  onClick={() =>
                    setCurrentView(
                      currentView === "settings" ? "input" : "settings"
                    )
                  }
                  title="Settings"
                >
                  ⚙️
                </button>
              )}
              <button
                className="header-btn"
                onClick={() => setIsExpanded(false)}
                title="Minimize"
              >
                ─
              </button>
            </div>
          </div>

          <div className="widget-content">{renderContent()}</div>
        </>
      )}
    </div>
  );
}
