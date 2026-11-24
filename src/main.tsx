import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import 'katex/dist/katex.min.css';
import './styles/tokens.css';
import './styles/global.css';
import { router } from './app/router';
import { startAccount } from './features/account/account';
import { initPlatform } from './platform/platform';

initPlatform();
void startAccount();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
