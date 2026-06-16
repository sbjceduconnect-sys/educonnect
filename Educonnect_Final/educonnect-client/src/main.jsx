console.log('MAIN.JSX: Script loaded.');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

console.log('MAIN.JSX: Importing done, locating root element.');
const container = document.getElementById('root');
if (!container) {
  console.error('MAIN.JSX: Root element #root was NOT found in the DOM!');
} else {
  console.log('MAIN.JSX: Root element #root found, initiating createRoot.', container);
  const root = createRoot(container);
  console.log('MAIN.JSX: Calling root.render...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('MAIN.JSX: root.render called.');
}

