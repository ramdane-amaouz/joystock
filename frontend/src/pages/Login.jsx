import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

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
      <h2
        style={{
          marginBottom: "2rem",
          textAlign: "center"
        }}
      >
        Connexion
      </h2>

      {erreur && (
        <p
          style={{
            color: "red",
            marginBottom: "1rem"
          }}
        >
          {erreur}
        </p>
      )}

      <form
        onSubmit={connexion}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold"
            }}
          >
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

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold"
            }}
          >
            Mot de passe
          </label>

          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
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
          Se connecter
        </button>
      </form>
    </div>
  </div>
);
}

export default Login;