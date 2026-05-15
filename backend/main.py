from fastapi import FastAPI, HTTPException
from database import supabase

app = FastAPI(title="JoyStock API")


"""
    Endpoint de test pour vérifier que l'API fonctionne correctement et que la connexion à la base de données est établie
"""
@app.get("/")
def root():
    return {"message": "JoyStock API running"}

""""
    Endpoint de test pour vérifier la connexion à la table "produits" dans la base de données Supabase
"""
@app.get("/test-produits")
def test_produits():
    try:
        response = supabase.schema("joystock").table("produits").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




"""
    Importation des routeurs pour les différentes fonctionnalités de l'API
    - produits : pour consulter les produits dans le stock
    - inventaires : pour gérer les inventaires et les mises à jour de stock
    - stats : pour récupérer et calculer des statistiques sur les produits, les ventes, etc
    - auth : pour gérer l'authentification des utilisateurs et la sécurisation des routes
"""
from routers import produits, inventaires, stats, auth


"""
    Inclusion des routeurs dans l'application FastAPI
"""
app.include_router(produits.router)
#app.include_router(inventaires.router)
#app.include_router(stats.router)
#app.include_router(auth.router)

def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    produits.get_produits()

if __name__ == "__main__":    main()    
