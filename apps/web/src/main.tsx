import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './shared/styles/global.css';
import './shared/styles/stage3.css';
import './shared/styles/stage4.css';

createRoot(document.getElementById('root')!).render(<App />);
