import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Recettes() {
  const [recettes, setRecettes] = useState([]);
  const [erreur, setErreur] = useState("");

  function chargerRecettes() {
    fetch(`${import.meta.env.VITE_API_URL}/recettes`)
      .then((response) => response.json())
      .then((data) => setRecettes(data))
      .catch(() => setErreur("Erreur lors du chargement des recettes"));
  }

  useEffect(() => {
    chargerRecettes();
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Recettes
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

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

              {recette.ingredients.length === 0 ? (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recettes;