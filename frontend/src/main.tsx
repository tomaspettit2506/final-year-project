import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from "./Context/AuthContext";
import { ThemeProvider } from "./Context/ThemeContext";
import { BrowserRouter } from 'react-router-dom';
import { BoardThemeProvider } from './Context/BoardThemeContext';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BoardThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BoardThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);