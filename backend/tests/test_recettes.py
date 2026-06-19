import pytest
from unittest.mock import patch, MagicMock


FAKE_RECETTE = {
    "id": 1,
    "nom": "Tacos poulet"
}

FAKE_INGREDIENT = {
    "produit_ingredient_id": 1,
    "quantite": 2,
    "produits": {
        "nom": "Pain tacos",
        "unite_id": 1,
        "unites": {"nom": "unite"}
    }
}


class TestGetRecettes:
    """Tests pour GET /recettes/"""

    def test_get_recettes_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la liste des recettes est refusée."""
        response = client_non_authentifie.get("/recettes/")
        assert response.status_code == 422

    def test_get_recettes_succes(self, client_admin):
        """Un admin peut récupérer la liste des recettes."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recettes = MagicMock()
            mock_recettes.data = [FAKE_RECETTE.copy()]

            mock_lignes = MagicMock()
            mock_lignes.data = [FAKE_INGREDIENT]

            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_recettes
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_lignes

            response = client_admin.get("/recettes/")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert response.json()[0]["nom"] == "Tacos poulet"

    def test_get_recettes_employe_succes(self, client_employe):
        """Un employé peut aussi voir les recettes."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recettes = MagicMock()
            mock_recettes.data = [FAKE_RECETTE.copy()]

            mock_lignes = MagicMock()
            mock_lignes.data = []

            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_recettes
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_lignes

            response = client_employe.get("/recettes/")
            assert response.status_code == 200

    def test_get_recettes_liste_vide(self, client_admin):
        """Retourne une liste vide s'il n'y a pas de recettes."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recettes = MagicMock()
            mock_recettes.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_recettes

            response = client_admin.get("/recettes/")
            assert response.status_code == 200
            assert response.json() == []


class TestGetRecette:
    """Tests pour GET /recettes/{recette_id}"""

    def test_get_recette_existante(self, client_admin):
        """Retourne la recette si elle existe."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recette = MagicMock()
            mock_recette.data = [FAKE_RECETTE.copy()]

            mock_lignes = MagicMock()
            mock_lignes.data = [FAKE_INGREDIENT]

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
                mock_recette,
                mock_lignes
            ]

            response = client_admin.get("/recettes/1")
            assert response.status_code == 200
            assert response.json()["nom"] == "Tacos poulet"
            assert "ingredients" in response.json()

    def test_get_recette_inexistante_retourne_404(self, client_admin):
        """Retourne 404 si la recette n'existe pas."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recette = MagicMock()
            mock_recette.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_recette

            response = client_admin.get("/recettes/9999")
            assert response.status_code == 404
            assert response.json()["detail"] == "Recette introuvable"

    def test_get_recette_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, accès refusé."""
        response = client_non_authentifie.get("/recettes/1")
        assert response.status_code == 422


class TestAddRecette:
    """Tests pour POST /recettes/add"""

    def test_add_recette_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, création refusée."""
        response = client_non_authentifie.post("/recettes/add", json={
            "nom": "Tacos boeuf",
            "ingredients": []
        })
        assert response.status_code == 422

    def test_add_recette_employe_refuse(self, client_employe):
        """Un employé ne peut pas créer une recette."""
        response = client_employe.post("/recettes/add", json={
            "nom": "Tacos boeuf",
            "ingredients": []
        })
        assert response.status_code == 403

    def test_add_recette_admin_succes(self, client_admin):
        """Un admin peut créer une recette."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_recette = MagicMock()
            mock_recette.data = [{"id": 2, "nom": "Tacos boeuf"}]

            mock_lignes = MagicMock()
            mock_lignes.data = [
                {"recette_id": 2, "produit_ingredient_id": 1, "quantite": 3}
            ]

            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.side_effect = [
                mock_recette,
                mock_lignes
            ]

            response = client_admin.post("/recettes/add", json={
                "nom": "Tacos boeuf",
                "ingredients": [{"produit_ingredient_id": 1, "quantite": 3}]
            })

            assert response.status_code == 200
            assert response.json()["message"] == "Recette créée avec succès"
            assert response.json()["recette"]["nom"] == "Tacos boeuf"


class TestUpdateRecette:
    """Tests pour PUT /recettes/update/{recette_id}"""

    def test_update_recette_employe_refuse(self, client_employe):
        """Un employé ne peut pas modifier une recette."""
        response = client_employe.put("/recettes/update/1", json={
            "nom": "Nouveau nom",
            "ingredients": []
        })
        assert response.status_code == 403

    def test_update_recette_admin_succes(self, client_admin):
        """Un admin peut modifier une recette."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_update = MagicMock()
            mock_update.data = [{"id": 1, "nom": "Tacos poulet modifié"}]

            mock_delete = MagicMock()
            mock_delete.data = []

            mock_lignes = MagicMock()
            mock_lignes.data = [{"recette_id": 1, "produit_ingredient_id": 1, "quantite": 2}]

            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update
            mock_supabase.schema.return_value.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_delete
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_lignes

            response = client_admin.put("/recettes/update/1", json={
                "nom": "Tacos poulet modifié",
                "ingredients": [{"produit_ingredient_id": 1, "quantite": 2}]
            })

            assert response.status_code == 200
            assert response.json()["message"] == "Recette mise à jour avec succès"

    def test_update_recette_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, modification refusée."""
        response = client_non_authentifie.put("/recettes/update/1", json={
            "nom": "Nouveau nom",
            "ingredients": []
        })
        assert response.status_code == 422


class TestDeleteRecette:
    """Tests pour DELETE /recettes/delete/{recette_id}"""

    def test_delete_recette_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, suppression refusée."""
        response = client_non_authentifie.delete("/recettes/delete/1")
        assert response.status_code == 422

    def test_delete_recette_employe_refuse(self, client_employe):
        """Un employé ne peut pas supprimer une recette."""
        response = client_employe.delete("/recettes/delete/1")
        assert response.status_code == 403

    def test_delete_recette_admin_succes(self, client_admin):
        """Un admin peut supprimer une recette."""
        with patch("routers.recettes.supabase") as mock_supabase:
            mock_delete = MagicMock()
            mock_delete.data = []
            mock_supabase.schema.return_value.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_delete

            response = client_admin.delete("/recettes/delete/1")
            assert response.status_code == 200
            assert response.json()["message"] == "Recette supprimée avec succès"