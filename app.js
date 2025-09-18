/*************************
 *     IMPORTS & CONFIG
 *************************/
import fs from "fs";
import path from "path";
import "dotenv/config";
import express from "express";
import { config } from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import { Client, Collection, GatewayIntentBits } from "discord.js";

// Load environment variables
config();
const { DISCORD_TOKEN, PUBLIC_KEY, PORT = 3001, MONGO_URI } = process.env;

if (!DISCORD_TOKEN || !PUBLIC_KEY) {
  console.error("DISCORD_TOKEN and PUBLIC_KEY are required");
  process.exit(1);
}

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is required");
  process.exit(1);
}
// Root directory
const ROOT_DIR = process.cwd();

/*************************
 *   MONGODB CONNECTION
 *************************/
const MONGO_CLIENT = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database = null;

/**
 * Connects to MongoDB and sets the global `database` variable.
 */
async function connectDatabase() {
  await MONGO_CLIENT.connect();
  database = MONGO_CLIENT.db("veilborn");
  // Ping for sanity check
  await database.command({ ping: 1 });
  console.log("Successfully connected to MongoDB!");
}

/*************************
 *   DISCORD CLIENT SETUP
 *************************/
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Prepare commands collection
client.commands = new Collection();

/*************************
 *   EXPRESS SERVER SETUP
 *************************/
const app = express();
app.use(express.json());
app.listen(PORT, () => {
  console.log("Express server is listening on port", PORT);
});

/*************************
 *  BOOTSTRAP FUNCTION
 *************************/
async function main() {
  // 1) Wait for the DB to connect
  await connectDatabase();

  // 2) Load commands
  await loadCommands();

  // 3) Load events (now we pass in the guaranteed `database`)
  await loadEvents(database);

  // 4) Finally log in to Discord (this makes the bot go online)
  try {
    await client.login(DISCORD_TOKEN);
    console.log("✅ Veilborn Bot logged in successfully!");
  } catch (error) {
    console.error("❌ Failed to login to Discord:");
    console.error("   - Check your DISCORD_TOKEN in .env file");
    console.error("   - Make sure the token is valid and not expired");
    console.error("   - Verify the bot has proper permissions");
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

/*************************
 *     LOAD COMMANDS
 *************************/
async function loadCommands() {
  const COMMANDS_PATH = path.join(ROOT_DIR, "app/commands");
  const commandFiles = fs
    .readdirSync(COMMANDS_PATH)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(COMMANDS_PATH, file);
    try {
      const commandModule = await import(`file://${filePath}`);
      const command = commandModule.default;
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.warn(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
    }
  }
}

/*************************
 *     LOAD EVENTS
 *************************/
async function loadEvents(db) {
  const EVENTS_FOLDER = path.join(ROOT_DIR, "app", "events");
  const eventFiles = fs
    .readdirSync(EVENTS_FOLDER)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(EVENTS_FOLDER, file);
    const eventModule = await import(`file://${filePath}`);

    // Each event file default-exports a function that takes (client, database)
    if (typeof eventModule.default === "function") {
      eventModule.default(client, db);
    } else {
      console.error(`Event file ${file} is missing a default export function.`);
    }
  }

  // Pass the verification function to commands that need it (adapted for veilborn if needed)
  try {
    const { setChannelVerificationFunction } = await import(
      "./app/commands/setup-channels.js"
    );
    const { verifyAndCreateMissingChannels } = await import(
      "./app/events/onReady.js"
    );

    if (setChannelVerificationFunction && verifyAndCreateMissingChannels) {
      setChannelVerificationFunction(verifyAndCreateMissingChannels);
      console.log(
        "✅ Channel verification function passed to setup-channels command"
      );
    }
  } catch (error) {
    console.error("❌ Failed to set up channel verification function:", error);
  }
}

// Execute our main function
main().catch((err) => console.error("Error in main()", err));
