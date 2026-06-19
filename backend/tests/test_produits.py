import pytest
from unittest.mock import patch, MagicMock


class TestGetProduits:
    """Tests pour GET /produits"""

    def test_get_produits_sans_auth_retourne_donnees(self, client_non_authentifie):
        """La route /produits est publique — pas besoin de token."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"produit_id": 1, "nom": "Coca cola", "quantite": 200, "unite": "unite"},
                {"produit_id": 2, "nom": "Frites", "quantite": 30, "unite": "kg"}
            ]
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    def test_get_produits_liste_vide(self, client_non_authentifie):
        """Retourne une liste vide s'il n'y a pas de produits."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits")
            assert response.status_code == 200
            assert response.json() == []

    def test_get_produits_count(self, client_non_authentifie):
        """GET /produits/count retourne un entier."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.count = 25
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/count")
            assert response.status_code == 200
            assert "count" in response.json()
            assert response.json()["count"] == 25

    def test_get_total_unites(self, client_non_authentifie):
        """GET /produits/total-unites retourne le total."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"total_unites": 10105}]
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/total-unites")
            assert response.status_code == 200
            assert response.json()["total_unites"] == 10105

    def test_get_total_unites_vide(self, client_non_authentifie):
        """GET /produits/total-unites retourne 0 si pas de données."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/total-unites")
            assert response.status_code == 200
            assert response.json()["total_unites"] == 0

    def test_get_categories(self, client_non_authentifie):
        """GET /produits/categories retourne la liste des catégories."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "nom": "Boisson"},
                {"id": 2, "nom": "Cuisine"}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/categories")
            assert response.status_code == 200
            assert len(response.json()) == 2

    def test_get_unites(self, client_non_authentifie):
        """GET /produits/unites retourne la liste des unités."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "nom": "kg"},
                {"id": 2, "nom": "unite"}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/unites")
            assert response.status_code == 200
            assert len(response.json()) == 2

    def test_get_matieres_premieres(self, client_non_authentifie):
        """GET /produits/matieres-premieres retourne les matières premières."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "nom": "Pain tacos", "type_produit": "matiere_premiere"}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .eq.return_value.eq.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/matieres-premieres")
            assert response.status_code == 200
            assert response.json()[0]["type_produit"] == "matiere_premiere"


class TestAddProduit:
    """Tests pour POST /produits/add"""

    def test_add_produit_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, ajout refusé."""
        response = client_non_authentifie.post("/produits/add", json={
            "nom": "Nouveau produit",
            "categorie_id": 1,
            "unite_id": 1
        })
        assert response.status_code == 422

    def test_add_produit_employe_refuse(self, client_employe):
        """Un employé ne peut pas ajouter un produit."""
        response = client_employe.post("/produits/add", json={
            "nom": "Produit interdit",
            "categorie_id": 1,
            "unite_id": 1
        })
        assert response.status_code == 403

    def test_add_produit_admin_succes(self, client_admin):
        """Un admin peut ajouter un produit."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "nom": "Nouveau produit",
                "categorie_id": 1,
                "unite_id": 1,
                "type_produit": "matiere_premiere",
                "actif": True
            }]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/produits/add", json={
                "nom": "Nouveau produit",
                "categorie_id": 1,
                "unite_id": 1
            })
            assert response.status_code == 200
            assert response.json()["message"] == "Produit ajouté avec succès"
            assert response.json()["produit"]["nom"] == "Nouveau produit"

    def test_add_produit_avec_type(self, client_admin):
        """Un admin peut spécifier le type de produit."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 2,
                "nom": "Bol",
                "type_produit": "consommable",
                "actif": True
            }]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/produits/add", json={
                "nom": "Bol",
                "categorie_id": 1,
                "unite_id": 2,
                "type_produit": "consommable"
            })
            assert response.status_code == 200


class TestCategories:
    """Tests pour les routes catégories"""

    def test_add_categorie_employe_refuse(self, client_employe):
        """Un employé ne peut pas ajouter une catégorie."""
        response = client_employe.post("/produits/categories/add", json={"nom": "Nouvelle"})
        assert response.status_code == 403

    def test_add_categorie_admin_succes(self, client_admin):
        """Un admin peut ajouter une catégorie."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 3, "nom": "Epicerie"}]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/produits/categories/add", json={"nom": "Epicerie"})
            assert response.status_code == 200
            assert response.json()["categorie"]["nom"] == "Epicerie"

    def test_add_categorie_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, ajout catégorie refusé."""
        response = client_non_authentifie.post("/produits/categories/add", json={"nom": "Test"})
        assert response.status_code == 422


class TestUnites:
    """Tests pour les routes unités"""

    def test_add_unite_employe_refuse(self, client_employe):
        """Un employé ne peut pas ajouter une unité."""
        response = client_employe.post("/produits/unites/add", json={"nom": "litre"})
        assert response.status_code == 403

    def test_add_unite_admin_succes(self, client_admin):
        """Un admin peut ajouter une unité."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 3, "nom": "litre"}]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/produits/unites/add", json={"nom": "litre"})
            assert response.status_code == 200
            assert response.json()["unite"]["nom"] == "litre"


class TestSeuilAlerte:
    """Tests pour PATCH /produits/{id}/seuil-alerte"""

    def test_update_seuil_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, modification refusée."""
        response = client_non_authentifie.patch("/produits/1/seuil-alerte", json={"seuil_alerte": 10})
        assert response.status_code == 422

    def test_update_seuil_employe_refuse(self, client_employe):
        """Un employé ne peut pas modifier le seuil."""
        response = client_employe.patch("/produits/1/seuil-alerte", json={"seuil_alerte": 10})
        assert response.status_code == 403

    def test_update_seuil_admin_succes(self, client_admin):
        """Un admin peut modifier le seuil d'alerte."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 1, "nom": "Bol", "seuil_alerte": 10}]
            mock_supabase.schema.return_value.table.return_value.update.return_value \
                .eq.return_value.execute.return_value = mock_response

            response = client_admin.patch("/produits/1/seuil-alerte", json={"seuil_alerte": 10})
            assert response.status_code == 200
            assert response.json()["message"] == "Seuil d'alerte mis à jour"

    def test_update_seuil_produit_inexistant(self, client_admin):
        """Retourne 404 si le produit n'existe pas."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.update.return_value \
                .eq.return_value.execute.return_value = mock_response

            response = client_admin.patch("/produits/9999/seuil-alerte", json={"seuil_alerte": 10})
            assert response.status_code == 404
            assert response.json()["detail"] == "Produit introuvable"