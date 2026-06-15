import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

function Inventaire() {
  const [inventaires, setInventaires] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerInventaires() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setErreur("Utilisateur non connecté");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/inventaires/inventaires_liste`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          }
        );

        if (!response.ok) throw new Error("Erreur lors du chargement des inventaires");

        const inventairesData = await response.json();
        setInventaires(inventairesData);
      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerInventaires();
  }, []);

  function badgeStyle(type) {
    const base = {
      display: "inline-block",
      padding: "0.25rem 0.6rem",
      borderRadius: "12px",
      fontSize: "0.8rem",
      fontWeight: "bold"
    };
    if (type === "stock") return { ...base, backgroundColor: "#e8f5e9", color: "#2e7d32" };
    if (type === "reception") return { ...base, backgroundColor: "#e3f2fd", color: "#1565c0" };
    return { ...base, backgroundColor: "#f5f5f5", color: "#555" };
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Inventaire</h2>

      {/* Actions */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <Link
          to="/demarrer-inventaire"
          style={{
            flex: 1,
            textAlign: "center",
            border: "1px solid #ccc",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: "black",
            textDecoration: "none",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}
        >
          📋 Démarrer un inventaire
        </Link>

        <Link
          to="/reception-livraison"
          style={{
            flex: 1,
            textAlign: "center",
            border: "1px solid #ccc",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: "black",
            textDecoration: "none",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}
        >
          📦 Réceptionner une livraison
        </Link>
      </div>

      {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}

      {/* Liste des inventaires */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Historique des inventaires</h3>

        {chargement ? (
          <p style={{ color: "#888" }}>Chargement...</p>
        ) : inventaires.length === 0 ? (
          <p style={{ color: "#888" }}>Aucun inventaire enregistré pour le moment.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "left" }}>Date</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "left" }}>Type</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "left" }}>Réalisé par</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "right" }}>Export</th>
              </tr>
            </thead>
            <tbody>
              {inventaires.map((inventaire) => (
                <tr key={inventaire.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                    {new Date(inventaire.date_inventaire).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "2-digit", year: "numeric"
                    })}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                    <span style={badgeStyle(inventaire.type)}>
                      {inventaire.type === "stock" ? "Inventaire" : "Réception"}
                    </span>
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", color: "#555" }}>
                    {inventaire.utilisateur_prenom} {inventaire.utilisateur_nom}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", textAlign: "right" }}>
                    <button
                      onClick={() => exporterCSV(inventaire.id, inventaire.date_inventaire, inventaire.type)}
                      style={{
                        background: "none",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "0.3rem 0.75rem",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "#333"
                      }}
                    >
                      ⬇️ CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  async function exporterCSV(inventaireId, date, type) {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventaires/${inventaireId}/details`,
        { headers: { Authorization: `Bearer ${data.session.access_token}` } }
      );

      if (!response.ok) throw new Error("Erreur export");

      const lignes = await response.json();

      // Génération CSV
      const entete = "Produit,Catégorie,Unité,Quantité\n";
      const contenu = lignes.map(l =>
        `${l.produit_nom},${l.categorie},${l.unite},${l.quantite}`
      ).join("\n");

      const csv = entete + contenu;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date(date).toLocaleDateString("fr-FR").replace(/\//g, "-");
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `inventaire_${type}_${dateStr}.csv`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur lors de l'export : " + error.message);
    }
  }
}

export default Inventaire;