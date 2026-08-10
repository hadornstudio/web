// Builds a /login URL that returns the user to the exact page (path + query) they were
// on — used by any "like"/"save" action gated behind auth so the flow doesn't just
// silently fail for a logged-out visitor.
export function buildLoginRedirect(location) {
  const target = `${location.pathname}${location.search}`;
  return `/login?redirect=${encodeURIComponent(target)}`;
}
