import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Accueil({ admin }) {
  const [totalProduits, setTotalProduits] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [produits, setProduits] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [totalVentesJour, setTotalVentesJour] = useState(0);
  const [topProduit, setTopProduit] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [topRecette, setTopRecette] = useState(null);

  async function fetchAvecToken(url) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Non connecté");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });
    if (!response.ok) throw new Error("Erreur chargement");
    return response.json();
  }

  useEffect(() => {
    async function chargerDonnees() {
      try {
        // Données communes
        const [count, unites, produitsData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/produits/count`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/produits/total-unites`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/produits`).then(r => r.json())
        ]);

        setTotalProduits(count.count);
        setStockTotal(unites.total_unites);
        setProduits(produitsData);

        // Données admin uniquement
        if (admin) {
          const [alertesData, ventesJour, topConso, topRecettes] = await Promise.all([
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/alertes-stock`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/ventes/par-jour`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/derniere-consommation`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/ventes/total-recettes`)
          ]);

          setAlertes(alertesData);

          // Total ventes aujourd'hui
          const aujourd_hui = new Date().toLocaleDateString("fr-FR");
          const ventesAujourdhui = ventesJour.filter(v =>
            new Date(v.jour).toLocaleDateString("fr-FR") === aujourd_hui
          );
          const total = ventesAujourdhui.reduce((acc, v) => acc + Number(v.quantite_vendue), 0);
          setTotalVentesJour(total);

          // Top produit consommé
          if (topConso.length > 0) setTopProduit(topConso[0]);

          // Top recette vendue
          if (topRecettes.length > 0) setTopRecette(topRecettes[0]);
        }

      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerDonnees();
  }, [admin]);

  if (chargement) return <p>Chargement...</p>;

  const carteStyle = {
    flex: "1",
    minWidth: "180px",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  };

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Tableau de bord</h2>

      {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}

      {/* Cartes communes */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={carteStyle}>
          <p style={{ color: "#888", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Produits référencés</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>{totalProduits}</p>
        </div>

        <div style={carteStyle}>
          <p style={{ color: "#888", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Stock total</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>{stockTotal} <span style={{ fontSize: "1rem", fontWeight: "normal" }}>unités</span></p>
        </div>

        {/* Carte alertes — admin seulement */}
        {admin && (
          <div style={{
            ...carteStyle,
            backgroundColor: alertes.length > 0 ? "#fff5f5" : "white",
            border: alertes.length > 0 ? "1px solid #f1b0b0" : "none"
          }}>
            <p style={{ color: "#888", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Alertes stock</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: alertes.length > 0 ? "#e53e3e" : "#38a169" }}>
              {alertes.length}
            </p>
            {alertes.length > 0 && (
              <Link to="/alertes" style={{ fontSize: "0.85rem", color: "#e53e3e", textDecoration: "underline" }}>
                Voir les alertes →
              </Link>
            )}
          </div>
        )}

        {/* Ventes du jour — admin seulement */}
        {admin && (
          <div style={carteStyle}>
            <p style={{ color: "#888", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Ventes aujourd'hui</p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>{totalVentesJour}</p>
          </div>
        )}
      </div>

      {admin && topRecette && (
        <div style={carteStyle}>
          <p style={{ color: "#888", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Recette la plus vendue</p>
          <p style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}>{topRecette.recette_nom}</p>
          <p style={{ color: "#555", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>{topRecette.total_vendu} vendues</p>
        </div>
      )}

      {/* Top produit consommé — admin seulement */}
      {admin && topProduit && (
        <div style={{
          ...carteStyle,
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Produit le plus consommé</p>
            <p style={{ fontWeight: "bold", fontSize: "1.2rem", margin: 0 }}>{topProduit.produit_nom}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Dernière consommation estimée</p>
            <p style={{ fontWeight: "bold", fontSize: "1.2rem", margin: 0 }}>
              {topProduit.consommation_estimee} {topProduit.unite}
            </p>
          </div>
        </div>
      )}

      {/* Alertes détail — admin seulement */}
      {admin && alertes.length > 0 && (
        <div style={{
          backgroundColor: "#fff5f5",
          border: "1px solid #f1b0b0",
          borderRadius: "10px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ marginBottom: "1rem", color: "#e53e3e" }}>⚠️ Produits en rupture imminente</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #f1b0b0", padding: "0.5rem", textAlign: "left" }}>Produit</th>
                <th style={{ borderBottom: "1px solid #f1b0b0", padding: "0.5rem", textAlign: "left" }}>Stock théorique</th>
                <th style={{ borderBottom: "1px solid #f1b0b0", padding: "0.5rem", textAlign: "left" }}>Seuil</th>
                <th style={{ borderBottom: "1px solid #f1b0b0", padding: "0.5rem", textAlign: "left" }}>Unité</th>
              </tr>
            </thead>
            <tbody>
              {alertes.slice(0, 5).map((alerte) => (
                <tr key={alerte.produit_id}>
                  <td style={{ borderBottom: "1px solid #fde", padding: "0.5rem", fontWeight: "bold" }}>{alerte.produit_nom}</td>
                  <td style={{ borderBottom: "1px solid #fde", padding: "0.5rem", color: "#e53e3e" }}>{alerte.stock_theorique}</td>
                  <td style={{ borderBottom: "1px solid #fde", padding: "0.5rem" }}>{alerte.seuil_alerte}</td>
                  <td style={{ borderBottom: "1px solid #fde", padding: "0.5rem" }}>{alerte.unite}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {alertes.length > 0 && (
            <Link to="/alertes" style={{ fontSize: "0.9rem", color: "#e53e3e", textDecoration: "underline", marginTop: "0.75rem", display: "block" }}>
              Voir toutes les alertes ({alertes.length}) →
            </Link>
          )}
        </div>
      )}

      {/* Aperçu produits */}
      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginBottom: "1rem" }}>Aperçu des produits</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Nom</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Catégorie</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Type</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Quantité</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Unité</th>
            </tr>
          </thead>
          <tbody>
            {produits.slice(0, 10).map((produit) => (
              <tr key={produit.produit_id}>
                <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{produit.nom}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{produit.categorie}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{produit.type_produit}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{produit.quantite}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{produit.unite}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <Link to="/produits" style={{ color: "#007BFF", textDecoration: "none", fontSize: "1rem" }}>
            Voir tous les produits →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Accueil;