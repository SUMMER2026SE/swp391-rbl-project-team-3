import React from 'react'
import ReactDOM from 'react-dom/client'
import 'react-datepicker/dist/react-datepicker.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
