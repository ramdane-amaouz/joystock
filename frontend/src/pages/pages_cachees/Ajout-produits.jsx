import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function AjoutProduits() {
  const [nouveauProduit, setNouveauProduit] = useState({
    nom: "",
    categorie_id: "",
    type_produit: "matiere_premiere",
    unite_id: "",
    prix: ""
  });

  const [categories, setCategories] = useState([]);
  const [unites, setUnites] = useState([]);

  const [nouvelleCategorie, setNouvelleCategorie] = useState("");
  const [nouvelleUnite, setNouvelleUnite] = useState("");

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  function chargerCategoriesEtUnites() {
    fetch(`${import.meta.env.VITE_API_URL}/produits/categories`)
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch(() => setErreur("Erreur lors du chargement des catégories"));

    fetch(`${import.meta.env.VITE_API_URL}/produits/unites`)
      .then((response) => response.json())
      .then((data) => setUnites(data))
      .catch(() => setErreur("Erreur lors du chargement des unités"));
  }

  useEffect(() => {
    chargerCategoriesEtUnites();
  }, []);

  async function creerCategorieSiNecessaire() {
    if (nouveauProduit.categorie_id !== "new") {
      return Number(nouveauProduit.categorie_id);
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/categories/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ nom: nouvelleCategorie })
    });
    if (!response.ok) throw new Error("Erreur lors de la création de la catégorie");
    const data = await response.json();
    return data.categorie.id;
  }

  async function creerUniteSiNecessaire() {
    if (nouveauProduit.unite_id !== "new") {
      return Number(nouveauProduit.unite_id);
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/unites/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ nom: nouvelleUnite })
    });
    if (!response.ok) throw new Error("Erreur lors de la création de l'unité");
    const data = await response.json();
    return data.unite.id;
  }

  async function ajouterProduit(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Non connecté");

      const categorieId = await creerCategorieSiNecessaire();
      const uniteId = await creerUniteSiNecessaire();

      const body = {
        nom: nouveauProduit.nom,
        categorie_id: categorieId,
        type_produit: nouveauProduit.type_produit,
        unite_id: uniteId,
        prix: nouveauProduit.prix !== "" ? Number(nouveauProduit.prix) : null
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout du produit");

      setMessage("Produit ajouté avec succès.");
      setNouveauProduit({ nom: "", categorie_id: "", type_produit: "matiere_premiere", unite_id: "", prix: "" });
      setNouvelleCategorie("");
      setNouvelleUnite("");
      chargerCategoriesEtUnites();

    } catch (error) {
      setErreur(error.message);
    }
  }

  // Unité sélectionnée (pour afficher dans le label prix)
  const uniteSelectionnee = unites.find(u => String(u.id) === String(nouveauProduit.unite_id));

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Ajouter un produit</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form
        onSubmit={ajouterProduit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.9rem" }}>
            Nom du produit
          </label>
          <input
            type="text"
            placeholder="Ex : Poulet"
            value={nouveauProduit.nom}
            onChange={(e) => setNouveauProduit((prev) => ({ ...prev, nom: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.9rem" }}>
            Catégorie
          </label>
          <select
            value={nouveauProduit.categorie_id}
            onChange={(e) => setNouveauProduit((prev) => ({ ...prev, categorie_id: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>{categorie.nom}</option>
            ))}
            <option value="new">+ Nouvelle catégorie</option>
          </select>
        </div>

        {nouveauProduit.categorie_id === "new" && (
          <input
            type="text"
            placeholder="Nom de la nouvelle catégorie"
            value={nouvelleCategorie}
            onChange={(e) => setNouvelleCategorie(e.target.value)}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
          />
        )}

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.9rem" }}>
            Type de produit
          </label>
          <select
            value={nouveauProduit.type_produit}
            onChange={(e) => setNouveauProduit((prev) => ({ ...prev, type_produit: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}
          >
            <option value="matiere_premiere">Matière première</option>
            <option value="consommable">Consommable</option>
            <option value="entretien">Entretien</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.9rem" }}>
            Unité
          </label>
          <select
            value={nouveauProduit.unite_id}
            onChange={(e) => setNouveauProduit((prev) => ({ ...prev, unite_id: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}
          >
            <option value="">Sélectionnez une unité</option>
            {unites.map((unite) => (
              <option key={unite.id} value={unite.id}>{unite.nom}</option>
            ))}
            <option value="new">+ Nouvelle unité</option>
          </select>
        </div>

        {nouveauProduit.unite_id === "new" && (
          <input
            type="text"
            placeholder="Nom de la nouvelle unité"
            value={nouvelleUnite}
            onChange={(e) => setNouvelleUnite(e.target.value)}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
          />
        )}

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "bold", fontSize: "0.9rem" }}>
            Prix unitaire (€{uniteSelectionnee ? ` / ${uniteSelectionnee.nom}` : ""})
            <span style={{ color: "#888", fontWeight: "normal", marginLeft: "0.5rem" }}>— optionnel</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex : 9.00"
            value={nouveauProduit.prix}
            onChange={(e) => setNouveauProduit((prev) => ({ ...prev, prix: e.target.value }))}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
          />
          <p style={{ color: "#aaa", fontSize: "0.8rem", marginTop: "0.4rem" }}>
            Utilisé pour calculer le coût matière des recettes.
          </p>
        </div>

        <button
          type="submit"
          style={{ padding: "0.75rem", fontSize: "1rem", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Ajouter
        </button>
      </form>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/produits" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
          ⟵ Retour à la liste des produits
        </Link>
      </div>
    </div>
  );
}

export default AjoutProduits;