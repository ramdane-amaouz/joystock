import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AjoutProduits() {
  const [nouveauProduit, setNouveauProduit] = useState({
    nom: "",
    categorie_id: "",
    unite_id: ""
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

    const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/categories/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nom: nouvelleCategorie
      })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création de la catégorie");
    }

    const data = await response.json();
    return data.categorie.id;
  }

  async function creerUniteSiNecessaire() {
    if (nouveauProduit.unite_id !== "new") {
      return Number(nouveauProduit.unite_id);
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/unites/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nom: nouvelleUnite
      })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création de l'unité");
    }

    const data = await response.json();
    return data.unite.id;
  }

  async function ajouterProduit(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    try {
      const categorieId = await creerCategorieSiNecessaire();
      const uniteId = await creerUniteSiNecessaire();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/produits/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: nouveauProduit.nom,
          categorie_id: categorieId,
          unite_id: uniteId
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du produit");
      }

      setMessage("Produit ajouté avec succès.");

      setNouveauProduit({
        nom: "",
        categorie_id: "",
        unite_id: ""
      });
      setNouvelleCategorie("");
      setNouvelleUnite("");

      chargerCategoriesEtUnites();
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Ajouter un produit
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form
        onSubmit={ajouterProduit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "400px"
        }}
      >
        <input
          type="text"
          placeholder="Nom du produit"
          value={nouveauProduit.nom}
          onChange={(e) =>
            setNouveauProduit((prev) => ({
              ...prev,
              nom: e.target.value
            }))
          }
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />

        <select
          value={nouveauProduit.categorie_id}
          onChange={(e) =>
            setNouveauProduit((prev) => ({
              ...prev,
              categorie_id: e.target.value
            }))
          }
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          <option value="">Sélectionnez une catégorie</option>

          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.nom}
            </option>
          ))}

          <option value="new">+ Nouvelle catégorie</option>
        </select>

        {nouveauProduit.categorie_id === "new" && (
          <input
            type="text"
            placeholder="Nom de la nouvelle catégorie"
            value={nouvelleCategorie}
            onChange={(e) => setNouvelleCategorie(e.target.value)}
            required
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          />
        )}

        <select
          value={nouveauProduit.unite_id}
          onChange={(e) =>
            setNouveauProduit((prev) => ({
              ...prev,
              unite_id: e.target.value
            }))
          }
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          <option value="">Sélectionnez une unité</option>

          {unites.map((unite) => (
            <option key={unite.id} value={unite.id}>
              {unite.nom}
            </option>
          ))}

          <option value="new">+ Nouvelle unité</option>
        </select>

        {nouveauProduit.unite_id === "new" && (
          <input
            type="text"
            placeholder="Nom de la nouvelle unité"
            value={nouvelleUnite}
            onChange={(e) => setNouvelleUnite(e.target.value)}
            required
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          />
        )}

        <button
          type="submit"
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Ajouter
        </button>
      </form>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/produits" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>⟵ Retour à la liste des produits</Link>
      </div>
    </div>
  );
}

export default AjoutProduits;