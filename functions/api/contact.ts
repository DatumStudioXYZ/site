interface Env {
  SUBMISSIONS: KVNamespace;
  TURNSTILE_SECRET: string;
  TURNSTILE_HOSTNAMES?: string;
}

const MAX_REQUEST_BODY_BYTES = 32_000;
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 10_000;
const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;
const SUBMISSION_TTL_SECONDS = 7_776_000;
const TURNSTILE_TIMEOUT_MS = 10_000;

type ContactResponse = { ok: boolean; error?: string; submissionId?: string };
type TurnstileResult = { success: boolean; action?: string; hostname?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const expectedHostnames = (value: string | undefined) => new Set(
  (value ?? "").split(",").map((hostname) => hostname.trim().toLowerCase()).filter(Boolean),
);

const formText = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : null;
};

const validationError = (value: string | null, field: string, limit: number) => {
  if (!value) return `Please enter your ${field}.`;
  if (value.length > limit) return `Your ${field} must be ${limit.toLocaleString()} characters or fewer.`;
  return null;
};

const isTurnstileResult = (value: unknown): value is TurnstileResult =>
  typeof value === "object" && value !== null && typeof (value as { success?: unknown }).success === "boolean";

const htmlError = (message: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unable to send message — Datum Studio</title></head>
<body><main><h1>We could not send your message.</h1><p>${message}</p><p><a href="/#contact">Return to the contact form</a></p></main></body></html>`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const wantsJson = context.request.headers.get("Accept")?.includes("application/json") ?? false;
  const respond = (body: ContactResponse, status = 200) => {
    if (wantsJson) return Response.json(body, { status });
    if (status >= 200 && status < 300) return Response.redirect(new URL("/thank-you/", context.request.url), 303);
    return new Response(htmlError(body.error ?? "Please try again later."), {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  };

  const contentLength = Number(context.request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return respond({ ok: false, error: "That message is too large. Please keep it to 10,000 characters or fewer." }, 413);
  }

  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return respond({ ok: false, error: "We could not read that submission. Please try again." }, 400);
  }

  if (formText(formData, "website")) return respond({ ok: true });

  const name = formText(formData, "name");
  const email = formText(formData, "email");
  const message = formText(formData, "message");
  const turnstileToken = formText(formData, "cf-turnstile-response");
  const fieldError = validationError(name, "name", MAX_NAME_LENGTH)
    ?? validationError(email, "email address", MAX_EMAIL_LENGTH)
    ?? validationError(message, "message", MAX_MESSAGE_LENGTH);
  if (fieldError || !name || !email || !message) return respond({ ok: false, error: fieldError ?? "Please complete the required fields." }, 400);
  if (!emailPattern.test(email)) return respond({ ok: false, error: "Please enter a valid email address." }, 400);
  if (!turnstileToken || turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return respond({ ok: false, error: "Please complete the verification challenge and try again." }, 400);
  }

  const hostnames = expectedHostnames(context.env.TURNSTILE_HOSTNAMES);
  if (!context.env.TURNSTILE_SECRET || hostnames.size === 0) {
    console.error("Contact form configuration failure", { category: "turnstile-configuration" });
    return respond({ ok: false, error: "Message verification is temporarily unavailable. Please try again later." }, 503);
  }

  let verification: TurnstileResult;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);
    const verificationResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET,
        response: turnstileToken,
        remoteip: context.request.headers.get("CF-Connecting-IP") ?? "",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    const result: unknown = await verificationResponse.json();
    if (!verificationResponse.ok || !isTurnstileResult(result)) throw new Error("Invalid Turnstile response");
    verification = result;
  } catch {
    console.error("Contact form verification failure", { category: "turnstile-unavailable" });
    return respond({ ok: false, error: "Message verification is temporarily unavailable. Please try again shortly." }, 503);
  }

  if (!verification.success || verification.action !== "contact" || !verification.hostname || !hostnames.has(verification.hostname.toLowerCase())) {
    return respond({ ok: false, error: "Verification failed. Please complete the fresh challenge and try again." }, 403);
  }

  const submissionId = crypto.randomUUID();
  try {
    await context.env.SUBMISSIONS.put(
      `submission:${submissionId}`,
      JSON.stringify({ name, email: email.toLowerCase(), message, timestamp: new Date().toISOString(), submissionId }),
      { expirationTtl: SUBMISSION_TTL_SECONDS },
    );
  } catch {
    console.error("Contact form storage failure", { category: "submission-storage", submissionId });
    return respond({ ok: false, error: "We could not save your message. Please try again later." }, 503);
  }

  console.info("Contact submission accepted", { category: "submission-stored", submissionId });
  return respond({ ok: true, submissionId });
};
