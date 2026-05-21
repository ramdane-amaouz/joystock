import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import {
  BarChart,
  Bar
} from "recharts";

function Statistiques() {
  const [donnees, setDonnees] = useState([]);
  const [produitSelectionne, setProduitSelectionne] = useState("");
  const [erreur, setErreur] = useState("");

  const [dernieresConsommations, setDernieresConsommations] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/stats/consommation`)
      .then((response) => response.json())
      .then((data) => {
        setDonnees(data);

        if (data.length > 0) {
          setProduitSelectionne(data[0].produit_nom);
        }
      })
      .catch(() => setErreur("Erreur lors du chargement des statistiques"));

    fetch(`${import.meta.env.VITE_API_URL}/stats/derniere-consommation`)
      .then((response) => response.json())
      .then((data) => {
        setDernieresConsommations(data);
      });
  }, []);

  const produits = [...new Set(donnees.map((item) => item.produit_nom))];

  const donneesProduit = donnees
    .filter((item) => item.produit_nom === produitSelectionne)
    .map((item) => ({
      date: new Date(item.date_stock_actuel).toLocaleDateString("fr-FR"),
      consommation: item.consommation_estimee,
      unite: item.unite
    }));

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
        Statistiques
      </h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <div
        style={{
          marginBottom: "2rem",
          maxWidth: "400px"
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold"
          }}
        >
          Produit
        </label>

        <select
          value={produitSelectionne}
          onChange={(e) => setProduitSelectionne(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        >
          {produits.map((produit) => (
            <option key={produit} value={produit}>
              {produit}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          width: "100%",
          height: "400px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>
          Évolution de la consommation estimée
        </h3>

        {donneesProduit.length === 0 ? (
          <p>Aucune donnée disponible pour ce produit.</p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={donneesProduit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="consommation"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>


      <div
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginTop: "3rem"
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>
          Dernière consommation estimée par produit
        </h3>

        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={dernieresConsommations}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="produit_nom"
              angle={-20}
              textAnchor="end"
              interval={0}
              height={80}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="consommation_estimee"
              fill="#333"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Statistiques;