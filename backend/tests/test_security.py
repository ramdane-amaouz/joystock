#from xmlrpc import client

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app


class TestSecurity:
    """Tests pour la sécurité et l'authentification"""

    # ── get_current_user ──────────────────────────────────────────────────────

    def test_route_protegee_sans_token_retourne_422(self):
        """Sans header Authorization, FastAPI retourne 422."""
        client = TestClient(app)
        response = client.get("/stats/alertes-stock")
        assert response.status_code == 422

    def test_route_protegee_token_invalide_retourne_401(self):
        """Avec un token invalide, retourne 401."""
        client = TestClient(app)
        response = client.get(
            "/stats/alertes-stock",
            headers={"Authorization": "Bearer token-bidon"}
        )
        assert response.status_code == 401

    def test_token_sans_bearer_retourne_401(self):
        """Un token sans préfixe Bearer retourne 401."""
        client = TestClient(app)
        response = client.get(
            "/stats/alertes-stock",
            headers={"Authorization": "token-sans-bearer"}
        )
        assert response.status_code == 401

    """def test_authorization_vide_retourne_422(self):
        #Un header Authorization vide retourne 422.
        client = TestClient(app)
        response = client.get(
            "/stats/alertes-stock",
            headers={"Authorization": ""}
        )
        assert response.status_code == 422
    """

    def test_authorization_vide_retourne_422(self):
        """Un header Authorization vide retourne 401 (token invalide)."""
        client = TestClient(app)
        response = client.get(
            "/stats/alertes-stock",
            headers={"Authorization": ""}
        )
        assert response.status_code == 401

    # ── require_admin ─────────────────────────────────────────────────────────

    def test_require_admin_employe_retourne_403(self, client_employe):
        """require_admin bloque un employé avec 403."""
        routes_admin_get = [
            "/stats/alertes-stock",
            "/stats/stock-theorique",
            "/stats/consommation",
            "/stats/derniere-consommation",
            "/stats/ventes/total-recettes",
            "/stats/ventes/par-jour",
            "/stats/ventes/par-semaine",
            "/ventes/",
            "/inventaires/inventaires_liste",
        ]
        for route in routes_admin_get:
            response = client_employe.get(route)
            assert response.status_code == 403, f"Route {route} devrait retourner 403 pour un employé"

        # Routes POST admin
        routes_admin_post = [
            ("/invitations/create", {"email": "x@x.com", "role": "employe"}),
            ("/produits/add", {"nom": "Test", "categorie_id": 1, "unite_id": 1}),
            ("/produits/categories/add", {"nom": "Test"}),
            ("/produits/unites/add", {"nom": "Test"}),
            ("/recettes/add", {"nom": "Test", "ingredients": []}),
        ]
        for route, body in routes_admin_post:
            response = client_employe.post(route, json=body)
            assert response.status_code == 403, f"Route POST {route} devrait retourner 403 pour un employé"

    def test_require_admin_admin_acces_autorise(self, client_admin):
        """Un admin a accès aux routes protégées."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/alertes-stock")
            assert response.status_code == 200

    # ── Routes publiques ──────────────────────────────────────────────────────

    def test_routes_publiques_accessibles_sans_token(self):
        """Les routes publiques sont accessibles sans token."""
        client = TestClient(app)

        routes_publiques = [
            "/produits",
            "/produits/count",
            "/produits/total-unites",
            "/produits/categories",
            "/produits/unites",
            "/produits/matieres-premieres",
        ]

        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_response.count = 0
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response

            for route in routes_publiques:
                response = client.get(route)
                assert response.status_code == 200, f"Route publique {route} devrait retourner 200 sans token"

    def test_route_protegee_avec_token_forge(self):
        client = TestClient(app)  # ← ajouter cette ligne
        faux_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlLXVzZXIiLCJyb2xlIjoiYWRtaW4ifQ.signature_forgee"
        response = client.get("/stats/previsions", headers={"Authorization": f"Bearer {faux_token}"})
        assert response.status_code == 401