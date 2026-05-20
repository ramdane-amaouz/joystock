/*import { useEffect, useState } from "react";

function App() {
  const [produits, setProduits] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/produits/")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des produits");
        }
        return res.json();
      })
      .then((data) => setProduits(data))
      .catch((err) => setErreur(err.message));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>JoyStock</h1>
      <h2>Liste des produits</h2>

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

export default App;*/



import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import Accueil from "./pages/Accueil";
import Produits from "./pages/Produits";
import AjoutProduits from "./pages/pages_cachees/Ajout-produits";

import DemarrerInventaire from "./pages/pages_cachees/Demarrer-inventaire";


import Inventaire from "./pages/Inventaire";
import Alertes from "./pages/Alertes";
import Parametres from "./pages/Parametres";
import Statistiques from "./pages/Statistiques";



function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Menu à gauche */}
        <div style={{ width: "200px", backgroundColor: "#333" }}>
          <Menu />
        </div>
        
        {/* Contenu à droite */}
        <div style={{ flex: 1, padding: "2rem" }}>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/produits" element={<Produits />} />
            <Route path="/ajout-produit" element={<AjoutProduits />} />
            <Route path="/inventaire" element={<Inventaire />} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/statistiques" element={<Statistiques />} />
            <Route path="/demarrer-inventaire" element={<DemarrerInventaire />} />

          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;