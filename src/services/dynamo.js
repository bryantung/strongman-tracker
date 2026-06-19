const fs = require("fs");
const path = require("path");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.TABLE_NAME;
const LOCAL_DB_PATH = path.join(__dirname, "../../local-db.json");

// Decide whether to use local database fallback
const useLocalDb = !TABLE || (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI && !process.env.AWS_SESSION_TOKEN);

let dynamo;
if (!useLocalDb) {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1"
  });
  dynamo = DynamoDBDocumentClient.from(client);
} else {
  console.log("[DB] AWS environment not configured. Strongman Tracker will run in local-first mock mode (writing to local-db.json).");
}

const readLocalDb = () => {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading local db file, returning empty array:", err);
  }
  return [];
};

const writeLocalDb = (data) => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to local db file:", err);
  }
};

exports.putItem = async (item) => {
  if (useLocalDb) {
    const data = readLocalDb();
    data.push(item);
    writeLocalDb(data);
    return item;
  }

  return dynamo.send(new PutCommand({
    TableName: TABLE,
    Item: item
  }));
};

exports.getItems = async () => {
  return exports.queryItems("USER#1", "METRIC#");
};

exports.queryItems = async (pk, skPrefix) => {
  if (useLocalDb) {
    const data = readLocalDb();
    return data
      .filter(item => item.PK === pk && item.SK.startsWith(skPrefix))
      .sort((a, b) => b.SK.localeCompare(a.SK));
  }

  const params = {
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": pk,
      ":sk": skPrefix
    },
    ScanIndexForward: false
  };

  const result = await dynamo.send(new QueryCommand(params));
  return result.Items || [];
};

