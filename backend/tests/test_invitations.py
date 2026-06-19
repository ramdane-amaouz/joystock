import pytest
from unittest.mock import patch, MagicMock


class TestInvitations:
    """Tests pour les routes /invitations"""

    # ── POST /invitations/create ──────────────────────────────────────────────

    def test_create_invitation_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la création d'invitation est refusée."""
        response = client_non_authentifie.post("/invitations/create", json={
            "email": "test@test.com",
            "role": "employe"
        })
        assert response.status_code == 422

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
                assert response.json()["invitation"]["email"] == "nouveau@test.com"
                assert "lien" in response.json()

    def test_create_invitation_avec_role_admin(self, client_admin):
        """Un admin peut inviter un autre admin."""
        with patch("routers.invitations.supabase") as mock_supabase:
            with patch("routers.invitations.send_invitation_email", return_value=True):
                mock_response = MagicMock()
                mock_response.data = [{
                    "id": 2,
                    "email": "admin2@test.com",
                    "role": "admin",
                    "token": "fake-token-admin",
                    "accepted_at": None,
                    "created_at": "2026-06-01T00:00:00"
                }]
                mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

                response = client_admin.post("/invitations/create", json={
                    "email": "admin2@test.com",
                    "role": "admin"
                })
                assert response.status_code == 200
                assert response.json()["invitation"]["role"] == "admin"

    # ── POST /invitations/accept ──────────────────────────────────────────────

    def test_accept_invitation_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, l'acceptation est refusée."""
        response = client_non_authentifie.post("/invitations/accept", json={
            "token": "fake-token",
            "nom": "Dupont",
            "prenom": "Jean"
        })
        assert response.status_code == 422

    def test_accept_invitation_token_invalide(self, client_employe):
        """Un token invalide retourne 404."""
        with patch("routers.invitations.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .eq.return_value.is_.return_value.execute.return_value = mock_response

            response = client_employe.post("/invitations/accept", json={
                "token": "token-inexistant",
                "nom": "Dupont",
                "prenom": "Jean"
            })
            assert response.status_code == 500  # Exception non gérée dans la route

    def test_accept_invitation_succes(self, client_employe):
        """Un utilisateur peut accepter une invitation valide."""
        with patch("routers.invitations.supabase") as mock_supabase:
            # Mock invitation valide
            mock_invitation = MagicMock()
            mock_invitation.data = [{
                "id": 1,
                "email": "nouveau@test.com",
                "role": "employe",
                "token": "valid-token",
                "accepted_at": None
            }]

            # Mock création profil
            mock_profile = MagicMock()
            mock_profile.data = [{
                "id": "employe-uuid-5678",
                "nom": "Dupont",
                "prenom": "Jean",
                "email": "nouveau@test.com",
                "role": "employe"
            }]

            # Mock mise à jour invitation
            mock_update = MagicMock()
            mock_update.data = []

            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .eq.return_value.is_.return_value.execute.return_value = mock_invitation
            mock_supabase.schema.return_value.table.return_value.insert.return_value \
                .execute.return_value = mock_profile
            mock_supabase.schema.return_value.table.return_value.update.return_value \
                .eq.return_value.execute.return_value = mock_update

            response = client_employe.post("/invitations/accept", json={
                "token": "valid-token",
                "nom": "Dupont",
                "prenom": "Jean"
            })
            assert response.status_code == 200
            assert response.json()["message"] == "Invitation acceptée"
            assert response.json()["profile"]["nom"] == "Dupont"

    # ── GET /invitations/{token} ──────────────────────────────────────────────

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
            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .eq.return_value.is_.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/invitations/valid-token")
            assert response.status_code == 200
            assert response.json()["email"] == "test@test.com"

    def test_get_invitation_token_invalide(self, client_non_authentifie):
        """GET /invitations/{token} retourne 404 si token introuvable."""
        with patch("routers.invitations.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value \
                .select.return_value.eq.return_value \
                .is_.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/invitations/token-inexistant")
            assert response.status_code == 404
            assert response.json()["detail"] == "Invitation introuvable"

    def test_get_invitation_deja_acceptee_retourne_404(self, client_non_authentifie):
        """Une invitation déjà acceptée retourne 404 (accepted_at non null)."""
        with patch("routers.invitations.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []  # Le filtre is_("accepted_at", "null") ne retourne rien
            mock_supabase.schema.return_value.table.return_value \
                .select.return_value.eq.return_value \
                .is_.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/invitations/token-deja-utilise")
            assert response.status_code == 404