import { useEffect, useState } from "react";

function Accueil() {
  const [stats, setStats] = useState({
    totalProduits: 0,
    stockTotal: 0,
    alertes: 0
  });

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
    </div>
  );
}

export default Accueil;