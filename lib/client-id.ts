/* stable per-browser identity used by comments and the typing race */
export function getClientId(): string {
  let id = localStorage.getItem("typing-client-id");
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem("typing-client-id", id);
  }
  return id;
}
