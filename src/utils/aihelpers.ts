export function parseAIJson(text: string) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI JSON PARSE ERROR:", text);
    return null;
  }
}

export function handleAIError(error: any) {
  const message = error?.message || "";

  if (message.includes("429")) {
    return {
      status: 429,
      body: { message: "AI service is busy, please try again in a moment" },
    };
  }

  if (message.includes("401")) {
    return {
      status: 500,
      body: { message: "AI service configuration error" },
    };
  }

  return {
    status: 500,
    body: { message: "AI request failed", error: message },
  };
}