////une page pour les tests des ventes

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function SaisirVentes() {
  const navigate = useNavigate();
  const [recettes, setRecettes] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    async function chargerRecettes() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Non connecté");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/recettes`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });

        if (!response.ok) throw new Error("Erreur chargement recettes");

        const recettesData = await response.json();
        setRecettes(recettesData);

        // Initialise une ligne de saisie avec la première recette
        if (recettesData.length > 0) {
          setLignes([{ recette_id: recettesData[0].id, quantite_vendue: "" }]);
        }
      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerRecettes();
  }, []);

  function ajouterLigne() {
    if (recettes.length === 0) return;
    setLignes(prev => [...prev, { recette_id: recettes[0].id, quantite_vendue: "" }]);
  }

  function supprimerLigne(index) {
    setLignes(prev => prev.filter((_, i) => i !== index));
  }

  function modifierLigne(index, champ, valeur) {
    setLignes(prev =>
      prev.map((ligne, i) =>
        i === index ? { ...ligne, [champ]: valeur } : ligne
      )
    );
  }

  async function enregistrerVentes(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    const lignesValides = lignes.filter(l => l.quantite_vendue !== "" && Number(l.quantite_vendue) > 0);

    if (lignesValides.length === 0) {
      setErreur("Veuillez saisir au moins une vente.");
      return;
    }

    setEnvoi(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Non connecté");

      const ventes = lignesValides.map(l => ({
        recette_id: Number(l.recette_id),
        quantite_vendue: Number(l.quantite_vendue)
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ventes/add-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ ventes })
      });

      if (!response.ok) throw new Error("Erreur lors de l'enregistrement des ventes");

      setMessage(`${ventes.length} vente(s) enregistrée(s) avec succès.`);

      // Reset
      if (recettes.length > 0) {
        setLignes([{ recette_id: recettes[0].id, quantite_vendue: "" }]);
      }

      setTimeout(() => navigate("/recettes"), 1500);
    } catch (error) {
      setErreur(error.message);
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) return <p>Chargement...</p>;

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Saisir des ventes</h2>

      {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}
      {message && <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>}

      <form onSubmit={enregistrerVentes}>
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            marginBottom: "1.5rem"
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "left" }}>
                  Recette
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", textAlign: "left", width: "180px" }}>
                  Quantité vendue
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", width: "48px" }}></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne, index) => (
                <tr key={index}>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                    <select
                      value={ligne.recette_id}
                      onChange={(e) => modifierLigne(index, "recette_id", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        fontSize: "1rem"
                      }}
                    >
                      {recettes.map(recette => (
                        <option key={recette.id} value={recette.id}>
                          {recette.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={ligne.quantite_vendue}
                      onChange={(e) => modifierLigne(index, "quantite_vendue", e.target.value)}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", textAlign: "center" }}>
                    {lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerLigne(index)}
                        style={{
                          background: "none",
                          border: "1px solid #f1b0b0",
                          borderRadius: "6px",
                          padding: "0.3rem 0.6rem",
                          cursor: "pointer",
                          color: "#e53e3e",
                          fontSize: "1rem"
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={ajouterLigne}
            style={{
              marginTop: "1rem",
              background: "none",
              border: "1px dashed #ccc",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              color: "#555",
              fontSize: "0.9rem",
              width: "100%"
            }}
          >
            + Ajouter une vente
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate("/recettes")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={envoi}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: envoi ? "#999" : "#333",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: envoi ? "default" : "pointer",
              fontSize: "1rem"
            }}
          >
            {envoi ? "Enregistrement..." : "Enregistrer les ventes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SaisirVentes;