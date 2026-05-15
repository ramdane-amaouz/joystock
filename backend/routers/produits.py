"""on curee ici les route pour permettre a l'adminsitrateur d'ajouter un article a son stock, de supprimer un article de son stock, et de mettre a jour les données d'un article dans la base de données"""

from fastapi import APIRouter, HTTPException
from database import supabase
router = APIRouter(prefix="/produits", tags=["produits"])






"""endpoint pour recuperer tous les produits présents dans le resto (seulement afficher mon ne modifie pas les quantites)"""
@router.get("/")
def get_produits():
    try:
        # On récupère tous les produits de la table "produits"
        response = supabase.schema("joystock").table("produits").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



