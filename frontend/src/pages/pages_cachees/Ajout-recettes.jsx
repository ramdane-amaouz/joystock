import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function Ajout_Recettes() {
  const [produits, setProduits] = useState([]);
  const [nom, setNom] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [ingredients, setIngredients] = useState([
    { produit_ingredient_id: "", quantite: "" }
  ]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch(() => setErreur("Erreur lors du chargement des produits"));
  }, []);

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

  async function creerRecette(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

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

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Non connecté");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/recettes/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          nom,
          prix_vente: prixVente !== "" ? Number(prixVente) : null,
          ingredients: ingredientsValides
        })
      });

      if (!response.ok) throw new Error("Erreur lors de la création de la recette");

      setMessage("Recette créée avec succès.");
      setNom("");
      setPrixVente("");
      setIngredients([{ produit_ingredient_id: "", quantite: "" }]);

    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Recettes</h2>

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
          <p style={{ color: "#aaa", fontSize: "0.8rem", marginTop: "0.4rem" }}>
            Utilisé pour calculer la marge par rapport au coût matière.
          </p>
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
          Créer la recette
        </button>
      </form>
    </div>
  );
}

export default Ajout_Recettes;