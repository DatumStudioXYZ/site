interface Env {
  SUBMISSIONS: KVNamespace;
  TURNSTILE_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
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
      return Response.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "Invalid email" }, { status: 400 });
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
      return Response.json({ ok: false, error: "Verification failed" }, { status: 403 });
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

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
};
