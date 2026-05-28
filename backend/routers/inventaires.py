from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from core.security import get_current_user

router = APIRouter(prefix="/inventaires", tags=["inventaires"])


@router.post("/demarrer-inventaire")
def terminer_inventaire(
    data: dict,
    user = Depends(get_current_user)
):
    try:
        user_id = user["sub"]
        lignes = data["lignes"]

        inventaire_response = (
            supabase
            .schema("joystock")
            .table("inventaires")
            .insert({
                "type": "stock",
                "user_id": user_id
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


@router.post("/reception-livraison")
def reception_livraison(
    data: dict,
    user = Depends(get_current_user)
):
    try:
        user_id = user["sub"]
        lignes = data["lignes"]

        inventaire_response = (
            supabase
            .schema("joystock")
            .table("inventaires")
            .insert({
                "type": "reception",
                "user_id": user_id
            })
            .execute()
        )

        inventaire_id = inventaire_response.data[0]["id"]

        lignes_a_inserer = []

        for ligne in lignes:
            lignes_a_inserer.append({
                "inventaire_id": inventaire_id,
                "produit_id": ligne["produit_id"],
                "quantite": ligne["quantite"],
                "quantite_commandee": ligne["quantite_commandee"]
            })

        lignes_response = (
            supabase
            .schema("joystock")
            .table("lignes_inventaire")
            .insert(lignes_a_inserer)
            .execute()
        )

        return {
            "message": "Réception enregistrée avec succès",
            "inventaire_id": inventaire_id,
            "lignes": lignes_response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))