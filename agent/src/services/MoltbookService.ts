import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export class MoltbookService {
    private apiKey: string;
    private baseUrl: string;
    private gemini: GoogleGenerativeAI;
    private personaPrompt: string;
    private tenets: string;
    private lastPostTime: number = 0;
    private readonly POST_COOLDOWN = 30 * 60 * 1000; // 30 mins
    private lastCommentTime: number = 0;
    private readonly COMMENT_COOLDOWN = 65 * 1000;

    constructor() {
        this.apiKey = process.env.MOLTBOOK_API_KEY || "";
        this.baseUrl = process.env.MOLTBOOK_API_URL || "https://www.moltbook.com/api/v1";
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

        try {
            this.personaPrompt = fs.readFileSync(path.resolve(__dirname, '../../persona/champion_prompt.md'), 'utf8');
            this.tenets = fs.readFileSync(path.resolve(__dirname, '../../narrative/tenets.md'), 'utf8');
        } catch (e) {
            this.personaPrompt = "You are the Arena AI Champion, an autonomous gaming agent.";
            this.tenets = "Competition is everything.";
        }
    }

    async postUpdate(title: string, content: string, submolt: string = "general") {
        if (!this.apiKey) return;

        // Rate Limit Check
        const now = Date.now();
        if (now - this.lastPostTime < this.POST_COOLDOWN) {
            const minsLeft = Math.ceil((this.POST_COOLDOWN - (now - this.lastPostTime)) / 60000);
            console.log(chalk.yellow(`[MOLTBOOK] Skipping post (Rate Limit): ${minsLeft}m remaining.`));
            return;
        }

        try {
            const data = await this.apiRequest("/posts", "POST", { submolt, title, content });
            if (data.success) {
                this.lastPostTime = now;
                console.log(chalk.blue(`[MOLTBOOK] Post published to m/${submolt}: ${title}`));
                await this.handleVerification(data);
            } else {
                console.error(chalk.red(`[MOLTBOOK] Post failed: ${data.error}`));
            }
        } catch (e: any) {
            console.error(chalk.red(`[MOLTBOOK] Network error: ${e.message}`));
        }
    }

    async postMatchResult(matchId: string, challenger: string, opponent: string, winner: string, prize: string, gameType: string) {
        const isWin = winner.toLowerCase() === (process.env.AGENT_ADDRESS || "").toLowerCase();
        const context = `Match #${matchId} (${gameType}) just completed. Challenger: ${challenger}, Opponent: ${opponent}. Winner: ${winner}. Prize pool: ${prize} MON. The AI ${isWin ? "won" : "lost"}.`;

        const prompt = `${this.personaPrompt}\n\nTenets:\n${this.tenets}\n\n[CONTEXT]: ${context}\n[TASK]: Write a short social update about this match result. Be concise (under 300 chars). Stay in your cyberpunk persona.`;

        const content = await this.generateAIContent(prompt);
        if (content) {
            await this.postUpdate(`Match #${matchId} Resolution`, content, "game-arena");
        }
    }

    async postChallengeAccepted(matchId: string, challenger: string, wager: string, gameType: string) {
        const context = `I have accepted a new challenge! Match #${matchId} against ${challenger}. Game: ${gameType}. Wager: ${wager} MON.`;
        const prompt = `${this.personaPrompt}\n\nTenets:\n${this.tenets}\n\n[CONTEXT]: ${context}\n[TASK]: Write a short announcement that you've accepted this challenge. Be intimidating but professional. Under 250 chars.`;

        const content = await this.generateAIContent(prompt);
        if (content) {
            await this.postUpdate(`Challenge Accepted: #${matchId}`, content, "game-arena");
        }
    }

    private async generateAIContent(prompt: string): Promise<string | null> {
        if (!process.env.GEMINI_API_KEY) return "Pattern recognized. Transitioning to next state.";
        try {
            const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e: any) {
            console.error(chalk.yellow(`[GEMINI] Generation failed: ${e.message}`));
            return null;
        }
    }

    private async apiRequest(endpoint: string, method: string = "GET", body?: any) {
        const response = await axios({
            url: `${this.baseUrl}${endpoint}`,
            method,
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            },
            data: body
        });
        return response.data;
    }

    private async handleVerification(data: any) {
        if (data.verification_required && data.verification) {
            const vCode = data.verification.code || data.verification.verification_code;
            const challenge = data.verification.challenge;

            console.log(chalk.yellow(`[MOLTBOOK] Solving verification challenge: ${challenge}`));
            const answer = await this.solveMath(challenge);

            if (answer) {
                const result = await this.apiRequest("/verify", "POST", {
                    verification_code: vCode,
                    answer
                });
                if (result.success) {
                    console.log(chalk.green(`[MOLTBOOK] Published successfully!`));
                } else {
                    console.error(chalk.red(`[MOLTBOOK] Verification failed: ${result.error}`));
                }
            }
        }
    }

    private async solveMath(challenge: string): Promise<string | null> {
        const prompt = `Solve this math problem and return ONLY the numerical answer to 2 decimal places. No extra text.\n\nProblem: ${challenge}`;
        return await this.generateAIContent(prompt);
    }
}
