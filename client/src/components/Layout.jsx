import React, { useState } from 'react';
import { Header } from './Header';
import { Drawer } from './Drawer';

export const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onToggleDrawer={() => setDrawerOpen(prev => !prev)} />
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main
        style={{
          flex: 1,
          padding: '28px 24px',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        {children}
      </main>
    </div>
  );
};
