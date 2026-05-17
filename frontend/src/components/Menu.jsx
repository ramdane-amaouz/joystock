import { Link } from "react-router-dom";

function Menu() {
  return (
    <nav id="menu" style={{ background: "#333", padding: 0 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
        <li style={{ borderBottom: "1px solid #555" }}>
          <Link to="/" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Accueil
          </Link>
        </li>
        <li>
          <Link to="/produits" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Produits
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;    
