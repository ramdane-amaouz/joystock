import { Link } from "react-router-dom";

function Inventaire() {
  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "3rem" }}>
        Inventaire
      </h2>

      <div
        style={{
          marginTop: "1rem",
          textAlign: "center",
          border: "1px solid #ccc",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <Link
          to="/demarrer-inventaire"
          style={{
            color: "black",
            textDecoration: "none",
            fontSize: "2.1rem"
          }}
        >
          Démarrer un inventaire
        </Link>


      </div>

      <div
        style={{
          marginTop: "1rem",
          textAlign: "center",
          border: "1px solid #ccc",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >

        <Link
          to="/reception-livraison"
          style={{
            color: "black",
            textDecoration: "none",
            fontSize: "2.1rem"
          }}
        >
          Récéptionner une livraison
        </Link>

      </div>
    </div>
  );
}

export default Inventaire;