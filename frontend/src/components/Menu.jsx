import { Link } from "react-router-dom";

import { supabase } from "../supabaseClient";

function Menu({admin}) {

  async function deconnexion() {
    await supabase.auth.signOut();
  }

  return (
    <nav id="menu" style={{ background: "#333", padding: 0 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
        <li style={{ padding: "1rem", borderBottom: "1px solid #555", color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>
          <Link to="/profile" style={{ color: "#fff", textDecoration: "none", fontSize: "1.2rem", fontWeight: "bold" }}>
            Mon Profil
          </Link>
        </li>

        <li style={{ /*borderBottom: "1px solid #555"*/ }}>
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

        { admin && (
          <li>
            <Link to="/statistiques" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
              Statistiques
            </Link>
          </li>
        )}

        {admin && (
          <li>
            <Link to="/alertes" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
              Alertes
            </Link>
          </li>
        )}


        {admin && (
        <li>
          <Link to="/parametres" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Parametres
          </Link>
        </li>
        )}

        {admin && (
        <li>
          <Link to="/invitations" style={{ display: "block", color: "#fff", textDecoration: "none", padding: "1rem" }}>
            Invitations
          </Link>
        </li>
        )}

        <li>
          <button
            onClick={deconnexion}
            style={{
              width: "100%",
              background: "#e74c3c",
              border: "radius: 0 0 8px 8px" ,
              fontSize: "1rem",
              color: "#fff",
              textAlign: "center",
              padding: ".8rem",
              cursor: "pointer"
            }}
          >
            Déconnexion
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;    
