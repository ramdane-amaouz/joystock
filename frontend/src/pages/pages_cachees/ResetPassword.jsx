/****
 * page pour reinitialiser le mot de passe d'un utilisateur
 */


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [etape, setEtape] = useState("demande"); // "demande" ou "nouveau"

  // Si l'utilisateur arrive depuis le lien Supabase, une session est automatiquement créée
    useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
        setEtape("nouveau");
        }
    });

    return () => subscription.unsubscribe();
    }, []);

   /* useEffect(() => {
        // Vérifier d'abord si on a déjà une session active (cas du lien Supabase)
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
            setEtape("nouveau");
            }
        });

        // Écouter aussi PASSWORD_RECOVERY pour être sûr
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
            setEtape("nouveau");
            }
        });

        return () => subscription.unsubscribe();
    }, []);*/

  // Etape 1 : demande de reset par email
  async function demanderReset(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setErreur(error.message);
      return;
    }

    setMessage("Un email de réinitialisation vous a été envoyé.");
    setEmail("");
  }

  // Etape 2 : définir le nouveau mot de passe
  async function mettreAJourMotDePasse(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {
      setErreur(error.message);
      return;
    }

    setMessage("Mot de passe mis à jour avec succès.");
    setTimeout(() => navigate("/login"), 1500);
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
          maxWidth: "400px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
          {etape === "demande" ? "Mot de passe oublié" : "Nouveau mot de passe"}
        </h2>

        {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}
        {message && <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>}

        {etape === "demande" ? (
          <form
            onSubmit={demanderReset}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
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
                fontSize: "1rem",
                cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              Envoyer le lien
            </button>

            <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <a href="/login" style={{ color: "#333", textDecoration: "underline" }}>
                Retour à la connexion
              </a>
            </p>
          </form>
        ) : (
          <form
            onSubmit={mettreAJourMotDePasse}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Nouveau mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={afficherMotDePasse ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "4rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#555"
                  }}
                >
                  {afficherMotDePasse ? "Cacher" : "Voir"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Confirmer le mot de passe
              </label>
              <input
                type={afficherMotDePasse ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
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
                fontSize: "1rem",
                cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              Mettre à jour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;