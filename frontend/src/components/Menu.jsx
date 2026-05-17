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

        <li>
          <Link to="/inventaire" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Inventaire
          </Link>
        </li>

        <li>
          <Link to="/statistiques" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Statistiques
          </Link>
        </li>

        <li>
          <Link to="/alertes" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Alertes
          </Link>
        </li>

        <li>
          <Link to="/parametres" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Parametres
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;    
