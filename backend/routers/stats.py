from fastapi import APIRouter, HTTPException, Depends
from database import supabase

from core.security import get_current_user, require_admin

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/consommation")
def get_consommation(user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("v_consommation_par_periode")
            .select("*")
            .order("date_stock_actuel")
            .execute()
        )

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/derniere-consommation")
def get_derniere_consommation(user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("v_derniere_consommation")
            .select("*")
            .order("consommation_estimee", desc=True)
            .execute()
        )

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/ventes/total-recettes")
def get_total_ventes_par_recette(user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("v_total_ventes_par_recette")
            .select("*")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ventes/par-jour")
def get_ventes_par_jour(user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("v_ventes_par_jour")
            .select("*")
            .order("jour")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ventes/par-semaine")
def get_ventes_par_semaine(user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("v_ventes_par_semaine")
            .select("*")
            .order("semaine")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))