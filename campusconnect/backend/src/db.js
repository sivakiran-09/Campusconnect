// In-memory "collections" store, seeded on boot with the same demo campus as the frontend
// (frontend/src/lib/seed.js). Swapping this file's get/set calls for real MongoDB/Mongoose
// calls is the whole migration path — no route or service code needs to change shape,
// since every function here returns plain JSON-serialisable objects keyed by id.
import { randomUUID } from "node:crypto";

const now = () => Date.now();
const ago = (h) => now() - h * 3600e3;
const inDays = (d) => now() + d * 86400e3;
export const uid = (p = "id") => `${p}_${randomUUID().slice(0, 8)}`;

const stats = (o) => ({ verified: true, cancellations: 0, requests: 0, successful: 0, onTimeReturns: 0, returnsTotal: 0, conditionAvg: 0, ratingAvg: 0, ratingCount: 0, ...o });

function seedUsers() {
  const U = {
    u_me: { id: "u_me", name: "Rahul Sharma", handle: "rahul.s", email: "rahul.s@campus.edu", branch: "CSE", batch: "CSE '26", sem: 5, role: "Student", hue: 250, online: true, bio: "3rd-year CSE. Lending books, learning guitar. Python & ML tutor.", teach: ["Python", "Machine Learning"], want: ["Guitar basics", "Figma"], stats: stats({ successful: 18, onTimeReturns: 16, returnsTotal: 18, conditionAvg: 0.92, ratingAvg: 4.8, ratingCount: 18, cancellations: 1, requests: 19 }) },
    u_priya: { id: "u_priya", name: "Priya Nair", handle: "priya.n", email: "priya.n@campus.edu", branch: "CSE", batch: "CSE '25", sem: 7, role: "Verified Senior", hue: 330, online: true, bio: "Final-year CSE. GATE prep, OS and DBMS notes.", teach: ["GATE prep", "Operating Systems"], want: ["Photography"], stats: stats({ successful: 31, onTimeReturns: 30, returnsTotal: 31, conditionAvg: 0.97, ratingAvg: 4.9, ratingCount: 28, requests: 31 }) },
    u_karthik: { id: "u_karthik", name: "Karthik Reddy", handle: "karthik.r", email: "karthik.r@campus.edu", branch: "CSE", batch: "CSE '26", sem: 6, role: "Student", hue: 28, online: false, bio: "Hackathon regular. Hardware + backend.", teach: ["Arduino", "Node.js"], want: ["UI/UX"], stats: stats({ successful: 12, onTimeReturns: 11, returnsTotal: 12, conditionAvg: 0.93, ratingAvg: 4.7, ratingCount: 11, cancellations: 1, requests: 13 }) },
    u_ananya: { id: "u_ananya", name: "Ananya Iyer", handle: "ananya.i", email: "ananya.i@campus.edu", branch: "ECE", batch: "ECE '26", sem: 5, role: "Student", hue: 290, online: true, bio: "Guitar, indie music, ECE.", teach: ["Guitar basics", "Music theory"], want: ["Python"], stats: stats({ successful: 14, onTimeReturns: 14, returnsTotal: 14, conditionAvg: 0.94, ratingAvg: 4.8, ratingCount: 13, requests: 14 }) },
    u_vikram: { id: "u_vikram", name: "Vikram Das", handle: "vikram.d", email: "vikram.d@campus.edu", branch: "CSE", batch: "CSE '25", sem: 8, role: "Verified Senior", hue: 205, online: false, bio: "Placed at a product company. Mock interviews & resume reviews.", teach: ["Mock interviews", "Resume review", "AWS"], want: ["Guitar basics"], stats: stats({ successful: 27, onTimeReturns: 26, returnsTotal: 27, conditionAvg: 0.96, ratingAvg: 4.9, ratingCount: 24, requests: 27 }) },
    u_marcus: { id: "u_marcus", name: "Marcus Kurian", handle: "marcus.k", email: "marcus.k@campus.edu", branch: "CSE", batch: "CSE '24", sem: 8, role: "Senior TA Alumni", hue: 140, online: false, bio: "Teaching assistant for Data Structures. Alumni mentor.", teach: ["Data Structures", "System design"], want: ["Figma"], stats: stats({ successful: 40, onTimeReturns: 39, returnsTotal: 40, conditionAvg: 0.98, ratingAvg: 4.95, ratingCount: 38, requests: 40 }) },
  };
  return U;
}

