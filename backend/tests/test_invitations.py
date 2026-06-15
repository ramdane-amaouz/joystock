import pytest
from unittest.mock import patch, MagicMock


class TestInvitations:
    """Tests pour les routes /invitations"""

    def test_create_invitation_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la création d'invitation est refusée."""
        response = client_non_authentifie.post("/invitations/create", json={
            "email": "test@test.com",
            "role": "employe"
        })
        assert response.status_code == 422  # Header authorization manquant

    def test_create_invitation_employe_refuse(self, client_employe):
        """Un employé ne peut pas créer une invitation."""
        response = client_employe.post("/invitations/create", json={
            "email": "test@test.com",
            "role": "employe"
        })
        assert response.status_code == 403

    def test_create_invitation_admin_succes(self, client_admin):
        """Un admin peut créer une invitation."""
        with patch("routers.invitations.supabase") as mock_supabase:
            with patch("routers.invitations.send_invitation_email", return_value=True):
                mock_response = MagicMock()
                mock_response.data = [{
                    "id": 1,
                    "email": "nouveau@test.com",
                    "role": "employe",
                    "token": "fake-token-uuid",
                    "accepted_at": None,
                    "created_at": "2026-06-01T00:00:00"
                }]
                mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

                response = client_admin.post("/invitations/create", json={
                    "email": "nouveau@test.com",
                    "role": "employe"
                })
                assert response.status_code == 200
                assert response.json()["message"] == "Invitation créée avec succès"

    def test_get_invitation_token_valide(self, client_non_authentifie):
        """GET /invitations/{token} retourne l'invitation si le token est valide."""
        with patch("routers.invitations.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "email": "test@test.com",
                "role": "employe",
                "token": "valid-token",
                "accepted_at": None
            }]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/invitations/valid-token")
            assert response.status_code == 200

    def test_get_invitation_token_invalide(self, client_non_authentifie):
        """GET /invitations/{token} retourne 404 si token introuvable."""
        with patch("routers.invitations.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/invitations/token-inexistant")
            assert response.status_code == 404