from fastapi import APIRouter, HTTPException, Depends
from database import supabase
#from auth import get_current_user
from core.security import get_current_user

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

