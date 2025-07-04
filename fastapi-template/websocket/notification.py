import os
import json
import boto3

dynamodb = boto3.resource("dynamodb")
conn_table = dynamodb.Table(os.environ["CONN_TABLE"])

api_gw = boto3.client(
    "apigatewaymanagementapi",
    endpoint_url=os.environ["WS_ENDPOINT"]
)

def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        action = body.get("action")
        data = json.dumps(body).encode("utf-8")

        # Fetch all connection IDs
        response = conn_table.scan()
        for item in response.get("Items", []):
            try:
                api_gw.post_to_connection(
                    ConnectionId=item["pk"],
                    Data=data
                )
            except api_gw.exceptions.GoneException:
                # Clean up stale connection
                conn_table.delete_item(Key={"pk": item["pk"]})
        return {"statusCode": 200, "body": "Message sent"}
    except Exception as e:
        return {"statusCode": 500, "body": str(e)}
