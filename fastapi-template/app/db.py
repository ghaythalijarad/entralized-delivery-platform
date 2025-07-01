import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK (put your downloaded JSON next to this file)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()