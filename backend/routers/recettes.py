from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter(prefix="/recettes", tags=["recettes"])


@router.get("/")
def get_recettes():
    try:
        response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .select("*")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
def add_recette(data: dict):
    try:
        nom = data["nom"]
        ingredients = data["ingredients"]

        recette_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .insert({
                "nom": nom
            })
            .execute()
        )

        recette_id = recette_response.data[0]["id"]

        lignes = []
        for ingredient in ingredients:
            lignes.append({
                "recette_id": recette_id,
                "produit_ingredient_id": ingredient["produit_ingredient_id"],
                "quantite": ingredient["quantite"]
            })

        lignes_response = (
            supabase
            .schema("joystock")
            .table("lignes_recette")
            .insert(lignes)
            .execute()
        )

        return {
            "message": "Recette créée avec succès",
            "recette": recette_response.data[0],
            "ingredients": lignes_response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))