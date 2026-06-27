from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from core.security import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.get("/me")
def get_me(user = Depends(get_current_user)):
    try:
        user_id = user["sub"]
        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profil introuvable")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inactifs")
def get_inactifs(user = Depends(get_current_user)):
    try:
        admin_id = user["sub"]
        admin_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("role")
            .eq("id", admin_id)
            .execute()
        )
        if not admin_response.data or admin_response.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux admins")

        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("*")
            .not_.is_("deleted_at", "null")
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_profile(user_id: str):
    try:
        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profil introuvable")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_all_profiles(user = Depends(get_current_user)):
    try:
        admin_id = user["sub"]
        admin_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("role")
            .eq("id", admin_id)
            .execute()
        )
        if not admin_response.data or admin_response.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux admins")

        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("*")
            .is_("deleted_at", "null")
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{user_id}/desactiver")
def desactiver_employe(user_id: str, user = Depends(get_current_user)):
    try:
        # Vérifier que c'est un admin
        admin_id = user["sub"]
        admin_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("role")
            .eq("id", admin_id)
            .execute()
        )
        if not admin_response.data or admin_response.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux admins")

        # Empêcher un admin de se désactiver lui-même
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Impossible de se désactiver soi-même")

        # Soft delete
        now = datetime.now(timezone.utc).isoformat()
        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .update({"deleted_at": now})
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profil introuvable")

        return {"message": "Employé désactivé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.patch("/{user_id}/reactiver")
def reactiver_employe(user_id: str, user = Depends(get_current_user)):
    try:
        admin_id = user["sub"]
        admin_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("role")
            .eq("id", admin_id)
            .execute()
        )
        if not admin_response.data or admin_response.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux admins")

        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .update({"deleted_at": None})
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profil introuvable")

        return {"message": "Employé réactivé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{user_id}/role")
def changer_role(user_id: str, body: dict, user = Depends(get_current_user)):
    try:
        admin_id = user["sub"]
        admin_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("role")
            .eq("id", admin_id)
            .execute()
        )
        if not admin_response.data or admin_response.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux admins")

        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Impossible de modifier son propre rôle")

        nouveau_role = body.get("role")
        if nouveau_role not in ["admin", "employe"]:
            raise HTTPException(status_code=400, detail="Rôle invalide")

        response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .update({"role": nouveau_role})
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profil introuvable")

        return {"message": f"Rôle mis à jour : {nouveau_role}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))