import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Menu from "./components/Menu";
import Accueil from "./pages/Accueil";
import Produits from "./pages/Produits";
import AjoutProduits from "./pages/pages_cachees/Ajout-produits";
import DemarrerInventaire from "./pages/pages_cachees/Demarrer-inventaire";
import ReceptionMarchandise from "./pages/pages_cachees/Reception-livraison";
import Invitations from "./pages/Invitations";
import Inventaire from "./pages/Inventaire";
import Alertes from "./pages/Alertes";
import Parametres from "./pages/Parametres";
import Statistiques from "./pages/Statistiques";
import Inscription from "./pages/Inscription";
import Recettes from "./pages/Recettes";
import Ajout_Recettes from "./pages/pages_cachees/Ajout-recettes";
import ModifierRecette from "./pages/pages_cachees/Modifier-recette";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/pages_cachees/ResetPassword";
import Equipe from "./pages/Equipe";
import Previsions from "./pages/Previsions";


import SaisirVentes from "./pages/pages_cachees/Saisir-ventes";

import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [menuReduit, setMenuReduit] = useState(false);

  /*async function chargerProfil(session) {
    if (!session) {
      setProfil(null);
      return;
    }
    try {
      const userId = session.user.id;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${userId}`);
      if (!response.ok) throw new Error("Profil introuvable");
      const data = await response.json();
      setProfil(data);
    } catch (error) {
      console.error("Erreur chargement profil :", error);
      setProfil(null);
    }
  }*/


  async function chargerProfil(session) {
  if (!session) {
    setProfil(null);
    return;
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    if (!response.ok) {
      await supabase.auth.signOut();
      setProfil(null);
      return;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") return;
      setSession(session);
      await chargerProfil(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const ping = () => fetch("https://joystock.onrender.com/").catch(() => {});
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (chargement) {
    return <p>Chargement...</p>;
  }

  const admin = profil?.role === "admin";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />

        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/inscription" element={<Navigate to="/" />} />

            <Route path="/*" element={
              <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

                {/* Menu fixe à gauche — largeur dynamique */}
                <div style={{
                  width: menuReduit ? "60px" : "200px",
                  backgroundColor: "#333",
                  height: "100vh",
                  position: "sticky",
                  top: 0,
                  flexShrink: 0,
                  overflowY: "auto",
                  transition: "width 0.2s ease"
                }}>
                  <Menu admin={admin} reduit={menuReduit} setReduit={setMenuReduit} />
                </div>

                {/* Contenu scrollable à droite */}
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  {/* Header fixe en haut */}
                  <header style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    backgroundColor: "white",
                    borderBottom: "1px solid #eee",
                    padding: "0.75rem 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                  }}>
                    <span style={{ fontWeight: "bold", color: "#333", fontSize: "1.1rem" }}>JoyStock</span>
                    <span style={{ color: "#888", fontSize: "0.9rem" }}>
                      {profil?.prenom} {profil?.nom}
                    </span>
                  </header>

                  {/* Pages */}
                  <div style={{ padding: "2rem", flex: 1 }}>
                    <Routes>
                      <Route path="/" element={<Accueil admin={admin} />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/produits" element={<Produits />} />
                      <Route path="/inventaire" element={<Inventaire />} />
                      <Route path="/demarrer-inventaire" element={<DemarrerInventaire />} />
                      <Route path="/reception-livraison" element={<ReceptionMarchandise />} />
                      <Route path="/parametres" element={<Parametres />} />

                      {admin && (
                        <>
                          <Route path="/statistiques" element={<Statistiques />} />
                          <Route path="/ajout-produit" element={<AjoutProduits />} />
                          <Route path="/invitations" element={<Invitations />} />
                          <Route path="/alertes" element={<Alertes />} />
                          <Route path="/recettes" element={<Recettes />} />
                          <Route path="/modifier-recette/:id" element={<ModifierRecette />} />
                          <Route path="/ajout-recette" element={<Ajout_Recettes />} /> 
                          <Route path="/saisir-ventes" element={<SaisirVentes />} />
                          <Route path="/equipe" element={<Equipe />} />
                          <Route path="/previsions" element={<Previsions />} />
                        </>
                      )}

                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </div>
                </div>
              </div>
            } />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;