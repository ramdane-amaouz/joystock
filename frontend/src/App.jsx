import { useEffect, useState } from "react";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Menu from "./components/Menu";
import Accueil from "./pages/Accueil";
import Produits from "./pages/Produits";
import AjoutProduits from "./pages/pages_cachees/Ajout-produits";

import DemarrerInventaire from "./pages/pages_cachees/Demarrer-inventaire";

import Invitations from "./pages/Invitations";

import Inventaire from "./pages/Inventaire";
import Alertes from "./pages/Alertes";
import Parametres from "./pages/Parametres";
import Statistiques from "./pages/Statistiques";
import Inscription from "./pages/Inscription";

import Login from "./pages/Login";


import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);

  async function chargerProfil(session) {
    if (!session) {
      setProfil(null);
      return;
    }

    try {
      const userId = session.user.id;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${userId}`);

      if (!response.ok) {
        throw new Error("Profil introuvable");
      }

      const data = await response.json();
      setProfil(data);
    } catch (error) {
      console.error("Erreur chargement profil :", error);
      setProfil(null);
    }
  }

  useEffect(() => {
    async function chargerSession() {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      await chargerProfil(data.session);

      setChargement(false);
    }

    chargerSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await chargerProfil(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (chargement) {
    return <p>Chargement...</p>;
  }

  const admin = profil?.role === "admin";

  return (
    <BrowserRouter>
      {!session ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <div style={{ width: "200px", backgroundColor: "#333" }}>
            <Menu admin={admin} />
          </div>

          <div style={{ flex: 1, padding: "2rem" }}>
            <Routes>
              <Route path="/" element={<Accueil />} />

              <Route path="/produits" element={<Produits />} />

              <Route path="/inventaire" element={<Inventaire />} />
              <Route path="/demarrer-inventaire" element={<DemarrerInventaire />} />

              <Route path="/parametres" element={<Parametres />} />

              {admin && (
                <>
                  <Route path="/statistiques" element={<Statistiques />} />
                  <Route path="/ajout-produit" element={<AjoutProduits />} />
                  <Route path="/invitations" element={<Invitations />} />
                  <Route path="/alertes" element={<Alertes />} />
                </>
              )}

              <Route path="/login" element={<Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;