import React from 'react';
import Navbar from './Navbar';
import NavigationMenu from './NavigationMenu';
import Footer from './Footer';
import AIFloatingButton from '../home/AIFloatingButton';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 shadow-md">
        <Navbar />
        <NavigationMenu />
      </div>

      <main className="flex-grow">
        {children}
      </main>

      <AIFloatingButton />
      <Footer />
    </div>
  );
};

export default MainLayout;