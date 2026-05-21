import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";



function DemarrerInventaire() {
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => {
        const produitsAvecSaisie = data.map((produit) => ({
          ...produit,
          nouvelle_quantite: ""
        }));

        setProduits(produitsAvecSaisie);
      })
      .catch(() => setErreur("Erreur lors du chargement des produits"));
  }, []);

  function modifierQuantite(produitId, valeur) {
    setProduits((prev) =>
      prev.map((produit) =>
        produit.produit_id === produitId
          ? { ...produit, nouvelle_quantite: valeur }
          : produit
      )
    );
  }

  async function terminerInventaire(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setErreur("Utilisateur non connecté");
      return;
    }

    const lignes = produits.map((produit) => ({
      produit_id: produit.produit_id,
      quantite: Number(produit.nouvelle_quantite)
    }));

    console.log("Utilisateur connecté :", data.user.id);
    console.log("Lignes envoyées :", lignes);

    fetch(`${import.meta.env.VITE_API_URL}/inventaires/demarrer-inventaire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: data.user.id,
        lignes: lignes
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de l'enregistrement de l'inventaire");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Inventaire enregistré avec succès.");
      })
      .catch((error) => setErreur(error.message));
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Démarrer un inventaire
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={terminerInventaire}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Produit</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Catégorie</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Ancien stock</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Nouveau stock</th>
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
                  {produit.quantite}
                </td>

                <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={produit.nouvelle_quantite}
                    onChange={(e) =>
                      modifierQuantite(produit.produit_id, e.target.value)
                    }
                    required
                  />
                </td>

                <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  {produit.unite}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="submit"
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Terminer l’inventaire
        </button>
      </form>
    </div>
  );
}

export default DemarrerInventaire;