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


@router.get("/{recette_id}")
def get_recette(recette_id: int, user=Depends(get_current_user)):
    try:
        recette_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .select("*")
            .eq("id", recette_id)
            .execute()
        )

        if not recette_response.data:
            raise HTTPException(status_code=404, detail="Recette introuvable")

        recette = recette_response.data[0]

        lignes_response = (
            supabase
            .schema("joystock")
            .table("lignes_recette")
            .select("*, produits:produit_ingredient_id(nom, unite_id, unites:unite_id(nom))")
            .eq("recette_id", recette_id)
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

        return recette

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
def add_recette(data: dict, user = Depends(get_current_user)):
    require_admin(user)
    try:
        nom = data["nom"]
        ingredients = data["ingredients"]

        nouvelle_recette = {"nom": nom}

        # Prix de vente optionnel
        if data.get("prix_vente") is not None:
            nouvelle_recette["prix_vente"] = data["prix_vente"]

        recette_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .insert(nouvelle_recette)
            .execute()
        )

        recette_id = recette_response.data[0]["id"]

        lignes = [
            {
                "recette_id": recette_id,
                "produit_ingredient_id": ingredient["produit_ingredient_id"],
                "quantite": ingredient["quantite"]
            }
            for ingredient in ingredients
        ]

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
def update_recette(recette_id: int, data: dict, user=Depends(get_current_user)):
    require_admin(user)
    try:
        nom = data["nom"]
        ingredients = data["ingredients"]

        update_data = {"nom": nom}

        # Prix de vente optionnel — None = null en BDD
        if "prix_vente" in data:
            update_data["prix_vente"] = data["prix_vente"]

        recette_response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .update(update_data)
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

        lignes = [
            {
                "recette_id": recette_id,
                "produit_ingredient_id": ingredient["produit_ingredient_id"],
                "quantite": ingredient["quantite"]
            }
            for ingredient in ingredients
        ]

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


@router.patch("/update/{recette_id}/prix")
def update_prix_recette(recette_id: int, data: dict, user=Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("recettes")
            .update({"prix_vente": data.get("prix_vente")})
            .eq("id", recette_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Recette introuvable")

        return {
            "message": "Prix de vente mis à jour",
            "recette": response.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{recette_id}")
def delete_recette(recette_id: int, user=Depends(get_current_user)):
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

        return {"message": "Recette supprimée avec succès"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))