function seedResources(u) {
  const R = (o) => ({ status: "available", likes: 0, comments: [], deposit: 0, maxDays: 14, images: [], createdAt: now(), ...o });
  return [
    R({ id: "r_dbms", title: "Database System Concepts", subtitle: "Silberschatz, Korth & Sudarshan · 7th Edition", mode: "LEND", price: 20, category: "books", subject: "DBMS", code: "CS 305", sem: 4, branch: "CSE", condition: "Good", desc: "Clean copy with light pencil notes on normalization chapters.", ownerId: "u_karthik", distanceM: 300, pickup: "lib", maxDays: 14, tags: ["dbms", "sql"], likes: 37, art: { kind: "book", hue: 232, label: "DBMS" } }),
    R({ id: "r_ds", title: "Data Structures & Algorithm Analysis in C++", subtitle: "Mark Allen Weiss · 4th Edition", mode: "LEND", price: 30, category: "books", subject: "Data Structures", code: "CS 201", sem: 3, branch: "CSE", condition: "Excellent", desc: "Barely used. No highlights.", ownerId: "u_me", distanceM: 0, pickup: "lib", maxDays: 21, tags: ["dsa"], likes: 52, art: { kind: "book", hue: 262, label: "DSA" } }),
    R({ id: "r_casio_lend", title: "Casio fx-991ES Plus", subtitle: "Scientific calculator · slide cover + spare battery", mode: "LEND", price: 15, category: "tech", subject: "Engineering Mathematics", code: "MA 101", sem: 1, branch: "ALL", condition: "Excellent", desc: "Allowed in all internal exams.", ownerId: "u_priya", distanceM: 1200, pickup: "lib", maxDays: 10, deposit: 200, tags: ["calculator"], likes: 44, art: { kind: "calc", hue: 210, label: "fx-991" } }),
    R({ id: "r_guitar", title: "Yamaha F310 acoustic guitar", subtitle: "Comes with capo, picks & gig bag", mode: "LEND", price: 150, category: "music", subject: "Music", code: "", sem: null, branch: "ALL", condition: "Good", desc: "Perfect for beginners. Fresh strings.", ownerId: "u_ananya", distanceM: 450, pickup: "union", maxDays: 21, deposit: 800, tags: ["guitar"], likes: 72, art: { kind: "guitar", hue: 30, label: "F310" } }),
    R({ id: "r_labcoat", title: "Chemistry lab coat + safety goggles", subtitle: "Size M · washed and ironed", mode: "DONATE", price: 0, category: "lab", subject: "Chemistry Lab", code: "CH 101", sem: 1, branch: "ALL", condition: "Good", desc: "Passing it down to a first-year.", ownerId: "u_priya", distanceM: 600, pickup: "hostel", tags: ["lab"], likes: 61, art: { kind: "coat", hue: 158, label: "Lab kit" } }),
  ];
  void u;
}

function seedKnowledge() {
  return [
    { id: "k_tcs", authorId: "u_vikram", type: "Interview", title: "TCS Digital: my 3-round experience (offer in hand)", tags: ["tcs", "placement", "sql", "oops"], likes: 214, comments: 31, saves: 98, helpful: 128, createdAt: ago(30), company: "TCS Digital", body: "Round 1 was an online test of 90 minutes: aptitude plus two coding questions.\n\nRound 2 was technical. They asked about OOP, DBMS normalization up to BCNF, and one SQL query using GROUP BY with HAVING.\n\nRound 3 was managerial and HR. Know your project end to end, practise SQL joins." },
    { id: "k_dbms", authorId: "u_ananya", type: "Notes", title: "DBMS quick notes: normalization, transactions and ACID", tags: ["dbms", "notes", "normalization", "acid", "sql"], likes: 176, comments: 12, saves: 201, helpful: 110, createdAt: ago(300), company: "", body: "1NF: atomic values only. 2NF: 1NF plus no partial dependency. 3NF: 2NF plus no transitive dependency. BCNF: every determinant must be a candidate key.\n\nACID stands for atomicity, consistency, isolation and durability." },
    { id: "k_amz", authorId: "u_marcus", type: "Interview", title: "Amazon SDE intern online assessment: what I was asked", tags: ["amazon", "oa", "coding", "graphs"], likes: 205, comments: 40, saves: 189, helpful: 120, createdAt: ago(520), company: "Amazon", body: "The online assessment had two coding problems in 90 minutes: a sliding window problem and a graph traversal on a grid.\n\nThe interview round covered complexity analysis and leadership principles such as ownership and customer obsession." },
  ];
}

function seedSkills() {
  return [
    { id: "s_vikram", userId: "u_vikram", cat: "Placement prep", title: "Mock interviews & resume review", desc: "45 minute mock technical round with feedback.", swapFor: "Guitar basics", credits: 8, minutes: 45, mentor: { label: "Resume review + LinkedIn tune-up", minutes: 30 }, tag: "Verified Senior", sessions: 61 },
    { id: "s_ananya", userId: "u_ananya", cat: "Music", title: "Guitar basics: chords, strumming & first song", desc: "Four one-hour lessons to play your first song.", swapFor: "Python basics", credits: 10, minutes: 60, mentor: null, tag: "Peer tutor", sessions: 23 },
  ];
}

const db = {
  users: seedUsers(),
  resources: seedResources(),
  transactions: [],
  wishlist: {},
  knowledge: seedKnowledge(),
  skills: seedSkills(),
  sessions: [],
  chats: {
    ai: { id: "ai", type: "ai", title: "Campus AI", messages: [] },
    g_cse3: { id: "g_cse3", type: "group", title: "CSE 3rd Year · Resource Circle", members: ["u_me", "u_karthik", "u_priya"], memberCount: 42, messages: [] },
  },
  notifications: {},
  credits: {},
  otps: new Map(), // email -> { code, expiresAt }
  sessionsByToken: new Map(), // token -> email
};

for (const uidKey of Object.keys(db.users)) {
  db.wishlist[uidKey] = [];
  db.notifications[uidKey] = [];
  db.credits[uidKey] = { balance: 60, ledger: [{ id: uid("l"), delta: 60, note: "Welcome bonus", at: ago(200) }] };
}
db.credits.u_me = { balance: 120, ledger: [{ id: "l1", delta: 10, note: "Taught Python basics to Sneha", at: ago(26) }, { id: "l5", delta: 60, note: "Welcome bonus", at: ago(2000) }] };

export const IMPACT_CAMPUS = { shared: 2450, reused: 1830, knowledge: 3650, interviews: 420, skillExchanges: 870, savings: 1240000, hours: 1850 };

export default db;
