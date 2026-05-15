"""ici on pourra créer des routes pour recuperer des statistiques sur les produits, les ventes, les inventaires, etc. mais aussi d'en calculer pour permettre à l'administrateur de mieux comprendre son stock et ses performances"""


#from backend import database
from fastapi import APIRouter, HTTPException
from database import supabase
router = APIRouter(prefix="/stats", tags=["stats"] )


