interface Env {
  SUBMISSIONS: KVNamespace;
  TURNSTILE_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const wantsJson = context.request.headers.get("Accept")?.includes("application/json") ?? false;
  const response = (body: Record<string, unknown>, status = 200) =>
    wantsJson
      ? Response.json(body, { status })
      : Response.redirect(new URL("/thank-you/", context.request.url), status === 200 ? 303 : 400);

  try {
    const formData = await context.request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const turnstileToken = formData.get("cf-turnstile-response") as string;
    const honeypot = formData.get("website") as string;

    if (honeypot) {
      return Response.json({ ok: true });
    }

    if (!name || !email || !message) {
      return response({ ok: false, error: "Please complete the required fields." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response({ ok: false, error: "Please enter a valid email address." }, 400);
    }

    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: context.env.TURNSTILE_SECRET,
        response: turnstileToken,
        remoteip: context.request.headers.get("CF-Connecting-IP"),
      }),
    });

    const turnstileResult = (await turnstileRes.json()) as { success: boolean };
    if (!turnstileResult.success) {
      return response({ ok: false, error: "Verification failed. Please try again." }, 403);
    }

    const key = `submission:${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    await context.env.SUBMISSIONS.put(
      key,
      JSON.stringify({
        name,
        email,
        message,
        timestamp: new Date().toISOString(),
        ip: context.request.headers.get("CF-Connecting-IP"),
        userAgent: context.request.headers.get("User-Agent"),
      }),
      { expirationTtl: 7776000 },
    );

    return response({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return response({ ok: false, error: "Internal server error" }, 500);
  }
};
