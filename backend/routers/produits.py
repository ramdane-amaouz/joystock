"""on curee ici les route pour permettre a l'adminsitrateur d'ajouter un article a son stock, de supprimer un article de son stock, et de mettre a jour les données d'un article dans la base de données"""

from fastapi import APIRouter, HTTPException, Depends
from database import supabase
router = APIRouter(prefix="/produits", tags=["produits"])

from core.security import get_current_user, require_admin






"""endpoint pour recuperer tous les produits présents dans le resto (seulement afficher mon ne modifie pas les quantites)"""
@router.get("/")
def get_produits():
    try:
        #la requete a utiliser : "SELECT li.inventaire_id, p.nom, p.categorie, li.quantite, p.unite FROM joystock.lignes_inventaire li JOIN joystock.produits p ON li.produit_id = p.id WHERE li.inventaire_id = (SELECT MAX(inventaire_id) FROM joystock.lignes_inventaire);"
        response = supabase.schema("joystock").rpc("get_current_stock", {}).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    """    response = supabase.schema("joystock").table("produits").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""


"""endpoint pour recuperer le nombre de produits présents dans le stock"""
@router.get("/count")
def count_produits():
    try:
        reponse = supabase.schema("joystock").table("produits").select("*", count="exact").execute()
        return {"count": reponse.count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

"""endpoint pour recuperer le nombre total d'unite de produits présents dans le stock"""
@router.get("/total-unites")
def total_unites():
    try:
        reponse = supabase.schema("joystock").rpc("total_unites", {}).execute()

        if not reponse.data:
            return {"total_unites": 0}

        return {"total_unites": reponse.data[0]["total_unites"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



"""endpoint pour ajouter un produit dans le stock (ajouter une ligne dans la table produits, et une ligne dans la table lignes_inventaire pour mettre a jour les quantites) """
"""@router.post("/add")
def add_produit(produit: dict):
    try:
        #ajouter le produit dans la table produits
        response = supabase.schema("joystock").table("produits").insert(produit).execute()
        if response.status_code != 201:
            raise HTTPException(status_code=500, detail="Erreur lors de l'ajout du produit")
        
        #ajouter une ligne dans la table lignes_inventaire pour mettre a jour les quantites
        ligne_inventaire = {
            "produit_id": response.data[0]["id"],
            "quantite": produit["quantite"],
            "mouvement": "entrée"
        }
        response_ligne = supabase.schema("joystock").table("lignes_inventaire").insert(ligne_inventaire).execute()
        if response_ligne.status_code != 201:
            raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour de l'inventaire")
        
        return {"message": "Produit ajouté avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
  """  

@router.get("/categories")
def get_categories():
    try:
        response = (
            supabase
            .schema("joystock")
            .table("categories")
            .select("*")
            .order("nom")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unites")
def get_unites():
    try:
        response = (
            supabase
            .schema("joystock")
            .table("unites")
            .select("*")
            .order("nom")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
        

@router.post("/add")
def add_produit(produit: dict, user = Depends(get_current_user)):
    require_admin(user)
    try:
        nouveau_produit = {
            "nom": produit["nom"],
            "categorie_id": produit["categorie_id"],
            "unite_id": produit["unite_id"],
            "type_produit": produit.get("type_produit", "matiere_premiere"),
            "actif": True
        }

        response = (
            supabase
            .schema("joystock")
            .table("produits")
            .insert(nouveau_produit)
            .execute()
        )

        return {
            "message": "Produit ajouté avec succès",
            "produit": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/categories/add")
def add_categorie(categorie: dict, user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("categories")
            .insert({
                "nom": categorie["nom"]
            })
            .execute()
        )

        return {
            "message": "Catégorie ajoutée",
            "categorie": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unites/add")
def add_unite(unite: dict, user = Depends(get_current_user)):
    require_admin(user)
    try:
        response = (
            supabase
            .schema("joystock")
            .table("unites")
            .insert({
                "nom": unite["nom"]
            })
            .execute()
        )

        return {
            "message": "Unité ajoutée",
            "unite": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/matieres-premieres")
def get_matieres_premieres():
    try:
        response = (
            supabase
            .schema("joystock")
            .table("produits")
            .select("*")
            .eq("type_produit", "matiere_premiere")
            .eq("actif", True)
            .execute()
        )

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))