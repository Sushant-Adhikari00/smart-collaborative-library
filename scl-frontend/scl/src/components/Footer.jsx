import React from 'react';

const Footer = () => {
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
      <aside>
        <p className="font-bold">
          Note-Sharing-Platform <br/>Providing reliable tech since 2025
        </p>
        <p>Copyright © 2025 - All right reserved</p>
      </aside>
      <nav>
        <div className="grid grid-flow-col gap-4">
          <a className="link link-hover">Terms of Service</a>
          <a className="link link-hover">Privacy Policy</a>
        </div>
      </nav>
    </footer>
  );
};

export default Footer;
