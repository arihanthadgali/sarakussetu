import { setFetcher } from '@/api/client';

type Reply = { status: number; body?: unknown } | Error;

/** Queue of fake responses consumed in order; records every request made. */
export function mockFetch(...replies: Reply[]) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const queue = [...replies];
  setFetcher((async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const reply = queue.shift();
    if (!reply) throw new Error('mockFetch: no reply queued');
    if (reply instanceof Error) throw reply;
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch);
  return calls;
}
