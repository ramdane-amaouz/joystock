import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Recettes() {
  const [recettes, setRecettes] = useState([]);
  const [erreur, setErreur] = useState("");

  async function chargerRecettes() {
    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setErreur("Utilisateur non connecté");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recettes`,
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des recettes");
      }

      const recettesData = await response.json();
      setRecettes(recettesData);

    } catch (error) {
      setErreur(error.message);
    }
  }

  async function supprimerRecette(id) {
    const confirmation = confirm("Supprimer cette recette ?");

    if (!confirmation) return;

    try {
      const { data } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recettes/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      chargerRecettes();

    } catch (error) {
      setErreur(error.message);
    }
  }

  useEffect(() => {
    chargerRecettes();
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Recettes
      </h2>

      {erreur && (
        <p style={{ color: "red" }}>
          {erreur}
        </p>
      )}

      <div style={{ marginBottom: "2rem", textAlign: "right" }}>
        <Link
          to="/ajout-recette"
          style={{
            color: "#007BFF",
            textDecoration: "none",
            fontSize: "1.1rem"
          }}
        >
          + Créer une recette
        </Link>
      </div>

      <Link to="/saisir-ventes" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
        + Saisir des ventes
      </Link>

      {recettes.length === 0 ? (
        <p>Aucune recette créée pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {recettes.map((recette) => (
            <div
              key={recette.id}
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
              }}
            >
              <h3>{recette.nom}</h3>

              {!recette.ingredients || recette.ingredients.length === 0 ? (
                <p>Aucun ingrédient renseigné.</p>
              ) : (
                <ul>
                  {recette.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.produit_ingredient_nom} — {ingredient.quantite}{" "}
                      {ingredient.unite_nom}
                    </li>
                  ))}
                </ul>
              )}

                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        marginTop: "1rem",
                        justifyContent: "flex-end"
                    }}
                    >
                    <Link
                        to={`/modifier-recette/${recette.id}`}
                        style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "42px",
                        height: "42px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontSize: "1.2rem",
                        transition: "0.2s",
                        border: "1px solid #ddd"
                        }}
                    >
                        📝
                    </Link>

                    <button
                        onClick={() => supprimerRecette(recette.id)}
                        style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "42px",
                        height: "42px",
                        backgroundColor: "#fff5f5",
                        border: "1px solid #f1b0b0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        transition: "0.2s"
                        }}
                    >
                        🗑️
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recettes;