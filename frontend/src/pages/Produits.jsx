import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Produits() {
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");

  // Modal seuil alerte
  const [modalOuvert, setModalOuvert] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [nouveauSeuil, setNouveauSeuil] = useState("");
  const [messageModal, setMessageModal] = useState("");

  function chargerProduits() {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch(() => setErreur("Erreur lors du chargement des produits"));
  }

  useEffect(() => {
    chargerProduits();
  }, []);

  function ouvrirModal(produit) {
    setProduitSelectionne(produit);
    setNouveauSeuil(produit.seuil_alerte ?? 0);
    setMessageModal("");
    setModalOuvert(true);
  }

  function fermerModal() {
    setModalOuvert(false);
    setProduitSelectionne(null);
    setNouveauSeuil("");
  }

  async function enregistrerSeuil(e) {
    e.preventDefault();
    setMessageModal("");

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Non connecté");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/produits/${produitSelectionne.produit_id}/seuil-alerte`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({ seuil_alerte: Number(nouveauSeuil) })
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      setMessageModal("Seuil mis à jour ✅");
      chargerProduits();

      setTimeout(() => fermerModal(), 1000);
    } catch (error) {
      setMessageModal(error.message);
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Produits</h2>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <Link
          to="/ajout-produit"
          style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}
        >
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
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Seuil alerte</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}></th>
          </tr>
        </thead>
        <tbody>
          {produits.map((produit) => (
            <tr key={produit.produit_id}>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.nom}</td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.categorie}</td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.type_produit}</td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.quantite}</td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.unite}</td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {produit.seuil_alerte ?? 0}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                <button
                  onClick={() => ouvrirModal(produit)}
                  title="Modifier le seuil d'alerte"
                  style={{
                    background: "none",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "0.3rem 0.6rem",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  ⚙️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal seuil alerte */}
      {modalOuvert && produitSelectionne && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={fermerModal}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              width: "100%",
              maxWidth: "380px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>Seuil d'alerte</h3>
            <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {produitSelectionne.nom}
            </p>

            {messageModal && (
              <p style={{ color: messageModal.includes("✅") ? "green" : "red", marginBottom: "1rem" }}>
                {messageModal}
              </p>
            )}

            <form onSubmit={enregistrerSeuil} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Stock minimum ({produitSelectionne.unite})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={nouveauSeuil}
                  onChange={(e) => setNouveauSeuil(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={fermerModal}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produits;