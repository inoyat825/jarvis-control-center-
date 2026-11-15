 const ALLOWED_ORIGIN = "https://inoyat825.github.io";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    const headers = {
      "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN
        ? ALLOWED_ORIGIN
        : "null",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method === "GET") {
      return Response.json({
        status: "online",
        name: "JARVIS 2.0 Backend"
      }, { headers });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers }
      );
    }

    if (origin !== ALLOWED_ORIGIN) {
      return Response.json(
        { error: "Origin not allowed" },
        { status: 403, headers }
      );
    }

    try {
      const data = await request.json();
      const message = data.message;

      if (!message || typeof message !== "string") {
        return Response.json(
          { error: "Message is required" },
          { status: 400, headers }
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            instructions:
              "Ты JARVIS 2.0 — интеллектуальный помощник. " +
              "Отвечай на русском языке, понятно и полезно. " +
              "Не утверждай, что выполнил действия, если не выполнил их.",
            input: message
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return Response.json(
          { error: "AI service error" },
          { status: 502, headers }
        );
      }

      const answer = result.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("\n") || "Не удалось получить ответ.";

      return Response.json({ answer }, { headers });

    } catch (error) {
      return Response.json(
        { error: "Backend error" },
        { status: 500, headers }
      );
    }
  }
};
