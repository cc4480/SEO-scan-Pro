import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import VerifyLinkNotice from './components/VerifyLinkNotice.tsx';
import AppMotion from './motion/AppMotion.tsx';
import Toaster from './ui/Toaster.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <AppMotion />
      <App />
      <VerifyLinkNotice />
      <Toaster />
    </MotionConfig>
  </StrictMode>,
);
