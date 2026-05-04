import { ChatGroq } from "@langchain/groq";

export const aiModel = new ChatGroq({
  model: "llama3-8b-8192",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

export const filterModel = new ChatGroq({
  model: "llama3-8b-8192",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY,
});