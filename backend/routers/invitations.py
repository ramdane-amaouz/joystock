from fastapi import APIRouter, HTTPException, Depends
from database import supabase

from core.security import get_current_user, require_admin

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("/create")
def create_invitation(data: dict, user = Depends(get_current_user)):
    require_admin(user)
    try:
        email = data["email"]
        role = data.get("role", "employe")

        response = (
            supabase
            .schema("joystock")
            .table("invitations")
            .insert({
                "email": email,
                "role": role
            })
            .execute()
        )

        invitation = response.data[0]
        token = invitation["token"]

        lien = f"http://localhost:5173/inscription?token={token}"

        return {
            "message": "Invitation créée avec succès",
            "invitation": invitation,
            "lien": lien
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/accept")
def accept_invitation(data: dict, user = Depends(get_current_user)):
    try:
        token = data["token"]
        #user_id = data["user_id"]
        nom = data["nom"]
        prenom = data["prenom"]

        invitation_response = (
            supabase
            .schema("joystock")
            .table("invitations")
            .select("*")
            .eq("token", token)
            .is_("accepted_at", "null")
            .execute()
        )

        if not invitation_response.data:
            raise HTTPException(status_code=404, detail="Invitation invalide")

        invitation = invitation_response.data[0]

        profile_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .insert({
                "id": user["sub"],
                "nom": nom,
                "prenom": prenom,
                "email": invitation["email"],
                "role": invitation["role"]
            })
            .execute()
        )

        (
            supabase
            .schema("joystock")
            .table("invitations")
            .update({
                "accepted_at": "now()"
            })
            .eq("token", token)
            .execute()
        )

        return {
            "message": "Invitation acceptée",
            "profile": profile_response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{token}")
def get_invitation(token: str):
    try:
        response = (
            supabase
            .schema("joystock")
            .table("invitations")
            .select("*")
            .eq("token", token)
            .is_("accepted_at", "null")
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Invitation introuvable")

        return response.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))