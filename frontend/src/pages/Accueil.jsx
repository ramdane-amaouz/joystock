import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Accueil() {
  const [stats, setStats] = useState({
    totalProduits: 0,
    stockTotal: 0,
    alertes: 0
  });
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    // Récupérer le nombre de produits
    fetch("http://127.0.0.1:8000/produits/count")
      .then((response) => response.json())
      .then((data) => setStats(prev => ({ ...prev, totalProduits: data.count })))
      .catch((error) => setErreur("Erreur lors du chargement des produits"));

    // Récupérer le stock total
    fetch("http://127.0.0.1:8000/produits/total-unites")
      .then((response) => response.json())
      .then((data) => setStats(prev => ({ ...prev, stockTotal: data.total_unites })))
      .catch((error) => setErreur("Erreur lors du chargement du stock"));

    // Récupérer les produits du dernier inventaire
    fetch("http://127.0.0.1:8000/produits")
      .then((response) => response.json())
      .then((data) => setProduits(data))
      .catch((error) => setErreur("Erreur lors du chargement des produits"));

    // TODO: Récupérer les alertes (ajouter la route dans le backend quand prêt)
    // fetch("http://127.0.0.1:8000/produits/alertes")
    //   .then((response) => response.json())
    //   .then((data) => setStats(prev => ({ ...prev, alertes: data.count })))
    //   .catch((error) => setErreur("Erreur lors du chargement des alertes"));
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "3rem" }}>Tableau de Bord</h2>
      
      {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ 
          flex: "1", 
          minWidth: "200px", 
          border: "1px solid #ccc", 
          padding: "2rem", 
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Produits</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.totalProduits}</p>
        </div>

        <div style={{ 
          flex: "1", 
          minWidth: "200px", 
          border: "1px solid #ccc", 
          padding: "2rem", 
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Stock Total</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.stockTotal} unités</p>
        </div>

        <div style={{ 
          flex: "1", 
          minWidth: "200px", 
          border: "1px solid #ccc", 
          padding: "2rem", 
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3>Alertes</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "red" }}>{stats.alertes}</p>
        </div>
      </div>

      <div style={{ textAlign: "left" }}>
        <h3 style={{ marginTop: "3rem" }}>Aperçu des produits</h3>


        {erreur && <p style={{ color: "red" }}>{erreur}</p>}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Nom</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Catégorie</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Quantité</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Unité</th>
                    </tr>
                </thead>
                <tbody>
                    {produits.map((produit) => (
                        <tr key={produit.id}>
                            <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.nom}</td>
                            <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.categorie}</td>
                            <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.quantite}</td>
                            <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{produit.unite}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <Link to="/produits" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1.1rem" }}>
                    Voir tous les produits →
                </Link>
            </div>

            

      </div>
    </div>
  );
}

export default Accueil;