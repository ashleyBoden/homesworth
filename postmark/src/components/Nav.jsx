import { Link } from "react-router-dom";
import styles from "./Nav.module.css";
import { useState } from "react";

export default function Nav() {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
      <nav className={styles.nav}>
        <div className={styles.home}>
            <Link to="/">
                <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" fill="none" stroke="#0D9488" strokeWidth="2"/>
                    <circle cx="11" cy="11" r="4" fill="none" stroke="#0D9488" strokeWidth="1.5"/>
                </svg>
                Homesworth
            </Link>
        </div>
        <ul className={`${styles.navList} ${menuOpen ? styles.navListOpen : ""}`}>          
          <li className={styles.navItem}><Link to="/howitworks" onClick={() => setMenuOpen(false)}>How it works</Link></li>
          <li className={styles.navItem}><Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link></li>
        </ul>

        <button 
          className={styles.hamburger} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
    </nav>
  )
}