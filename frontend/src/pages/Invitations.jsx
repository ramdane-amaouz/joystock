import { useState } from "react";

function Invitations() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [lien, setLien] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  function envoyerInvitation(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setLien("");

    fetch("http://127.0.0.1:8000/invitations/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        role
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la création de l'invitation");
        }
        return response.json();
      })
      .then((data) => {
        setMessage("Invitation créée avec succès.");
        setLien(data.lien);
        setEmail("");
        setRole("employe");
      })
      .catch((error) => setErreur(error.message));
  }

  return (
    <div>
      <h2 style={{textAlign:"left"}}>Inviter un employé</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}


    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        alignItems: "center"
      }}
    >
      <form
        onSubmit={envoyerInvitation}
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
            Adresse email :
          </label>
        <input
          type="email"
          placeholder="Email de l'employé"
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
            Role :
          </label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="employe">Employé</option>
            <option value="admin">Admin</option>
            </select>
        </div>

        <button 
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
        type="submit">Créer l’invitation</button>
         </form>
    </div>

      {lien && (
        <div style={{ marginTop: "2rem" }}>
          <p>Lien d’invitation :</p>
          <input
            type="text"
            value={lien}
            readOnly
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
      )}
    </div>
  );
}

export default Invitations;