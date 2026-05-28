import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";




function Profile() {
  const [profil, setProfil] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function chargerProfil() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          setErreur("Utilisateur non connecté");
          return;
        }

        const userId = data.user.id;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/profiles/${userId}`
        );

        if (!response.ok) {
          throw new Error("Profil introuvable");
        }

        const profilData = await response.json();
        setProfil(profilData);
      } catch (error) {
        setErreur("Erreur lors du chargement du profil");
      }
    }

    chargerProfil();
  }, []);




///////fonction temporaire pour tester le endpoint /profiles/me avec token d'authentification/////////
  async function testerProfileMe() {
    const { data } = await supabase.auth.getSession();

    console.log("SESSION :", data.session);
    console.log("TOKEN :", data.session.access_token);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/me`, {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    });

    const profil = await response.json();

    console.log("PROFIL /ME :", profil);
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////



  return (
    <div>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {!profil && !erreur ? (
        <p>Chargement...</p>
      ) : (
        profil && (
          <div>
            <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>
              Mon profil
            </h2>

            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                <p>
                <strong>Nom :</strong> {profil.nom}
                </p>

                <p>
                <strong>Prénom :</strong> {profil.prenom}
                </p>

                <p>
                <strong>Email :</strong> {profil.email}
                </p>

                <p>
                <strong>Rôle :</strong> {profil.role}
                </p>

                <p>
                    <strong>Date de création :</strong> {profil.created_at}
                </p>
            </div>
          </div>
        )
      )}


      <button onClick={testerProfileMe}>
        Tester /profiles/me
      </button>
    </div>
  );
}

export default Profile;