import os
from dotenv import load_dotenv

load_dotenv()  # charge ton .env

from mailer import send_invitation_email

result = send_invitation_email(
    to_email="test@test.com",  # peu importe, DEV_EMAIL prendra le dessus
    token="token-de-test-123"
)

print("Email envoyé ✅" if result else "Échec ❌")