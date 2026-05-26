import { useEffect, useState } from "react";

function Recettes() {
  const [produits, setProduits] = useState([]);
 // const [produitsPrepares, setProduitsPrepares] = useState([]);

  const [nom, setNom] = useState("");
 // const [produitPrepareId, setProduitPrepareId] = useState("");
  const [ingredients, setIngredients] = useState([
    {
      produit_ingredient_id: "",
      quantite: ""
    }
  ]);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch(() => setErreur("Erreur lors du chargement des produits"));

    fetch(`${import.meta.env.VITE_API_URL}/produits/matieres-premieres`)
      .then((response) => response.json())
      .then((data) => setProduitsPrepares(data))
      .catch(() => setErreur("Erreur lors du chargement des matieres premières"));
  }, []);

  function modifierIngredient(index, champ, valeur) {
    setIngredients((prev) =>
      prev.map((ingredient, i) =>
        i === index ? { ...ingredient, [champ]: valeur } : ingredient
      )
    );
  }

  function ajouterLigneIngredient() {
    setIngredients((prev) => [
      ...prev,
      {
        produit_ingredient_id: "",
        quantite: ""
      }
    ]);
  }

  function supprimerLigneIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function creerRecette(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    const ingredientsValides = ingredients
        .filter(
        (ingredient) =>
            ingredient.produit_ingredient_id !== "" && ingredient.quantite !== ""
        )
        .map((ingredient) => ({
        produit_ingredient_id: Number(ingredient.produit_ingredient_id),
        quantite: Number(ingredient.quantite)
        }));

    if (ingredientsValides.length === 0) {
        setErreur("Veuillez ajouter au moins un ingrédient.");
        return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/recettes/add`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        nom,
        ingredients: ingredientsValides
        })
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error("Erreur lors de la création de la recette");
        }
        return response.json();
        })
        .then(() => {
        setMessage("Recette créée avec succès.");
        setNom("");
        setIngredients([
            {
            produit_ingredient_id: "",
            quantite: ""
            }
        ]);
        })
        .catch((error) => setErreur(error.message));
    }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Recettes
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form
        onSubmit={creerRecette}
        style={{
          maxWidth: "700px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Nom de la recette
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              boxSizing: "border-box"
            }}
          />
        </div>

        

        <h3 style={{ marginBottom: "1rem" }}>Ingrédients</h3>

        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 100px",
              gap: "1rem",
              marginBottom: "1rem"
            }}
          >
            <select
              value={ingredient.produit_ingredient_id}
              onChange={(e) =>
                modifierIngredient(index, "produit_ingredient_id", e.target.value)
              }
              required
              style={{ padding: "0.75rem" }}
            >
              <option value="">Ingrédient</option>
              {produits
               // .filter((produit) => produit.type_produit !== "produit_prepare")
                .map((produit) => (
                  <option key={produit.produit_id} value={produit.produit_id}>
                    {produit.nom} ({produit.unite})
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Quantité"
              value={ingredient.quantite}
              onChange={(e) =>
                modifierIngredient(index, "quantite", e.target.value)
              }
              required
              style={{ padding: "0.75rem" }}
            />

            <button
              type="button"
              onClick={() => supprimerLigneIngredient(index)}
              style={{
                backgroundColor: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Retirer
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={ajouterLigneIngredient}
          style={{
            padding: "0.75rem",
            marginRight: "1rem",
            backgroundColor: "#777",
            color: "white",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Ajouter un ingrédient
        </button>

        <button
          type="submit"
          style={{
            padding: "0.75rem",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Créer la recette
        </button>
      </form>
    </div>
  );
}

export default Recettes;