import os
import boto3
import json

dynamodb = boto3.resource("dynamodb")
conn_table = dynamodb.Table(os.environ["CONN_TABLE"])


def handler(event, context):
    route = event.get("requestContext", {}).get("routeKey")
    conn_id = event.get("requestContext", {}).get("connectionId")

    if not route or not conn_id:
        return {"statusCode": 400, "body": "Invalid connect event"}

    if route == "$connect":
        # Add connection to DynamoDB
        conn_table.put_item(Item={"pk": conn_id})
    elif route == "$disconnect":
        # Remove connection from DynamoDB
        conn_table.delete_item(Key={"pk": conn_id})
    # $default can be no-op or echo back
    return {"statusCode": 200, "body": json.dumps({"message": f"Route {route} successful"})}
