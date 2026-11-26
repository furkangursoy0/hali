import React from 'react';
import { createRoot } from 'react-dom/client';
import PublicWebsite from './PublicWebsite';

const root = document.getElementById('root');
if (root) createRoot(root).render(<PublicWebsite />);
