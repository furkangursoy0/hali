import React, { type ReactNode } from 'react';
import BrandMark from './BrandMark.web';

export default function PublicNavbar({ children }: { children: ReactNode }) {
  return (
    <header className="hd-navbar">
      <div className="hd-container hd-navbar-inner">
        <a href="/" aria-label="Halı Dene ana sayfa"><BrandMark /></a>
        <nav className="hd-navbar-links" aria-label="Ana menü">{children}</nav>
        <a className="hd-button hd-nav-login" href="/uygulama">Giriş Yap</a>
      </div>
    </header>
  );
}
