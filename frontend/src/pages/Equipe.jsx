import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ONGLETS = [
  { id: "actifs", label: "👥 Membres actifs" },
  { id: "inactifs", label: "🚫 Membres inactifs" }
];

function Equipe() {
  const [membres, setMembres] = useState([]);
  const [inactifs, setInactifs] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [confirmation, setConfirmation] = useState(null);
  const [message, setMessage] = useState("");
  const [ongletActif, setOngletActif] = useState("actifs");

  useEffect(() => {
    chargerMembres();
  }, []);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Utilisateur non connecté");
    return data.session.access_token;
  }

  async function chargerMembres() {
    try {
      const token = await getToken();

      const [actifsRes, inactifsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/profiles/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/profiles/inactifs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!actifsRes.ok) throw new Error("Erreur lors du chargement de l'équipe");
      if (!inactifsRes.ok) throw new Error("Erreur lors du chargement des inactifs");

      setMembres(await actifsRes.json());
      setInactifs(await inactifsRes.json());
    } catch (error) {
      setErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  async function desactiverMembre(user_id) {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${user_id}/desactiver`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur lors de la désactivation");
      }
      setMessage("Membre désactivé avec succès.");
      setConfirmation(null);
      const membre = membres.find(m => m.id === user_id);
      setMembres(prev => prev.filter(m => m.id !== user_id));
      if (membre) setInactifs(prev => [...prev, { ...membre, deleted_at: new Date().toISOString() }]);
    } catch (error) {
      setErreur(error.message);
      setConfirmation(null);
    }
  }

  async function reactiverMembre(user_id) {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${user_id}/reactiver`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur lors de la réactivation");
      }
      setMessage("Membre réactivé avec succès.");
      setConfirmation(null);
      const membre = inactifs.find(m => m.id === user_id);
      setInactifs(prev => prev.filter(m => m.id !== user_id));
      if (membre) setMembres(prev => [...prev, { ...membre, deleted_at: null }]);
    } catch (error) {
      setErreur(error.message);
      setConfirmation(null);
    }
  }

  async function changerRole(user_id, nouveauRole) {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${user_id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: nouveauRole })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur lors du changement de rôle");
      }
      setMessage(`Rôle mis à jour : ${nouveauRole}`);
      setMembres(prev => prev.map(m => m.id === user_id ? { ...m, role: nouveauRole } : m));
    } catch (error) {
      setErreur(error.message);
    }
  }

  if (chargement) return <p>Chargement de l'équipe...</p>;

  const styleBouton = (couleur, bg = "white") => ({
    padding: "0.3rem 0.75rem",
    backgroundColor: bg,
    color: couleur,
    border: `1px solid ${couleur}`,
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.85rem"
  });

  const styleConfirmBouton = (bg, color) => ({
    padding: "0.3rem 0.75rem",
    backgroundColor: bg,
    color,
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.85rem"
  });

  function BadgeRole({ role }) {
    return (
      <span style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "bold",
        backgroundColor: role === "admin" ? "#ebf8ff" : "#f0fff4",
        color: role === "admin" ? "#2b6cb0" : "#276749"
      }}>
        {role}
      </span>
    );
  }

  function TableauMembres({ liste, actif }) {
    if (liste.length === 0) {
      return (
        <div style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          color: "#555"
        }}>
          {actif ? "Aucun membre actif trouvé." : "Aucun membre inactif."}
        </div>
      );
    }

    return (
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ backgroundColor: "#f9f9f9" }}>
            <th style={{ borderBottom: "2px solid #ddd", padding: "0.75rem" }}>Nom</th>
            <th style={{ borderBottom: "2px solid #ddd", padding: "0.75rem" }}>Prénom</th>
            <th style={{ borderBottom: "2px solid #ddd", padding: "0.75rem" }}>Email</th>
            <th style={{ borderBottom: "2px solid #ddd", padding: "0.75rem" }}>Rôle</th>
            <th style={{ borderBottom: "2px solid #ddd", padding: "0.75rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {liste.map((membre) => (
            <tr key={membre.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>
                {membre.nom}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                {membre.prenom}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                {membre.email}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                <BadgeRole role={membre.role} />
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                {actif ? (
                  confirmation === `desactiver-${membre.id}` ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#555" }}>Désactiver ?</span>
                      <button onClick={() => desactiverMembre(membre.id)} style={styleConfirmBouton("#e53e3e", "white")}>Oui</button>
                      <button onClick={() => setConfirmation(null)} style={styleConfirmBouton("#eee", "#333")}>Non</button>
                    </div>
                  ) : confirmation === `role-${membre.id}` ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#555" }}>
                        Passer en {membre.role === "admin" ? "employé" : "admin"} ?
                      </span>
                      <button
                        onClick={() => changerRole(membre.id, membre.role === "admin" ? "employe" : "admin")}
                        style={styleConfirmBouton("#333", "white")}
                      >
                        Oui
                      </button>
                      <button onClick={() => setConfirmation(null)} style={styleConfirmBouton("#eee", "#333")}>Non</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => setConfirmation(`role-${membre.id}`)}
                        style={styleBouton("#2b6cb0")}
                      >
                        Changer rôle
                      </button>
                      <button
                        onClick={() => setConfirmation(`desactiver-${membre.id}`)}
                        style={styleBouton("#e53e3e")}
                      >
                        Désactiver
                      </button>
                    </div>
                  )
                ) : (
                  confirmation === `reactiver-${membre.id}` ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#555" }}>Réactiver ?</span>
                      <button onClick={() => reactiverMembre(membre.id)} style={styleConfirmBouton("#38a169", "white")}>Oui</button>
                      <button onClick={() => setConfirmation(null)} style={styleConfirmBouton("#eee", "#333")}>Non</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmation(`reactiver-${membre.id}`)}
                      style={styleBouton("#38a169")}
                    >
                      Réactiver
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Équipe</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {/* Onglets */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "white",
        borderBottom: "1px solid #eee",
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem 0",
        marginBottom: "2rem"
      }}>
        {ONGLETS.map(onglet => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "20px",
              border: "1px solid #ccc",
              backgroundColor: ongletActif === onglet.id ? "#333" : "white",
              color: ongletActif === onglet.id ? "white" : "#333",
              cursor: "pointer",
              fontWeight: ongletActif === onglet.id ? "bold" : "normal",
              fontSize: "0.9rem"
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {ongletActif === "actifs" ? (
        <TableauMembres liste={membres} actif={true} />
      ) : (
        <TableauMembres liste={inactifs} actif={false} />
      )}
    </div>
  );
}

export default Equipe;