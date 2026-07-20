import { business } from "@/lib/business";
import { getAvailability } from "@/lib/availability";
import {
  renderAgentMarkdown,
  AGENT_MD_CACHE_TTL_MINUTES,
} from "@/lib/agent-md";

export const dynamic = "force-dynamic"; // availability must be fresh per request
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const availability = getAvailability(business, { horizonDays: 14 });
  const body = renderAgentMarkdown(business, availability);

  const maxAge = AGENT_MD_CACHE_TTL_MINUTES * 60;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=300`,
      "X-Robots-Tag": "noindex",
    },
  });
}
