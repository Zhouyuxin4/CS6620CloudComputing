import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './css/Layout.css'

const Layout = ({ children, userName }) => {
  return (
    <div className="layout">
      <Header userName={userName} />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;