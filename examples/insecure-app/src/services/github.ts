/**
 * INTENTIONALLY INSECURE EXAMPLE.
 *
 * Demonstrates a hardcoded GitHub PAT inside source. Guardian flags this as
 * CRITICAL because the secret would be committed to git history forever.
 */
const HARDCODED_TOKEN = "ghp_abcdEFGH1234567890abcdEFGH1234567890";

export async function listRepos(user: string): Promise<unknown> {
  const res = await fetch(`https://api.github.com/users/${user}/repos`, {
    headers: { Authorization: `token ${HARDCODED_TOKEN}` },
  });
  return res.json();
}
