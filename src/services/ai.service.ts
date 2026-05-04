import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { Listing, Review } from "@prisma/client";

const sessions = new Map<string, BaseMessage[]>();

function getModel(temperature = 0.3) {
  if (!process.env.GROQ_API_KEY) return null;
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature
  });
}

export function parseFallbackListingQuery(query: string) {
  const q = query.toLowerCase();
  const filters: any = {};
  const locations = ["kigali", "huye", "musanze", "rubavu", "nyamata", "nyarutarama", "kacyiru", "remera"];
  const foundLocation = locations.find((loc) => q.includes(loc));
  if (foundLocation) filters.location = foundLocation;
  if (q.includes("apartment")) filters.type = "APARTMENT";
  if (q.includes("house")) filters.type = "HOUSE";
  if (q.includes("villa")) filters.type = "VILLA";
  if (q.includes("cabin")) filters.type = "CABIN";
  const budgetMatch = q.match(/(?:under|below|less than|max|maximum)\s*\$?(\d+)/);
  if (budgetMatch) filters.maxPrice = Number(budgetMatch[1]);
  const minMatch = q.match(/(?:above|over|more than|min|minimum)\s*\$?(\d+)/);
  if (minMatch) filters.minPrice = Number(minMatch[1]);
  const guestMatch = q.match(/(\d+)\s*(guest|guests|people|person)/);
  if (guestMatch) filters.guests = Number(guestMatch[1]);
  const amenities = ["wifi", "parking", "pool", "kitchen", "tv", "ac", "breakfast"];
  filters.amenities = amenities.filter((a) => q.includes(a));
  return filters;
}

export async function aiExtractSearchFilters(query: string) {
  const model = getModel(0);
  const fallback = parseFallbackListingQuery(query);
  if (!model) return { filters: fallback, aiUsed: false };

  try {
    const response = await model.invoke([
      new SystemMessage(`Extract Airbnb listing filters from the user query. Return only valid JSON with optional keys: location string, type one of APARTMENT HOUSE VILLA CABIN, minPrice number, maxPrice number, guests number, amenities string array, keyword string. No markdown.`),
      new HumanMessage(query)
    ]);
    const raw = String(response.content).replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    return { filters: { ...fallback, ...parsed }, aiUsed: true };
  } catch {
    return { filters: fallback, aiUsed: false };
  }
}

export async function generateDescription(input: { title?: string; location?: string; type?: string; amenities?: string[]; tone?: string; }) {
  const model = getModel(0.7);
  const tone = input.tone || "professional";
  if (!model) {
    return `Enjoy a ${tone} stay at ${input.title || "this beautiful property"} in ${input.location || "a great location"}. This ${input.type || "listing"} offers ${input.amenities?.join(", ") || "comfort and convenience"}, making it a great choice for guests.`;
  }
  const response = await model.invoke([
    new SystemMessage("You write short, attractive Airbnb listing descriptions. Keep it 80-120 words."),
    new HumanMessage(`Write a ${tone} listing description for: title=${input.title}, type=${input.type}, location=${input.location}, amenities=${input.amenities?.join(", ")}.`)
  ]);
  return String(response.content);
}

export async function supportChat(sessionId: string, message: string, listingContext?: any) {
  const model = getModel(0.4);
  const history = sessions.get(sessionId) || [];
  const system = new SystemMessage(`You are a helpful Airbnb API guest support chatbot. Answer politely and clearly. Use listing context when provided. Listing context: ${listingContext ? JSON.stringify(listingContext) : "none"}`);
  if (!model) {
    const reply = `Thanks for your question. ${listingContext ? `For ${listingContext.title}, the price is ${listingContext.pricePerNight} per night and it is located in ${listingContext.location}.` : "Please provide a listing ID or more details so I can help you better."}`;
    sessions.set(sessionId, [...history, new HumanMessage(message), new AIMessage(reply)].slice(-12));
    return { reply, aiUsed: false };
  }
  const messages = [system, ...history.slice(-10), new HumanMessage(message)];
  const response = await model.invoke(messages);
  const reply = String(response.content);
  sessions.set(sessionId, [...history, new HumanMessage(message), new AIMessage(reply)].slice(-12));
  return { reply, aiUsed: true };
}

export async function explainRecommendations(preferences: any, listings: Listing[]) {
  const model = getModel(0.4);
  if (!model) {
    return "Recommendations are ranked by matching location, budget, guest capacity, amenities, rating, and price value.";
  }
  const response = await model.invoke([
    new SystemMessage("Explain Airbnb listing recommendations in 3 short bullets."),
    new HumanMessage(`User preferences: ${JSON.stringify(preferences)}. Recommended listings: ${JSON.stringify(listings.map((l) => ({ id: l.id, title: l.title, location: l.location, pricePerNight: l.pricePerNight, guests: l.guests, type: l.type, amenities: l.amenities, rating: l.rating })))}.`)
  ]);
  return String(response.content);
}

export async function summarizeReviews(listing: any, reviews: (Review & { user?: { name: string } })[]) {
  const model = getModel(0.3);
  if (reviews.length === 0) return "No reviews are available yet for this listing.";
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  if (!model) {
    return `This listing has ${reviews.length} review(s) with an average rating of ${avg.toFixed(1)}/5. Guests mention: ${reviews.slice(0, 5).map((r) => r.comment).join(" | ")}`;
  }
  const response = await model.invoke([
    new SystemMessage("Summarize Airbnb listing reviews. Include overall sentiment, strengths, weaknesses, and average rating. Keep under 120 words."),
    new HumanMessage(`Listing: ${listing.title}, ${listing.location}. Average rating: ${avg.toFixed(1)}. Reviews: ${reviews.map((r) => `${r.rating}/5: ${r.comment}`).join("\n")}`)
  ]);
  return String(response.content);
}
