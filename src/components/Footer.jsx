import './Footer.css';
import { Link } from 'react-router-dom';

function Footer({ hasScrolled }) {
  return (
    <footer className={hasScrolled ? 'scrolled' : ''}>
      <nav>
        <Link to="/learn">Learn</Link>
        <Link to="/trade">Invest</Link>
        <Link to="/about">About</Link>
      </nav>

      <div className="credits">
        made with <span className="heart">💜</span> by mathGang
      </div>
    </footer>
  );
}

export default Footer; 