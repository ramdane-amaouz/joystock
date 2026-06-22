import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const BADGES = {
  critique: { label: "Critique", bg: "#fff5f5", color: "#e53e3e", border: "#f1b0b0" },
  attention: { label: "Attention", bg: "#fffbf0", color: "#b7791f", border: "#f6c90e" },
  ok:        { label: "OK",       bg: "#f0fff4", color: "#38a169", border: "#9ae6b4" },
  inconnu:   { label: "Inconnu",  bg: "#f5f5f5", color: "#888",    border: "#ccc"    }
};

const FILTRES = [
  { id: "tous",      label: "Tous" },
  { id: "critique",  label: "🔴 Critique" },
  { id: "attention", label: "🟡 Attention" },
  { id: "ok",        label: "🟢 OK" },
  { id: "inconnu",   label: "⚪ Inconnu" }
];

const PERIODES = [
  { jours: 7,  label: "7 jours" },
  { jours: 15, label: "15 jours" },
  { jours: 30, label: "1 mois" }
];

function Badge({ urgence }) {
  const style = BADGES[urgence] || BADGES.inconnu;
  return (
    <span style={{
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "0.8rem",
      fontWeight: "bold",
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`
    }}>
      {style.label}
    </span>
  );
}

function Previsions() {
  const [previsions, setPrevisions] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState("tous");
  const [periode, setPeriode] = useState(30);

  useEffect(() => {
    async function chargerPrevisions() {
      try {
        setChargement(true);
        setErreur("");
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Utilisateur non connecté");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/stats/previsions?jours=${periode}`,
          { headers: { Authorization: `Bearer ${data.session.access_token}` } }
        );

        if (!response.ok) throw new Error("Erreur lors du chargement des prévisions");

        const data2 = await response.json();
        setPrevisions(data2);
      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerPrevisions();
  }, [periode]);

  const previsionsFiltrees = filtre === "tous"
    ? previsions
    : previsions.filter(p => p.urgence === filtre);

  const nbCritique  = previsions.filter(p => p.urgence === "critique").length;
  const nbAttention = previsions.filter(p => p.urgence === "attention").length;
  const nbInconnu   = previsions.filter(p => p.urgence === "inconnu").length;

  return (
    <div>
      {/* Header avec sélecteur de période */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ textAlign: "left", margin: "0 0 0.25rem" }}>
            Prévisions de réapprovisionnement
          </h2>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: 0 }}>
            Basé sur la consommation moyenne des {PERIODES.find(p => p.jours === periode)?.label}
          </p>
        </div>

        {/* Sélecteur de période */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {PERIODES.map(p => (
            <button
              key={p.jours}
              onClick={() => setPeriode(p.jours)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #ccc",
                backgroundColor: periode === p.jours ? "#333" : "white",
                color: periode === p.jours ? "white" : "#333",
                cursor: "pointer",
                fontWeight: periode === p.jours ? "bold" : "normal",
                fontSize: "0.85rem"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement des prévisions...</p>
      ) : (
        <>
          {/* Cartes résumé */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <div style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "10px", backgroundColor: "#fff5f5", border: "1px solid #f1b0b0" }}>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.25rem" }}>Critiques</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#e53e3e", margin: 0 }}>{nbCritique}</p>
              <p style={{ fontSize: "0.8rem", color: "#e53e3e", margin: "0.25rem 0 0" }}>rupture &lt; 3 jours</p>
            </div>

            <div style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "10px", backgroundColor: "#fffbf0", border: "1px solid #f6c90e" }}>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.25rem" }}>Attention</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#b7791f", margin: 0 }}>{nbAttention}</p>
              <p style={{ fontSize: "0.8rem", color: "#b7791f", margin: "0.25rem 0 0" }}>rupture &lt; 7 jours</p>
            </div>

            <div style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "10px", backgroundColor: "#f0fff4", border: "1px solid #9ae6b4" }}>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.25rem" }}>OK</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#38a169", margin: 0 }}>
                {previsions.filter(p => p.urgence === "ok").length}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#38a169", margin: "0.25rem 0 0" }}>stock suffisant</p>
            </div>

            <div style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "10px", backgroundColor: "#f5f5f5", border: "1px solid #ccc" }}>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.25rem" }}>Inconnus</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#888", margin: 0 }}>{nbInconnu}</p>
              <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.25rem 0 0" }}>aucune vente récente</p>
            </div>
          </div>

          {/* Filtres urgence */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {FILTRES.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "20px",
                  border: "1px solid #ccc",
                  backgroundColor: filtre === f.id ? "#333" : "white",
                  color: filtre === f.id ? "white" : "#333",
                  cursor: "pointer",
                  fontWeight: filtre === f.id ? "bold" : "normal",
                  fontSize: "0.9rem"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
            {previsionsFiltrees.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center" }}>Aucun produit dans cette catégorie.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Produit</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Catégorie</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Stock actuel</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Conso/jour</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Jours restants</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>À commander</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Urgence</th>
                  </tr>
                </thead>
                <tbody>
                  {previsionsFiltrees.map(p => (
                    <tr key={p.produit_id} style={{
                      backgroundColor: p.urgence === "critique" ? "#fff5f5"
                        : p.urgence === "attention" ? "#fffbf0"
                        : "transparent"
                    }}>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>
                        {p.produit_nom}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", color: "#555" }}>
                        {p.categorie}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {p.stock_theorique} <span style={{ color: "#888", fontSize: "0.85rem" }}>{p.unite}</span>
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {p.conso_par_jour > 0
                          ? <>{p.conso_par_jour} <span style={{ color: "#888", fontSize: "0.85rem" }}>{p.unite}/j</span></>
                          : <span style={{ color: "#aaa" }}>—</span>
                        }
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {p.jours_avant_rupture !== null
                          ? <strong style={{ color: p.urgence === "critique" ? "#e53e3e" : p.urgence === "attention" ? "#b7791f" : "#38a169" }}>
                              {p.jours_avant_rupture}j
                            </strong>
                          : <span style={{ color: "#aaa" }}>—</span>
                        }
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {p.quantite_a_commander > 0
                          ? <strong style={{ color: "#e53e3e" }}>{p.quantite_a_commander} {p.unite}</strong>
                          : <span style={{ color: "#38a169" }}>✓</span>
                        }
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        <Badge urgence={p.urgence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ color: "#aaa", fontSize: "0.8rem", marginTop: "1rem" }}>
            * La quantité à commander est calculée pour couvrir 7 jours de consommation.
            Les produits "inconnus" n'ont pas eu de ventes sur la période sélectionnée.
          </p>
        </>
      )}
    </div>
  );
}

export default Previsions;