import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      service: 'https://datumstudio.xyz',
      handle: 'datumstudio.xyz',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
