import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import AppV2 from '@/AppV2';
import '@/index.css';
import './styles/globals.css';
import './styles/page-layout.css';

// 🧪 TEST: Basculer entre ancien et nouveau système de navigation
// true = Nouveau système (NavbarV2 + ScrollManager)
// false = Ancien système (Navbar + ScrollToTop)  
const USE_NEW_NAVIGATION = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    {USE_NEW_NAVIGATION ? <AppV2 /> : <App />}
  </StrictMode>
);
