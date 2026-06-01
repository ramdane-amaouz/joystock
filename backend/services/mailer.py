import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")

def send_invitation_email(to_email: str, token: str) -> bool:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    lien = f"{frontend_url}/inscription?token={token}"

    # En dev, Resend force l'envoi vers ton email de compte
    dev_email = os.getenv("DEV_EMAIL")
    recipient = dev_email if dev_email else to_email

    try:
        resend.Emails.send({
            "from": "JoyStock <onboarding@resend.dev>",  # domaine vérifié sur Resend
            "to": [recipient],
            "subject": "Vous avez été invité à rejoindre JoyStock",
            "html": f"""
                <h2>Bienvenue sur JoyStock 👋</h2>
                <p>Vous avez été invité à rejoindre l'équipe.</p>
                <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
                <a href="{lien}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                ">
                    Accepter l'invitation
                </a>
                <p style="color: #888; font-size: 12px;">
                    Ou copiez ce lien : {lien}
                </p>
            """
        })
        return True
    except Exception as e:
        print(f"Erreur envoi email : {e}")
        return False