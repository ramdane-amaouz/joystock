import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app


class TestSecurity:
    """Tests pour la sécurité et l'authentification"""

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

    def test_require_admin_employe_retourne_403(self, client_employe):
        """require_admin bloque un employé avec 403."""
        routes_admin = [
            "/stats/alertes-stock",
            "/stats/stock-theorique",
            "/ventes/",
            "/invitations/create",
        ]
        for route in routes_admin:
            method = "post" if route == "/invitations/create" else "get"
            response = getattr(client_employe, method)(
                route,
                json={"email": "x@x.com", "role": "employe"} if method == "post" else None
            )
            assert response.status_code == 403, f"Route {route} devrait retourner 403 pour un employé"