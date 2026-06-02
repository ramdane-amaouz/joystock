from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from core.security import get_current_user, require_admin

router = APIRouter(prefix="/ventes", tags=["ventes"])


@router.post("/add")
def add_vente(data: dict, user=Depends(get_current_user)):
    try:
        recette_id = data["recette_id"]
        quantite_vendue = data["quantite_vendue"]
        date_vente = data.get("date_vente")  # optionnel, Supabase mettra now() par défaut

        payload = {
            "recette_id": recette_id,
            "quantite_vendue": quantite_vendue
        }

        if date_vente:
            payload["date_vente"] = date_vente

        response = (
            supabase
            .schema("joystock")
            .table("ventes")
            .insert(payload)
            .execute()
        )

        return {
            "message": "Vente enregistrée avec succès",
            "vente": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-batch")
def add_ventes_batch(data: dict, user=Depends(get_current_user)):
    """Insérer plusieurs ventes en une seule requête — utile pour import caisse"""
    try:
        ventes = data["ventes"]  # liste de {recette_id, quantite_vendue, date_vente?}

        payload = []
        for vente in ventes:
            item = {
                "recette_id": vente["recette_id"],
                "quantite_vendue": vente["quantite_vendue"]
            }
            if "date_vente" in vente:
                item["date_vente"] = vente["date_vente"]
            payload.append(item)

        response = (
            supabase
            .schema("joystock")
            .table("ventes")
            .insert(payload)
            .execute()
        )

        return {
            "message": f"{len(response.data)} vente(s) enregistrée(s)",
            "ventes": response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_ventes(user=Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("ventes")
            .select("*, recettes:recette_id(nom)")
            .order("date_vente", desc=True)
            .execute()
        )

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{vente_id}")
def delete_vente(vente_id: int, user=Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("ventes")
            .delete()
            .eq("id", vente_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Vente introuvable")

        return {"message": "Vente supprimée avec succès"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))