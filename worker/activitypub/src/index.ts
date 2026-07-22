import { createFederationBuilder } from "@fedify/fedify";
import { WorkersKvStore } from "@fedify/cfworkers";
import { Person } from "@fedify/vocab";

interface Env {
  ACTORS: KVNamespace;
  DATUM_SHARED_SECRET: string;
  SITE_URL: string;
}

const builder = createFederationBuilder<Env>();

builder
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    if (identifier !== "gavin") return null;

    return new Person({
      id: ctx.getActorUri(identifier),
      preferredUsername: identifier,
      name: "Gavin",
      summary: "Building Datum — thoughtful design for everyday life",
      url: new URL("/", ctx.url),
      inbox: ctx.getInboxUri(identifier),
      outbox: new URL("/users/gavin/outbox", ctx.url),
      followers: new URL("/users/gavin/followers", ctx.url),
      following: new URL("/users/gavin/following", ctx.url),
      publicKeys: (await ctx.getActorKeyPairs(identifier)).map(
        (kp) => kp.cryptographicKey,
      ),
    });
  })
  .setKeyPairsDispatcher(async (ctx, identifier) => {
    if (identifier !== "gavin") return [];

    const kv = ctx.data.ACTORS;
    const stored = await kv.get<{ privateKey: JsonWebKey; publicKey: JsonWebKey }>(
      "gavin:keys",
    );

    if (stored != null) {
      const { importJwk } = await import("@fedify/fedify");
      return [
        {
          privateKey: await importJwk(stored.privateKey, "private"),
          publicKey: await importJwk(stored.publicKey, "public"),
        },
      ];
    }

    const { generateCryptoKeyPair, exportJwk } = await import("@fedify/fedify");
    const keys = await generateCryptoKeyPair("RSASSA-PKCS1-v1_5");
    await kv.put(
      "gavin:keys",
      JSON.stringify({
        privateKey: await exportJwk(keys.privateKey),
        publicKey: await exportJwk(keys.publicKey),
      }),
    );

    return [keys];
  });

builder.setInboxListeners("/users/{identifier}/inbox", "/inbox");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Datum Studio",
          url: "https://datumstudio.xyz",
          activitypub: "https://datumstudio.xyz/users/gavin",
          webfinger:
            "https://datumstudio.xyz/.well-known/webfinger?resource=acct:gavin@datumstudio.xyz",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const federation = await builder.build({
      kv: new WorkersKvStore(env.ACTORS),
    });

    return federation.fetch(request, { contextData: env });
  },
} satisfies ExportedHandler<Env>;
