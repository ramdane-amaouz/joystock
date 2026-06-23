import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function ModifierRecette() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [produits, setProduits] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  async function fetchAvecToken(url, options = {}) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Utilisateur non connecté");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${data.session.access_token}`
      }
    });

    if (!response.ok) throw new Error("Erreur lors de la requête");
    return response.json();
  }

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const matieres = await fetchAvecToken(
          `${import.meta.env.VITE_API_URL}/produits/matieres-premieres`
        );
        setProduits(matieres);

        const recette = await fetchAvecToken(
          `${import.meta.env.VITE_API_URL}/recettes/${id}`
        );

        setNom(recette.nom);
        setPrixVente(recette.prix_vente ?? "");
        setIngredients(
          recette.ingredients.map((ingredient) => ({
            produit_ingredient_id: ingredient.produit_ingredient_id,
            quantite: ingredient.quantite
          }))
        );
      } catch (error) {
        setErreur(error.message);
      }
    }

    chargerDonnees();
  }, [id]);

  function modifierIngredient(index, champ, valeur) {
    setIngredients((prev) =>
      prev.map((ingredient, i) =>
        i === index ? { ...ingredient, [champ]: valeur } : ingredient
      )
    );
  }

  function ajouterLigneIngredient() {
    setIngredients((prev) => [...prev, { produit_ingredient_id: "", quantite: "" }]);
  }

  function supprimerLigneIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function enregistrerModification(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    try {
      const ingredientsValides = ingredients
        .filter(i => i.produit_ingredient_id !== "" && i.quantite !== "")
        .map(i => ({
          produit_ingredient_id: Number(i.produit_ingredient_id),
          quantite: Number(i.quantite)
        }));

      if (ingredientsValides.length === 0) {
        setErreur("Veuillez ajouter au moins un ingrédient.");
        return;
      }

      await fetchAvecToken(
        `${import.meta.env.VITE_API_URL}/recettes/update/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom,
            prix_vente: prixVente !== "" ? Number(prixVente) : null,
            ingredients: ingredientsValides
          })
        }
      );

      setMessage("Recette modifiée avec succès.");
      setTimeout(() => navigate("/recettes"), 800);

    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Modifier la recette</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form
        onSubmit={enregistrerModification}
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
            style={{ width: "100%", padding: "0.75rem", boxSizing: "border-box", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Prix de vente (€)
            <span style={{ color: "#888", fontWeight: "normal", marginLeft: "0.5rem" }}>— optionnel</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex : 8.50"
            value={prixVente}
            onChange={(e) => setPrixVente(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", boxSizing: "border-box", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}
          />
        </div>

        <h3 style={{ marginBottom: "1rem" }}>Ingrédients</h3>

        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", gap: "1rem", marginBottom: "1rem" }}
          >
            <select
              value={ingredient.produit_ingredient_id}
              onChange={(e) => modifierIngredient(index, "produit_ingredient_id", e.target.value)}
              required
              style={{ padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc" }}
            >
              <option value="">Ingrédient</option>
              {produits.map((produit) => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} ({produit.unites?.nom || produit.unite || ""})
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Quantité"
              value={ingredient.quantite}
              onChange={(e) => modifierIngredient(index, "quantite", e.target.value)}
              required
              style={{ padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc" }}
            />

            <button
              type="button"
              onClick={() => supprimerLigneIngredient(index)}
              style={{ backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              Retirer
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={ajouterLigneIngredient}
          style={{ padding: "0.75rem", marginRight: "1rem", backgroundColor: "#777", color: "white", border: "none", borderRadius: "5px" }}
        >
          Ajouter un ingrédient
        </button>

        <button
          type="submit"
          style={{ padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px" }}
        >
          Enregistrer
        </button>
      </form>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/recettes" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
          ⟵ Retour aux recettes
        </Link>
      </div>
    </div>
  );
}

export default ModifierRecette;