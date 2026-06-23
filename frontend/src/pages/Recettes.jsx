import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Recettes() {
  const [recettes, setRecettes] = useState([]);
  const [coutsMatieres, setCoutsMatieres] = useState({});
  const [erreur, setErreur] = useState("");

  async function chargerRecettes() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setErreur("Utilisateur non connecté"); return; }

      const token = data.session.access_token;

      const [recettesData, coutsData] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/recettes`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => { if (!r.ok) throw new Error("Erreur lors du chargement des recettes"); return r.json(); }),
        fetch(`${import.meta.env.VITE_API_URL}/stats/couts-matieres`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      setRecettes(recettesData);

      // Index par recette_id pour accès rapide
      const coutsIndex = {};
      coutsData.forEach(c => { coutsIndex[c.recette_id] = c; });
      setCoutsMatieres(coutsIndex);

    } catch (error) {
      setErreur(error.message);
    }
  }

  async function supprimerRecette(id) {
    const confirmation = confirm("Supprimer cette recette ?");
    if (!confirmation) return;

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recettes/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      chargerRecettes();
    } catch (error) {
      setErreur(error.message);
    }
  }

  useEffect(() => { chargerRecettes(); }, []);

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Recettes</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <Link to="/saisir-ventes" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
          + Saisir des ventes
        </Link>
        <Link to="/ajout-recette" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
          + Créer une recette
        </Link>
      </div>

      {recettes.length === 0 ? (
        <p>Aucune recette créée pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {recettes.map((recette) => {
            const couts = coutsMatieres[recette.id];
            return (
              <div
                key={recette.id}
                style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
              >
                {/* Header recette */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0 }}>{recette.nom}</h3>
                  {/* Prix de vente */}
                  {recette.prix_vente != null
                    ? <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#333" }}>{recette.prix_vente} €</span>
                    : <span style={{ color: "#aaa", fontSize: "0.85rem" }}>Prix non renseigné</span>
                  }
                </div>

                {/* Coût matière + marge */}
                {couts && (
                  <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      Coût matière : <strong>{couts.cout_matiere} €</strong>
                      {couts.ingredients_sans_prix > 0 && (
                        <span style={{ color: "#b7791f", marginLeft: "0.4rem" }}>
                          ({couts.ingredients_sans_prix} ingrédient{couts.ingredients_sans_prix > 1 ? "s" : ""} sans prix)
                        </span>
                      )}
                    </div>
                    {couts.marge != null && (
                      <div style={{ fontSize: "0.85rem" }}>
                        Marge : <strong style={{ color: couts.marge >= 0 ? "#38a169" : "#e53e3e" }}>{couts.marge} €</strong>
                      </div>
                    )}
                    {couts.taux_marge != null && (
                      <div style={{ fontSize: "0.85rem" }}>
                        Taux : <strong style={{ color: couts.taux_marge >= 30 ? "#38a169" : couts.taux_marge >= 15 ? "#b7791f" : "#e53e3e" }}>
                          {couts.taux_marge} %
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingrédients */}
                {!recette.ingredients || recette.ingredients.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Aucun ingrédient renseigné.</p>
                ) : (
                  <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem" }}>
                    {recette.ingredients.map((ingredient, index) => (
                      <li key={index} style={{ fontSize: "0.9rem", color: "#555" }}>
                        {ingredient.produit_ingredient_nom} — {ingredient.quantite} {ingredient.unite_nom}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                  <Link
                    to={`/modifier-recette/${recette.id}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", backgroundColor: "#f5f5f5", borderRadius: "8px", textDecoration: "none", fontSize: "1.2rem", border: "1px solid #ddd" }}
                  >
                    📝
                  </Link>
                  <button
                    onClick={() => supprimerRecette(recette.id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", backgroundColor: "#fff5f5", border: "1px solid #f1b0b0", borderRadius: "8px", cursor: "pointer", fontSize: "1.2rem" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Recettes;