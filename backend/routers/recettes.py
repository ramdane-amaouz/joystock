from fastapi import APIRouter, HTTPException, Depends
from database import supabase

from core.security import get_current_user, require_admin

router = APIRouter(prefix="/recettes", tags=["recettes"])


@router.get("/")
def get_recettes(required_user = Depends(get_current_user)):
    try:
        recettes_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .select("*")
            .order("id", desc=True)
            .execute()
        )

        recettes = recettes_response.data

        for recette in recettes:
            lignes_response = (
                supabase
                .schema("joystock")
                .table("lignes_recette")
                .select("*, produits:produit_ingredient_id(nom, unite_id, unites:unite_id(nom))")
                .eq("recette_id", recette["id"])
                .execute()
            )

            recette["ingredients"] = [
                {
                    "produit_ingredient_id": ligne["produit_ingredient_id"],
                    "produit_ingredient_nom": ligne["produits"]["nom"],
                    "quantite": ligne["quantite"],
                    "unite_nom": ligne["produits"]["unites"]["nom"]
                }
                for ligne in lignes_response.data
            ]

        return recettes

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
def add_recette(data: dict, user = Depends(get_current_user)):
    require_admin(user)
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
    

@router.put("/update/{recette_id}")
def update_recette(
    recette_id: int,
    data: dict,
    user=Depends(get_current_user)
):
    require_admin(user)

    try:
        nom = data["nom"]
        ingredients = data["ingredients"]

        recette_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .update({"nom": nom})
            .eq("id", recette_id)
            .execute()
        )

        (
            supabase
            .schema("joystock")
            .table("lignes_recette")
            .delete()
            .eq("recette_id", recette_id)
            .execute()
        )

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
            "message": "Recette mise à jour avec succès",
            "recette": recette_response.data[0] if recette_response.data else None,
            "ingredients": lignes_response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{recette_id}")
def delete_recette(
    recette_id: int,
    user=Depends(get_current_user)
):
    require_admin(user)

    try:
        (
            supabase
            .schema("joystock")
            .table("lignes_recette")
            .delete()
            .eq("recette_id", recette_id)
            .execute()
        )

        (
            supabase
            .schema("joystock")
            .table("recettes")
            .delete()
            .eq("id", recette_id)
            .execute()
        )

        return {
            "message": "Recette supprimée avec succès"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))