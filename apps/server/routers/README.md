# Enchant HTTP surface

Enchant stays on Express (not Nest controllers) so it can be mounted **before** the `/api` auth/CORS/CSRF stack. HMAC verification uses `rawBody`; applying the session API middleware would change that contract.
