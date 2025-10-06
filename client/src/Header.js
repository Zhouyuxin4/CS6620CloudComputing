import React from 'react';
import { Link } from 'react-router-dom';
import './css/Header.css'
import handleLogout from './HomepageAfterLogin.js'

const Header = ({ userName }) => {
  console.log("Header received userName:", userName);
  const handleScroll = (className) => {
    setTimeout(() => {
        const element = document.querySelector(className);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }

  return (
    <header>
      <nav>
        <div className="logo">
          <Link to="/"><img src={require('./image/logo.png')} alt="Your Own Planet" className="logo-image" />
          </Link>
        </div>
        <div className="nav-links">
        {userName ? (
          <>
            <Link to="/HomepageAfterLogin">Footprints</Link>
            <Link to="/search">Search</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/" onClick={handleLogout}>Sign Out</Link>  

          </>
          ) : (
            <>
              <Link to="/" onClick={() => handleScroll('.intro-box')}>Home</Link>
              <Link to="/" onClick={() => handleScroll('.detail-intro')}>About</Link>
              <Link to="/signin">Sign In</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;