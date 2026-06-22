import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ONGLETS = [
  { id: "alertes-stock", label: "⚠️ Alertes stock" },
  { id: "ecarts-inventaire", label: "📊 Écarts inventaire" }
];

function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [ecarts, setEcarts] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState("alertes-stock");

  useEffect(() => {
    async function chargerAlertes() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Utilisateur non connecté");

        const token = data.session.access_token;

        const [alertesData, ecartsData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/stats/alertes-stock`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => {
            if (!r.ok) throw new Error("Erreur lors du chargement des alertes");
            return r.json();
          }),
          fetch(`${import.meta.env.VITE_API_URL}/stats/ecarts-inventaire`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => {
            if (!r.ok) throw new Error("Erreur lors du chargement des écarts");
            return r.json();
          })
        ]);

        setAlertes(alertesData);

        // Écarts significatifs > 10% d'écart relatif
        const ecartsSignificatifs = ecartsData.filter(e =>
          e.stock_theorique_attendu > 0 &&
          Math.abs(e.ecart / e.stock_theorique_attendu) > 0.1
        );
        setEcarts(ecartsSignificatifs);

      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerAlertes();
  }, []);

  if (chargement) return <p>Chargement des alertes...</p>;

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Alertes</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {/* Onglets sticky */}
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
            onClick={() => {
              setOngletActif(onglet.id);
              document.getElementById(onglet.id)?.scrollIntoView({ behavior: "smooth" });
            }}
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

      {/* ── Section alertes stock ── */}
      <div id="alertes-stock" style={{ marginBottom: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Alertes de stock</h3>

        {alertes.length === 0 ? (
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            textAlign: "center",
            color: "#555"
          }}>
            ✅ Aucune alerte — tous les produits sont au-dessus du seuil critique.
          </div>
        ) : (
          <>
            <p style={{ marginBottom: "1rem", color: "#888" }}>
              {alertes.length} produit{alertes.length > 1 ? "s" : ""} en dessous du seuil d'alerte
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#fff5f5" }}>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Produit</th>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Catégorie</th>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Stock théorique</th>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Seuil d'alerte</th>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Écart</th>
                  <th style={{ borderBottom: "2px solid #f1b0b0", padding: "0.75rem" }}>Unité</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((alerte) => (
                  <tr key={alerte.produit_id}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>
                      {alerte.produit_nom}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                      {alerte.categorie}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", color: "#e53e3e" }}>
                      {alerte.stock_theorique}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                      {alerte.seuil_alerte}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", color: "#e53e3e" }}>
                      {alerte.ecart}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                      {alerte.unite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ── Section écarts inventaire ── */}
      <div id="ecarts-inventaire">
        <h3 style={{ marginBottom: "1rem" }}>Écarts d'inventaire</h3>
        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Produits avec un écart &gt; 10% entre stock théorique attendu et stock réel compté lors du dernier inventaire.
        </p>

        {ecarts.length === 0 ? (
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            textAlign: "center",
            color: "#555"
          }}>
            ✅ Aucun écart significatif détecté lors du dernier inventaire.
          </div>
        ) : (
          <>
            <p style={{ marginBottom: "1rem", color: "#888" }}>
              {ecarts.length} produit{ecarts.length > 1 ? "s" : ""} avec écart &gt; 10%
              {ecarts[0]?.date_inventaire && (
                <span style={{ marginLeft: "0.5rem" }}>
                  — inventaire du {new Date(ecarts[0].date_inventaire).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              )}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#fffbf0" }}>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Produit</th>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Catégorie</th>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Théorique attendu</th>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Réel compté</th>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Écart</th>
                  <th style={{ borderBottom: "2px solid #f6c90e", padding: "0.75rem" }}>Unité</th>
                </tr>
              </thead>
              <tbody>
                {ecarts.map((e) => (
                  <tr key={e.produit_id}>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem", fontWeight: "bold" }}>
                      {e.produit_nom}
                    </td>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem" }}>
                      {e.categorie}
                    </td>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem" }}>
                      {e.stock_theorique_attendu}
                    </td>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem" }}>
                      {e.quantite_reelle}
                    </td>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem", fontWeight: "bold", color: e.ecart < 0 ? "#e53e3e" : "#38a169" }}>
                      {e.ecart > 0 ? "+" : ""}{e.ecart}
                    </td>
                    <td style={{ borderBottom: "1px solid #fef3c7", padding: "0.75rem" }}>
                      {e.unite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Alertes;