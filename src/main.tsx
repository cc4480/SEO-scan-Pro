import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VerifyLinkNotice from './components/VerifyLinkNotice.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <VerifyLinkNotice />
  </StrictMode>,
);
