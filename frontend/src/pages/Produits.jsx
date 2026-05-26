import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Produits() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unites, setUnites] = useState([]);
  const [erreur, setErreur] = useState("");

  const [nouveauProduit, setNouveauProduit] = useState({
    nom: "",
    categorie_id: "",
    unite_id: ""
  });

  function chargerProduits() {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch(() => setErreur("Erreur lors du chargement des produits"));
  }

  useEffect(() => {
    chargerProduits();

    fetch(`${import.meta.env.VITE_API_URL}/produits/categories`)
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch(() => setErreur("Erreur lors du chargement des catégories"));

    fetch(`${import.meta.env.VITE_API_URL}/produits/unites`)
      .then((response) => response.json())
      .then((data) => setUnites(data))
      .catch(() => setErreur("Erreur lors du chargement des unités"));
  }, []);

  function ajouterProduit(e) {
    e.preventDefault();

    fetch(`${import.meta.env.VITE_API_URL}/produits/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nom: nouveauProduit.nom,
        categorie_id: Number(nouveauProduit.categorie_id),
        unite_id: Number(nouveauProduit.unite_id)
      })
    })
      .then((response) => response.json())
      .then(() => {
        setNouveauProduit({
          nom: "",
          categorie_id: "",
          unite_id: ""
        });
        chargerProduits();
      })
      .catch(() => setErreur("Erreur lors de l'ajout du produit"));
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Produits
      </h2>
      
      <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <Link to="/ajout-produit" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
                   + Créer un produit
                </Link>
            </div>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}



      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Nom</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Catégorie</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Type</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Quantité</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Unité</th>
          </tr>
        </thead>

        <tbody>
          {produits.map((produit) => (
            <tr key={produit.produit_id}>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.nom}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.categorie}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.type_produit}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.quantite}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.unite}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Produits;