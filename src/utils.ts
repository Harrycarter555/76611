// ===== ID GENERATORS =====
export function generateId(prefix: string = "id") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ===== TIME =====
export function now() {
  return Date.now();
}

// ===== BASIC VALIDATION =====
export function isEmpty(value: string) {
  return !value || value.trim() === "";
}

// ===== ADMIN GUARD (UI level) =====
export function ensureAdmin(user: any) {
  if (!user || user.role !== "ADMIN") {
    throw new Error("ADMIN_ONLY");
  }
}
