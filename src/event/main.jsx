// Entry for the public registration page (register.html): only the form, not the office system, so it loads fast on phones.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RegisterPublic from './RegisterPublic';

createRoot(document.getElementById('root')).render(<StrictMode><RegisterPublic /></StrictMode>);
