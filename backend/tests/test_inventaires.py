import pytest
from unittest.mock import patch, MagicMock


class TestDemarrerInventaire:
    """Tests pour POST /inventaires/demarrer-inventaire"""

    def test_demarrer_inventaire_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, l'inventaire est refusé."""
        response = client_non_authentifie.post("/inventaires/demarrer-inventaire", json={
            "lignes": [{"produit_id": 1, "quantite": 10}]
        })
        assert response.status_code == 422

    def test_demarrer_inventaire_succes(self, client_admin):
        """Un utilisateur connecté peut démarrer un inventaire."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            # Mock insertion inventaire
            mock_inventaire = MagicMock()
            mock_inventaire.data = [{"id": 42}]

            # Mock insertion lignes
            mock_lignes = MagicMock()
            mock_lignes.data = [
                {"inventaire_id": 42, "produit_id": 1, "quantite": 10},
                {"inventaire_id": 42, "produit_id": 2, "quantite": 25}
            ]

            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.side_effect = [
                mock_inventaire,
                mock_lignes
            ]

            response = client_admin.post("/inventaires/demarrer-inventaire", json={
                "lignes": [
                    {"produit_id": 1, "quantite": 10},
                    {"produit_id": 2, "quantite": 25}
                ]
            })

            assert response.status_code == 200
            assert response.json()["message"] == "Inventaire terminé avec succès"
            assert response.json()["inventaire_id"] == 42

    def test_demarrer_inventaire_lignes_vides(self, client_admin):
        """Un inventaire avec lignes vides crée quand même l'inventaire."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_inventaire = MagicMock()
            mock_inventaire.data = [{"id": 43}]

            mock_lignes = MagicMock()
            mock_lignes.data = []

            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.side_effect = [
                mock_inventaire,
                mock_lignes
            ]

            response = client_admin.post("/inventaires/demarrer-inventaire", json={
                "lignes": []
            })

            assert response.status_code == 200


class TestReceptionLivraison:
    """Tests pour POST /inventaires/reception-livraison"""

    def test_reception_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la réception est refusée."""
        response = client_non_authentifie.post("/inventaires/reception-livraison", json={
            "lignes": [{"produit_id": 1, "quantite": 10, "quantite_commandee": 12}]
        })
        assert response.status_code == 422

    def test_reception_succes(self, client_admin):
        """Un utilisateur connecté peut enregistrer une réception."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_inventaire = MagicMock()
            mock_inventaire.data = [{"id": 10}]

            mock_lignes = MagicMock()
            mock_lignes.data = [
                {"inventaire_id": 10, "produit_id": 1, "quantite": 10, "quantite_commandee": 12}
            ]

            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.side_effect = [
                mock_inventaire,
                mock_lignes
            ]

            response = client_admin.post("/inventaires/reception-livraison", json={
                "lignes": [
                    {"produit_id": 1, "quantite": 10, "quantite_commandee": 12}
                ]
            })

            assert response.status_code == 200
            assert response.json()["message"] == "Réception enregistrée avec succès"
            assert response.json()["inventaire_id"] == 10

    def test_reception_employe_succes(self, client_employe):
        """Un employé peut aussi enregistrer une réception."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_inventaire = MagicMock()
            mock_inventaire.data = [{"id": 11}]

            mock_lignes = MagicMock()
            mock_lignes.data = [
                {"inventaire_id": 11, "produit_id": 2, "quantite": 5, "quantite_commandee": 5}
            ]

            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.side_effect = [
                mock_inventaire,
                mock_lignes
            ]

            response = client_employe.post("/inventaires/reception-livraison", json={
                "lignes": [
                    {"produit_id": 2, "quantite": 5, "quantite_commandee": 5}
                ]
            })

            assert response.status_code == 200


class TestInventairesList:
    """Tests pour GET /inventaires/inventaires_liste"""

    def test_liste_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la liste est refusée."""
        response = client_non_authentifie.get("/inventaires/inventaires_liste")
        assert response.status_code == 422

    def test_liste_employe_refuse(self, client_employe):
        """Un employé ne peut pas voir la liste des inventaires."""
        response = client_employe.get("/inventaires/inventaires_liste")
        assert response.status_code == 403

    def test_liste_admin_succes(self, client_admin):
        """Un admin peut voir la liste des inventaires."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": 22,
                    "type": "stock",
                    "date_inventaire": "2026-05-22T13:11:41",
                    "utilisateur_nom": "testeur",
                    "utilisateur_prenom": "admin"
                },
                {
                    "id": 21,
                    "type": "reception",
                    "date_inventaire": "2026-05-22T13:08:54",
                    "utilisateur_nom": "testeur",
                    "utilisateur_prenom": "admin"
                }
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/inventaires/inventaires_liste")
            assert response.status_code == 200
            assert len(response.json()) == 2
            assert response.json()[0]["type"] == "stock"


class TestInventaireDetails:
    """Tests pour GET /inventaires/{id}/details"""

    def test_details_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, les détails sont refusés."""
        response = client_non_authentifie.get("/inventaires/22/details")
        assert response.status_code == 422

    def test_details_inventaire_existant(self, client_admin):
        """Les détails d'un inventaire existant sont retournés."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"produit_nom": "Coca cola", "categorie": "Boisson", "quantite": 200, "unite": "unite"},
                {"produit_nom": "Frites", "categorie": "Cuisine", "quantite": 30, "unite": "kg"}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.get("/inventaires/22/details")
            assert response.status_code == 200
            assert len(response.json()) == 2

    def test_details_inventaire_inexistant_retourne_404(self, client_admin):
        """Un inventaire inexistant retourne 404."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.get("/inventaires/9999/details")
            assert response.status_code == 404
            assert response.json()["detail"] == "Inventaire introuvable"

    def test_details_employe_succes(self, client_employe):
        """Un employé peut aussi voir les détails d'un inventaire."""
        with patch("routers.inventaires.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"produit_nom": "Bol", "categorie": "Cuisine", "quantite": 100, "unite": "unite"}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_employe.get("/inventaires/22/details")
            assert response.status_code == 200