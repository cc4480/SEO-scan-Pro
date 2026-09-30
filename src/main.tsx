import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import VerifyLinkNotice from './components/VerifyLinkNotice.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
      <VerifyLinkNotice />
    </MotionConfig>
  </StrictMode>,
);
