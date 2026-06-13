import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

  const navigate = useNavigate();

  async function connexion(e) {
    e.preventDefault();
    setErreur("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse
    });

    if (error) {
      setErreur(error.message);
      return;
    }

    navigate("/");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column" }}>

      {/* Header public */}
      <div style={{ backgroundColor: "white", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid #eee" }}>
        <img src="/accueil-img.png" alt="Logo JoyStock" style={{ height: "100px" }} />
        <div>
          <h2 style={{ margin: 0, fontSize: "2.5rem" }}>
            L'<span style={{ color: "#007BFF" }}>API</span> simple et puissante pour la gestion d'inventaire
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "1.2rem" }}>
            Centralisez, suivez et optimisez votre gestion de stock en temps réel avec <span style={{ color: "#007BFF" }}>JoyStock</span>.
          </p>
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Connexion</h2>

          {erreur && <p style={{ color: "red", marginBottom: "1rem" }}>{erreur}</p>}

          <form onSubmit={connexion} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={afficherMotDePasse ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.75rem", paddingRight: "4rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555" }}
                >
                  {afficherMotDePasse ? "Cacher" : "Voir"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ padding: "0.9rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px", fontSize: "1rem", cursor: "pointer", marginTop: "0.5rem" }}
            >
              Se connecter
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <a href="/reset-password" style={{ color: "#333", textDecoration: "underline" }}>
              Mot de passe oublié ?
            </a>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;