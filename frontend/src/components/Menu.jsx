import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ITEMS = [
  { to: "/",            label: "Tableau de bord", icone: "🏠", end: true,  admin: false },
  { to: "/produits",    label: "Produits",         icone: "📦", end: false, admin: false },
  { to: "/inventaire",  label: "Inventaire",       icone: "📋", end: false, admin: false },
  { to: "/statistiques",label: "Statistiques",     icone: "📊", end: false, admin: true  },
  { to: "/recettes",    label: "Recettes",         icone: "🍽️", end: false, admin: true  },
  { to: "/alertes",     label: "Alertes",          icone: "⚠️", end: false, admin: true  },
  { to: "/previsions",  label: "Prévisions",       icone: "🔮", end: false, admin: true  },
  { to: "/invitations", label: "Invitations",      icone: "✉️", end: false, admin: true  },
  { to: "/equipe",      label: "Équipe",           icone: "👥", end: false, admin: true  },
];

function Menu({ admin, reduit, setReduit }) {
  async function deconnexion() {
    await supabase.auth.signOut();
  }

  const lienStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: reduit ? 0 : "0.75rem",
    justifyContent: reduit ? "center" : "flex-start",
    color: isActive ? "#fff" : "#ccc",
    textDecoration: "none",
    padding: reduit ? "1rem 0" : "1rem",
    backgroundColor: isActive ? "#555" : "transparent",
    borderLeft: isActive ? "3px solid #fff" : "3px solid transparent",
    transition: "all 0.2s",
    fontSize: "1rem",
    whiteSpace: "nowrap",
    overflow: "hidden"
  });

  return (
    <nav style={{ background: "#333", padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Profil */}
        <li style={{ borderBottom: "1px solid #555" }}>
          <NavLink to="/profile" style={lienStyle}>
            <span style={{ fontSize: reduit ? "1.4rem" : "1.1rem" }}>👤</span>
            {!reduit && <span style={{ fontWeight: "bold" }}>Mon Profil</span>}
          </NavLink>
        </li>

        {/* Liens */}
        {ITEMS.filter(item => !item.admin || admin).map(item => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} style={lienStyle} title={reduit ? item.label : ""}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icone}</span>
              {!reduit && item.label}
            </NavLink>
          </li>
        ))}

        {/* Déconnexion */}
        <li style={{ marginTop: "auto" }}>
          <button
            onClick={deconnexion}
            title={reduit ? "Déconnexion" : ""}
            style={{
              width: "100%",
              background: "#e74c3c",
              border: "none",
              fontSize: "1rem",
              color: "#fff",
              textAlign: "center",
              padding: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <span>🚪</span>
            {!reduit && "Déconnexion"}
          </button>
        </li>
      </ul>

      {/* Bouton réduire/agrandir */}
      <button
        onClick={() => setReduit(!reduit)}
        title={reduit ? "Agrandir le menu" : "Réduire le menu"}
        style={{
          width: "100%",
          background: "#2a2a2a",
          border: "none",
          borderTop: "1px solid #555",
          color: "#aaa",
          padding: "0.6rem",
          cursor: "pointer",
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem"
        }}
      >
        {reduit ? "▶" : "◀ Réduire"}
      </button>
    </nav>
  );
}

export default Menu;