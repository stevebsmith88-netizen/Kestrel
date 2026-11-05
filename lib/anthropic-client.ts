import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// One place to make the Claude client, for the ad builder and the found listings reader.
// An Anthropic key made inside a workspace needs nothing else. A key that is not tied to a workspace is refused unless
// each request names the workspace, so ANTHROPIC_WORKSPACE_ID (the workspace's ID, from the Anthropic console) is sent
// when it is set.
export function claudeClient(key: string, options: { timeout?: number; maxRetries?: number } = {}) {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic({ apiKey: key, ...options, ...(workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {}) });
}
