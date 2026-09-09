import React, { useState } from 'react';
import { Header } from './Header';
import { Drawer } from './Drawer';

export const Layout = ({ children, headerProps }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        onToggleDrawer={() => setDrawerOpen(prev => !prev)} 
        {...headerProps}
      />
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main
        className="main-content"
        style={{
          flex: 1,
          padding: '24px 20px',
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
