import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


function Inscription() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  async function inscription(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    if (!token) {
      setErreur("Lien d'invitation invalide.");
      return;
    }

    try {
      const responseInvitation = await fetch(
        `${import.meta.env.VITE_API_URL}/invitations/${token}`
      );

      if (!responseInvitation.ok) {
        throw new Error("Invitation invalide ou expirée.");
      }

      const invitation = await responseInvitation.json();

      const { data, error } = await supabase.auth.signUp({
        email: invitation.email,
        password: motDePasse
      });

      if (error) {
        throw new Error(error.message);
      }


      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error("Session introuvable après inscription.");
      }


      const responseProfile = await fetch(`${import.meta.env.VITE_API_URL}/invitations/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          token,
          nom,
          prenom
        })
      });

      if (!responseProfile.ok) {
        throw new Error("Erreur lors de la création du profil.");
      }

      setMessage("Compte créé avec succès. Vous pouvez maintenant vous connecter.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
          Création du compte
        </h2>

        {erreur && <p style={{ color: "red" }}>{erreur}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}

        <form
          onSubmit={inscription}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Nom
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Prénom
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "0.9rem",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Créer mon compte
          </button>
        </form>
      </div>
    </div>
  );
}

export default Inscription;