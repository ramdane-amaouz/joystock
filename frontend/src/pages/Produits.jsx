import { useEffect, useState } from "react";


function Accueil() {
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/produits")
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch((error) => setErreur("Erreur lors du chargement des produits"));
  }, []);   

    return (
        <div>
            <h2 style={{ textAlign: "left", marginBottom: "3rem" }}>Produits</h2>

            {erreur && <p style={{ color: "red" }}>{erreur}</p>}

            <ul>
                {produits.map((produit) => (
                    <li key={produit.id}>
                        {produit.nom} — {produit.categorie} — {produit.unite}
                    </li>
                ))}
            </ul>
        </div>


    );
}

export default Accueil;