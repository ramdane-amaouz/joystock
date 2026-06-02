import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerAlertes() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Utilisateur non connecté");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/stats/alertes-stock`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          }
        );

        if (!response.ok) throw new Error("Erreur lors du chargement des alertes");

        const data2 = await response.json();
        setAlertes(data2);
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
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Alertes de stock</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {alertes.length === 0 ? (
        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            textAlign: "center",
            color: "#555"
          }}
        >
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
  );
}

export default Alertes;