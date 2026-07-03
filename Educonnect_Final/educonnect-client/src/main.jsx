// Safe DOM guard to prevent React NotFoundError: Failed to execute 'removeChild' on 'Node'
if (typeof window !== 'undefined' && typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (console) console.warn('Cannot remove child, parent is not current node:', child);
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Cannot insert child, reference parent is not current node:', referenceNode);
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

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

