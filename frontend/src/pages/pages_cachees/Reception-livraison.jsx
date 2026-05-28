import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function ReceptionMarchandise() {
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/produits`)
      .then((response) => response.json())
      .then((data) => {
        const produitsAvecSaisie = data.map((produit) => ({
          ...produit,
          quantite_commandee: "",
          quantite_recue: ""
        }));

        setProduits(produitsAvecSaisie);
      })
      .catch(() => setErreur("Erreur lors du chargement des produits"));
  }, []);

  function modifierChamp(produitId, champ, valeur) {
    setProduits((prev) =>
      prev.map((produit) =>
        produit.produit_id === produitId
          ? { ...produit, [champ]: valeur }
          : produit
      )
    );
  }

  async function terminerReception(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setErreur("Utilisateur non connecté");
      return;
    }

    const lignes = produits
      .filter(
        (produit) =>
          produit.quantite_commandee !== "" || produit.quantite_recue !== ""
      )
      .map((produit) => ({
        produit_id: produit.produit_id,
        quantite_commandee:
          produit.quantite_commandee === ""
            ? 0
            : Number(produit.quantite_commandee),
        quantite:
          produit.quantite_recue === ""
            ? 0
            : Number(produit.quantite_recue)
      }));

    if (lignes.length === 0) {
      setErreur("Veuillez saisir au moins une ligne de réception.");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/inventaires/reception-livraison`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
      //  user_id: data.user.id,
        lignes: lignes
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de l'enregistrement de la réception");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Réception enregistrée avec succès.");

        setProduits((prev) =>
          prev.map((produit) => ({
            ...produit,
            quantite_commandee: "",
            quantite_recue: ""
          }))
        );
      })
      .catch((error) => setErreur(error.message));
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Réception de marchandise
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={terminerReception}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left"
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Produit
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Catégorie
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Stock actuel
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Quantité commandée
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Quantité reçue
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                Unité
              </th>
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
                    value={produit.quantite_commandee}
                    onChange={(e) =>
                      modifierChamp(
                        produit.produit_id,
                        "quantite_commandee",
                        e.target.value
                      )
                    }
                  />
                </td>

                <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={produit.quantite_recue}
                    onChange={(e) =>
                      modifierChamp(
                        produit.produit_id,
                        "quantite_recue",
                        e.target.value
                      )
                    }
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
          Enregistrer la réception
        </button>
      </form>
    </div>
  );
}

export default ReceptionMarchandise;