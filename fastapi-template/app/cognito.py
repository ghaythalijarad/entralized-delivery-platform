import boto3
import requests
from jose import jwt
from typing import List

from .config import config

# Initialize Cognito client
db = boto3.client('cognito-idp', region_name=config.COGNITO_REGION)

# JWKS URL for public keys
JWKS_URL = f"https://cognito-idp.{config.COGNITO_REGION}.amazonaws.com/{config.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
_jwks = requests.get(JWKS_URL).json()


def initiate_auth(username: str, password: str) -> dict:
    """
    Authenticate user against Cognito User Pool and return authentication result.
    """
    resp = db.initiate_auth(
        AuthFlow='USER_PASSWORD_AUTH',
        AuthParameters={'USERNAME': username, 'PASSWORD': password},
        ClientId=config.COGNITO_APP_CLIENT_ID
    )
    return resp['AuthenticationResult']


def get_user_groups(username: str) -> List[str]:
    """
    List the Cognito groups for a given user.
    """
    resp = db.admin_list_groups_for_user(
        Username=username,
        UserPoolId=config.COGNITO_USER_POOL_ID
    )
    return [g['GroupName'] for g in resp.get('Groups', [])]


def verify_jwt(token: str) -> dict:
    """
    Verify and decode a Cognito JWT token.
    """
    headers = jwt.get_unverified_header(token)
    key = next(k for k in _jwks['keys'] if k['kid'] == headers['kid'])
    return jwt.decode(token, key, algorithms=['RS256'], audience=config.COGNITO_APP_CLIENT_ID)


def list_users():
    """
    List all users in the Cognito user pool.
    """
    resp = db.list_users(UserPoolId=config.COGNITO_USER_POOL_ID)
    return resp.get('Users', [])


def admin_add_user_to_group(username: str, group_name: str):
    """
    Add a user to a Cognito group.
    """
    db.admin_add_user_to_group(
        UserPoolId=config.COGNITO_USER_POOL_ID,
        Username=username,
        GroupName=group_name
    )


def admin_remove_user_from_group(username: str, group_name: str):
    """
    Remove a user from a Cognito group.
    """
    db.admin_remove_user_from_group(
        UserPoolId=config.COGNITO_USER_POOL_ID,
        Username=username,
        GroupName=group_name
    )
