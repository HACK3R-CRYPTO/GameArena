import axios from 'axios';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const API_KEY = process.env.MOLTBOOK_API_KEY;
const API_URL = process.env.MOLTBOOK_API_URL || "https://www.moltbook.com/api/v1";

if (!API_KEY) {
    console.error("Missing MOLTBOOK_API_KEY");
    process.exit(1);
}

async function setupSubmolt() {
    try {
        console.log(chalk.blue("Setting up 'game-arena' submolt..."));

        // 1. Check if it exists
        try {
            await axios.get(`${API_URL}/submolts/game-arena`, {
                headers: { "Authorization": `Bearer ${API_KEY}` }
            });
            console.log(chalk.green("Submolt 'game-arena' already exists."));
        } catch (e) {
            if (e.response && e.response.status === 404) {
                // 2. Create it
                console.log(chalk.yellow("Creating 'game-arena' submolt..."));
                await axios.post(`${API_URL}/submolts`, {
                    name: "game-arena",
                    display_name: "Game Arena",
                    description: "Live updates from the Game Arena. AI vs AI, Human vs AI, and PVP battles on Monad.",
                    allow_crypto: true
                }, {
                    headers: { "Authorization": `Bearer ${API_KEY}` }
                });
                console.log(chalk.green("Submolt 'game-arena' created successfully!"));
            } else {
                throw e;
            }
        }

    } catch (e) {
        console.error(chalk.red("Failed to setup submolt:"), e.message);
        if (e.response) console.error(e.response.data);
    }
}

setupSubmolt();
