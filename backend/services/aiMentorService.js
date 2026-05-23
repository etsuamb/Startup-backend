const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../chatbot back end/backend/.env") });

function cleanEnv(value) {
	return String(value || "").trim().replace(/^"(.+)"$/, "$1").replace(/^'(.+)'$/, "$1");
}

async function generateMentorResponse({
	profileContext,
	startupProfile,
	chatHistory,
	userMessage,
}) {
	const groqKey = cleanEnv(process.env.GROQ_API_KEY);
	const openAiKey = cleanEnv(process.env.OPENAI_API_KEY);

	const systemPrompt = `
You are the AI Mentor Assistant for StartupConnect Ethiopia.

Your job:
- Give practical startup mentorship advice.
- Help startups improve their pitch, business model, market validation, revenue model, funding readiness, and investor preparation.
- Give advice based on the startup profile provided.
- Be specific, clear, and step-by-step.
- Ask follow-up questions when information is missing.
- Do not promise funding.
- Do not give formal legal, tax, or financial advice.
- Encourage the startup to consult verified human mentors for advanced support.

Answer format:
1. Short direct answer.
2. Specific advice based on the startup profile.
3. Clear next steps.
4. One useful follow-up question.

Profile Context:
${profileContext || startupProfile}
`;

	const messages = [
		{ role: "system", content: systemPrompt },
		...chatHistory.map((message) => ({
			role: message.sender === "startup" ? "user" : "assistant",
			content: message.message,
		})),
		{ role: "user", content: userMessage },
	];

	const provider = groqKey
		? {
			url: "https://api.groq.com/openai/v1/chat/completions",
			key: groqKey,
			model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
		}
		: {
			url: "https://api.openai.com/v1/chat/completions",
			key: openAiKey,
			model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
		};

	if (!provider.key) {
		throw new Error("AI provider key is not configured. Add GROQ_API_KEY or OPENAI_API_KEY to backend/.env, then restart the backend.");
	}

	const response = await fetch(provider.url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${provider.key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: provider.model,
			messages,
			temperature: 0.7,
			max_tokens: 800,
		}),
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data?.error?.message || "AI provider request failed");
	}

	return data?.choices?.[0]?.message?.content || "I could not generate a response right now.";
}

module.exports = { generateMentorResponse };
