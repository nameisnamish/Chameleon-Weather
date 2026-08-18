import { readStorage, writeStorage } from "../../../shared/utils/storage.js";

const USERS_KEY = "chameleon_users";
const SESSION_KEY = "chameleon_session";
const emailOf = (email) => email.trim().toLowerCase();

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const getSessionUser = () => readStorage(SESSION_KEY, null);
export const signOut = () => localStorage.removeItem(SESSION_KEY);

export async function signUp({ fullName, email, password, confirmPassword }) {
  if (!fullName.trim()) return { ok: false, message: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, message: "Use at least 8 characters for your password." };
  if (password !== confirmPassword) return { ok: false, message: "Passwords do not match." };
  const users = readStorage(USERS_KEY, []);
  const normalizedEmail = emailOf(email);
  if (users.some((user) => user.email === normalizedEmail)) return { ok: false, message: "An account with this email already exists." };
  const user = { id: crypto.randomUUID(), fullName: fullName.trim(), email: normalizedEmail, passwordHash: await hashPassword(password) };
  writeStorage(USERS_KEY, [...users, user]);
  writeStorage(SESSION_KEY, { id: user.id, fullName: user.fullName, email: user.email });
  return { ok: true, user: getSessionUser() };
}

export async function signIn({ email, password }) {
  const user = readStorage(USERS_KEY, []).find((item) => item.email === emailOf(email));
  if (!user || user.passwordHash !== await hashPassword(password)) return { ok: false, message: "Email or password is incorrect." };
  const sessionUser = { id: user.id, fullName: user.fullName, email: user.email };
  writeStorage(SESSION_KEY, sessionUser);
  return { ok: true, user: sessionUser };
}
