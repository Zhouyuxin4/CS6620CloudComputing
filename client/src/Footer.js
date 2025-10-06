import React from 'react';
import './css/Footer.css'


const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <p className='footer-head'>About Us</p>
          <p>We help travelers create meaningful journeys.</p>
        </div>
        <div className="footer-section">
          <p className='footer-head'>Contact</p>
          <p>Email: info@yourownplanet.com</p>
        </div>
        <div className="footer-section">
          <p className='footer-head'>Follow Us</p>
          <p>Instagram: YourOwnPlanet</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Your Own Planet. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;