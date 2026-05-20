"""on cree ici une route pour créer un inventaire, recuperer un inventaire, et ainsi metter a jour les données du stock dans la base de données"""
#router = APIRouter(prefix="/inventaires", tags=["inventaires"])





from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter(prefix="/inventaires", tags=["inventaires"])

@router.post("/demarrer-inventaire")
def terminer_inventaire(data: dict):
    try:
        user_id = data["user_id"] # Remplacez par l'ID de l'utilisateur qui démarre l'inventaire (solutiontemporelle, à remplacer par une solution d'authentification plus tard)
        lignes = data["lignes"]

        inventaire_response = (
            supabase
            .schema("joystock")
            .table("inventaires")
            .insert({
                "type": "stock",
                "user_id": "23c12726-50e7-460e-a706-f5d4773bb72e"
            })
            .execute()
        )

        inventaire_id = inventaire_response.data[0]["id"]

        lignes_a_inserer = []

        for ligne in lignes:
            lignes_a_inserer.append({
                "inventaire_id": inventaire_id,
                "produit_id": ligne["produit_id"],
                "quantite": ligne["quantite"]
            })

        lignes_response = (
            supabase
            .schema("joystock")
            .table("lignes_inventaire")
            .insert(lignes_a_inserer)
            .execute()
        )

        return {
            "message": "Inventaire terminé avec succès",
            "inventaire_id": inventaire_id,
            "lignes": lignes_response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



