from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter(prefix="/profiles", tags=["profiles"])


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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
