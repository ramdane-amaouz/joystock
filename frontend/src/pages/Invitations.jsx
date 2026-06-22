import { useState } from "react";
import { supabase } from "../supabaseClient";

function Invitations() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [lien, setLien] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [copie, setCopie] = useState(false);

  async function envoyerInvitation(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setLien("");
    setEnvoi(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Non connecté");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/invitations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ email, role })
      });

      if (!response.ok) throw new Error("Erreur lors de la création de l'invitation");

      const data = await response.json();
      setMessage("Invitation envoyée avec succès !");
      setLien(data.lien);
      setEmail("");
      setRole("employe");
    } catch (error) {
      setErreur(error.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setErreur("Impossible de copier le lien.");
    }
  }

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "0.5rem" }}>Invitations</h2>
      <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Invitez un nouvel employé ou administrateur à rejoindre JoyStock.
      </p>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Formulaire */}
        <div style={{
          flex: "1",
          minWidth: "300px",
          maxWidth: "460px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginBottom: "1.5rem", fontWeight: "600" }}>Envoyer une invitation</h3>

          {erreur && (
            <div style={{
              backgroundColor: "#fff5f5",
              border: "1px solid #f1b0b0",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              color: "#e53e3e",
              fontSize: "0.9rem",
              marginBottom: "1rem"
            }}>
              {erreur}
            </div>
          )}

          {message && (
            <div style={{
              backgroundColor: "#f0fff4",
              border: "1px solid #9ae6b4",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              color: "#38a169",
              fontSize: "0.9rem",
              marginBottom: "1rem"
            }}>
              ✅ {message}
            </div>
          )}

          <form onSubmit={envoyerInvitation} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="employe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>
                Rôle
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
              >
                <option value="employe">👤 Employé</option>
                <option value="admin">🔑 Administrateur</option>
              </select>
              <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                {role === "employe"
                  ? "Accès à l'inventaire et à la saisie des ventes."
                  : "Accès complet à toutes les fonctionnalités."}
              </p>
            </div>

            <button
              type="submit"
              disabled={envoi}
              style={{
                padding: "0.9rem",
                backgroundColor: envoi ? "#999" : "#333",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "1rem",
                cursor: envoi ? "default" : "pointer",
                marginTop: "0.25rem",
                transition: "background-color 0.2s"
              }}
            >
              {envoi ? "Envoi en cours..." : "✉️ Envoyer l'invitation"}
            </button>
          </form>
        </div>

        {/* Lien généré */}
        {lien && (
          <div style={{
            flex: "1",
            minWidth: "300px",
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ marginBottom: "0.5rem", fontWeight: "600" }}>Lien d'invitation</h3>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Un email a été envoyé à l'adresse indiquée. Vous pouvez aussi partager ce lien manuellement.
            </p>

            <div style={{
              backgroundColor: "#f9f9f9",
              border: "1px solid #eee",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: "#444",
              wordBreak: "break-all",
              marginBottom: "1rem"
            }}>
              {lien}
            </div>

            <button
              onClick={copierLien}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: copie ? "#38a169" : "#f5f5f5",
                color: copie ? "white" : "#333",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {copie ? "✅ Lien copié !" : "📋 Copier le lien"}
            </button>

            <p style={{ color: "#aaa", fontSize: "0.78rem", marginTop: "1rem" }}>
              ⚠️ Ce lien est à usage unique et expire après acceptation.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Invitations;