// Demo campus. In API mode the backend seed (backend/src/seed.js) mirrors this data,
// so both modes show the same people, listings and numbers.
import { ago, inDays } from "./format.js";

export const CAMPUS = { name: "Campus University", domain: "campus.edu", term: "Fall '26", activeNow: 142 };

export const CATEGORIES = [
  { id: "books", label: "Textbooks", icon: "book" },
  { id: "lab", label: "Lab gear", icon: "flask" },
  { id: "tech", label: "Tech & calcs", icon: "cpu" },
  { id: "cycles", label: "Cycles", icon: "bike" },
  { id: "music", label: "Instruments", icon: "music" },
  { id: "notes", label: "Notes", icon: "notes" },
];

export const SAFE_ZONES = [
  { id: "lib", name: "Central Library", spot: "Safe Desk #2", staff: true, open: "Open till 9 pm", load: "Quiet" },
  { id: "union", name: "Student Union", spot: "Help Desk", staff: true, open: "Open till 7 pm", load: "Busy" },
  { id: "canteen", name: "Canteen Entrance", spot: "CCTV Bench", staff: false, open: "Open till 8 pm", load: "Moderate" },
  { id: "hostel", name: "Hostel Block A", spot: "Warden Gate", staff: true, open: "24 hours", load: "Quiet" },
  { id: "gate", name: "Main Gate", spot: "Security Kiosk", staff: true, open: "24 hours", load: "Moderate" },
];

const stats = (o) => ({ verified: true, cancellations: 0, ...o });

export const USERS = {
  u_me: { id: "u_me", name: "Rahul Sharma", handle: "rahul.s", email: "rahul.s@campus.edu", branch: "CSE", batch: "CSE '26", sem: 5, role: "Student", hue: 250, online: true, bio: "3rd-year CSE. Lending books, learning guitar. Python & ML tutor.", teach: ["Python", "Machine Learning"], want: ["Guitar basics", "Figma"], stats: stats({ successful: 18, onTimeReturns: 16, returnsTotal: 18, conditionAvg: 0.92, ratingAvg: 4.8, ratingCount: 18, cancellations: 1, requests: 19 }) },
  u_priya: { id: "u_priya", name: "Priya Nair", handle: "priya.n", email: "priya.n@campus.edu", branch: "CSE", batch: "CSE '25", sem: 7, role: "Verified Senior", hue: 330, online: true, bio: "Final-year CSE. GATE prep, OS and DBMS notes.", teach: ["GATE prep", "Operating Systems"], want: ["Photography"], stats: stats({ successful: 31, onTimeReturns: 30, returnsTotal: 31, conditionAvg: 0.97, ratingAvg: 4.9, ratingCount: 28, requests: 31 }) },
  u_karthik: { id: "u_karthik", name: "Karthik Reddy", handle: "karthik.r", email: "karthik.r@campus.edu", branch: "CSE", batch: "CSE '26", sem: 6, role: "Student", hue: 28, online: false, bio: "Hackathon regular. Hardware + backend.", teach: ["Arduino", "Node.js"], want: ["UI/UX"], stats: stats({ successful: 12, onTimeReturns: 11, returnsTotal: 12, conditionAvg: 0.93, ratingAvg: 4.7, ratingCount: 11, cancellations: 1, requests: 13 }) },
  u_sneha: { id: "u_sneha", name: "Sneha Patil", handle: "sneha.p", email: "sneha.p@campus.edu", branch: "ECE", batch: "ECE '27", sem: 3, role: "Student", hue: 170, online: true, bio: "2nd-year ECE. Sketching, spoken English coach.", teach: ["Spoken English", "Sketching"], want: ["Python"], stats: stats({ successful: 6, onTimeReturns: 6, returnsTotal: 6, conditionAvg: 0.95, ratingAvg: 4.9, ratingCount: 6, requests: 6 }) },
  u_vikram: { id: "u_vikram", name: "Vikram Das", handle: "vikram.d", email: "vikram.d@campus.edu", branch: "CSE", batch: "CSE '25", sem: 8, role: "Verified Senior", hue: 205, online: false, bio: "Placed at a product company. Mock interviews & resume reviews.", teach: ["Mock interviews", "Resume review", "AWS"], want: ["Guitar basics"], stats: stats({ successful: 27, onTimeReturns: 26, returnsTotal: 27, conditionAvg: 0.96, ratingAvg: 4.9, ratingCount: 24, requests: 27 }) },
  u_ananya: { id: "u_ananya", name: "Ananya Iyer", handle: "ananya.i", email: "ananya.i@campus.edu", branch: "ECE", batch: "ECE '26", sem: 5, role: "Student", hue: 290, online: true, bio: "Guitar, indie music, ECE. Wants to learn Python.", teach: ["Guitar basics", "Music theory"], want: ["Python"], stats: stats({ successful: 14, onTimeReturns: 14, returnsTotal: 14, conditionAvg: 0.94, ratingAvg: 4.8, ratingCount: 13, requests: 14 }) },
  u_marcus: { id: "u_marcus", name: "Marcus Kurian", handle: "marcus.k", email: "marcus.k@campus.edu", branch: "CSE", batch: "CSE '24", sem: 8, role: "Senior TA Alumni", hue: 140, online: false, bio: "Teaching assistant for Data Structures. Alumni mentor.", teach: ["Data Structures", "System design"], want: ["Figma"], stats: stats({ successful: 40, onTimeReturns: 39, returnsTotal: 40, conditionAvg: 0.98, ratingAvg: 4.95, ratingCount: 38, requests: 40 }) },
  u_meera: { id: "u_meera", name: "Meera Joshi", handle: "meera.j", email: "meera.j@campus.edu", branch: "CHEM", batch: "Chem '25", sem: 8, role: "Verified Senior", hue: 95, online: false, bio: "Chemical engineering. Passing down lab gear to juniors.", teach: ["Organic chemistry"], want: ["Python"], stats: stats({ successful: 22, onTimeReturns: 22, returnsTotal: 22, conditionAvg: 0.97, ratingAvg: 5, ratingCount: 22, requests: 22 }) },
  u_alex: { id: "u_alex", name: "Alex Thomas", handle: "alex.t", email: "alex.t@campus.edu", branch: "ECE", batch: "ECE '26", sem: 5, role: "Student", hue: 12, online: true, bio: "ECE. Digital design nerd.", teach: ["Digital design", "Verilog"], want: ["Guitar basics"], stats: stats({ successful: 19, onTimeReturns: 19, returnsTotal: 19, conditionAvg: 0.95, ratingAvg: 4.85, ratingCount: 18, requests: 19 }) },
  u_arjun: { id: "u_arjun", name: "Arjun Mehta", handle: "arjun.m", email: "arjun.m@campus.edu", branch: "CSE", batch: "CSE '27", sem: 3, role: "Student", hue: 60, online: false, bio: "2nd-year CSE.", teach: [], want: ["Data Structures"], stats: stats({ successful: 4, onTimeReturns: 4, returnsTotal: 4, conditionAvg: 0.9, ratingAvg: 4.6, ratingCount: 4, requests: 4 }) },
};

// Every listing gets a designed cover (see components/CoverArt) until real photos are uploaded.
const R = (o) => ({ status: "available", likes: 0, comments: [], deposit: 0, maxDays: 14, images: [], ...o });

export const RESOURCES = [
  R({ id: "r_dbms", title: "Database System Concepts", subtitle: "Silberschatz, Korth & Sudarshan · 7th Edition", mode: "LEND", price: 20, category: "books", subject: "DBMS", code: "CS 305", sem: 4, branch: "CSE", condition: "Good", desc: "Clean copy with light pencil notes on normalization chapters. Includes a printed SQL cheat-sheet tucked inside. Perfect for the DBMS unit tests and viva.", ownerId: "u_karthik", distanceM: 300, pickup: "lib", maxDays: 14, tags: ["dbms", "sql", "normalization"], likes: 37, art: { kind: "book", hue: 232, label: "DBMS" }, tag: "Instant Handoff", createdAt: ago(60), comments: [{ id: "c1", userId: "u_sneha", text: "Is the ER diagram chapter highlighted?", at: ago(20) }, { id: "c2", userId: "u_karthik", text: "Only a few lines in pencil, easy to ignore 👍", at: ago(19) }] }),
  R({ id: "r_ds", title: "Data Structures & Algorithm Analysis in C++", subtitle: "Mark Allen Weiss · 4th Edition", mode: "LEND", price: 30, category: "books", subject: "Data Structures", code: "CS 201", sem: 3, branch: "CSE", condition: "Excellent", desc: "Barely used. No highlights. Covers trees, heaps, hashing and graph algorithms with the standard exam problems.", ownerId: "u_me", distanceM: 0, pickup: "lib", maxDays: 21, tags: ["dsa", "trees", "graphs"], likes: 52, art: { kind: "book", hue: 262, label: "DSA" }, photo: "books", tag: "Instant Handoff", createdAt: ago(200) }),
  R({ id: "r_casio_lend", title: "Casio fx-991ES Plus", subtitle: "Scientific calculator · slide cover + spare battery", mode: "LEND", price: 15, category: "tech", subject: "Engineering Mathematics", code: "MA 101", sem: 1, branch: "ALL", condition: "Excellent", desc: "Allowed in all internal exams. Works perfectly, comes with the slide cover and a spare battery. Great for one exam-season week.", ownerId: "u_priya", distanceM: 1200, pickup: "lib", maxDays: 10, deposit: 200, tags: ["calculator", "casio", "exam"], likes: 44, art: { kind: "calc", hue: 210, label: "fx-991" }, tag: "Instant Handoff", createdAt: ago(90) }),
  R({ id: "r_casio_sell", title: "Casio fx-991EX ClassWiz", subtitle: "Scientific calculator · 1 year old", mode: "SELL", price: 800, category: "tech", subject: "Engineering Mathematics", code: "MA 101", sem: 1, branch: "ALL", condition: "Good", desc: "Selling because I graduated. Original box not available, everything else included. Price is capped at 45% of retail.", ownerId: "u_vikram", distanceM: 850, pickup: "union", tags: ["calculator", "casio", "classwiz"], likes: 19, art: { kind: "calc", hue: 24, label: "ClassWiz" }, createdAt: ago(30) }),
  R({ id: "r_labcoat", title: "Chemistry lab coat + safety goggles", subtitle: "Size M · washed and ironed", mode: "DONATE", price: 0, category: "lab", subject: "Chemistry Lab", code: "CH 101", sem: 1, branch: "ALL", condition: "Good", desc: "Passing it down to a first-year. Coat is size M (fits 5'6\" to 5'10\"). Goggles are anti-fog and unscratched.", ownerId: "u_meera", distanceM: 600, pickup: "hostel", tags: ["lab", "safety", "first year"], likes: 61, art: { kind: "coat", hue: 158, label: "Lab kit" }, tag: "Senior Pass-down", createdAt: ago(110) }),
  R({ id: "r_orgchem", title: "Organic Chemistry Molecular Model Kit", subtitle: "240 pieces · carbons, hydrogens & orbitals", mode: "DONATE", price: 0, category: "lab", subject: "Organic Chemistry", code: "CH 203", sem: 3, branch: "CHEM", condition: "Excellent", desc: "Complete 240 piece kit in its case. Every atom and bond is intact. Free to any student who needs it for the semester.", ownerId: "u_meera", distanceM: 600, pickup: "hostel", tags: ["chemistry", "model kit"], likes: 33, art: { kind: "kit", hue: 190, label: "240 pcs" }, tag: "Senior Pass-down", createdAt: ago(75) }),
  R({ id: "r_cycle", title: "Hero Sprint 21-speed cycle", subtitle: "Geared · basket + lock included", mode: "LEND", price: 60, category: "cycles", subject: "Commute", code: "", sem: null, branch: "ALL", condition: "Good", desc: "Serviced last month. Hostel to department in 6 minutes. Lock and basket included. Refundable deposit held via QR handover.", ownerId: "u_vikram", distanceM: 850, pickup: "hostel", maxDays: 30, deposit: 500, tags: ["cycle", "commute"], likes: 28, art: { kind: "bike", hue: 172, label: "21-speed" }, tag: "Instant Handoff", createdAt: ago(150) }),
  R({ id: "r_guitar", title: "Yamaha F310 acoustic guitar", subtitle: "Comes with capo, picks & gig bag", mode: "LEND", price: 150, category: "music", subject: "Music", code: "", sem: null, branch: "ALL", condition: "Good", desc: "Perfect for beginners. Fresh strings put on last week. Pairs well with my beginner chord chart (free with rental).", ownerId: "u_ananya", distanceM: 450, pickup: "union", maxDays: 21, deposit: 800, tags: ["guitar", "yamaha", "beginner"], likes: 72, art: { kind: "guitar", hue: 30, label: "F310" }, tag: "Instant Handoff", createdAt: ago(40) }),
  R({ id: "r_arduino", title: "Arduino Uno R3 starter kit", subtitle: "Board, breadboard, 30+ sensors & jumper wires", mode: "SELL", price: 950, category: "tech", subject: "Embedded Systems", code: "EC 310", sem: 5, branch: "ECE", condition: "Excellent", desc: "Used for one semester project. Everything is in the compartment box. Includes ultrasonic, DHT11, LDR, servo, relay and an LCD.", ownerId: "u_karthik", distanceM: 300, pickup: "lib", tags: ["arduino", "embedded", "iot"], likes: 41, art: { kind: "kit", hue: 178, label: "Arduino" }, createdAt: ago(48) }),
  R({ id: "r_mano", title: "Digital Logic Design", subtitle: "M. Morris Mano · 5th Edition", mode: "LEND", price: 15, category: "books", subject: "Digital Logic", code: "EC 202", sem: 3, branch: "ECE", condition: "Good", desc: "Solutions to odd problems printed and stapled at the back. Handy for K-maps and sequential circuits.", ownerId: "u_alex", distanceM: 700, pickup: "union", tags: ["digital", "logic"], likes: 15, art: { kind: "book", hue: 14, label: "Logic" }, createdAt: ago(220) }),
  R({ id: "r_kreyszig", title: "Advanced Engineering Mathematics", subtitle: "Erwin Kreyszig · 10th Edition", mode: "LEND", price: 20, category: "books", subject: "Engineering Mathematics", code: "MA 201", sem: 3, branch: "ALL", condition: "Good", desc: "Chapters on Laplace and Fourier highlighted in yellow. Slightly worn cover but binding is strong.", ownerId: "u_me", distanceM: 0, pickup: "lib", tags: ["mathematics", "laplace", "fourier"], likes: 23, art: { kind: "book", hue: 120, label: "Maths" }, createdAt: ago(260) }),
  R({ id: "r_python", title: "Python Crash Course", subtitle: "Eric Matthes · 3rd Edition", mode: "LEND", price: 15, category: "books", subject: "Python", code: "CS 110", sem: 2, branch: "ALL", condition: "Excellent", desc: "Almost new. Great first book for programming labs and the ML electives.", ownerId: "u_me", distanceM: 0, pickup: "lib", tags: ["python", "beginner"], likes: 30, art: { kind: "book", hue: 200, label: "Python" }, createdAt: ago(300) }),
  R({ id: "r_drafter", title: "Engineering drawing kit", subtitle: "Mini drafter, set squares, compass & scale", mode: "LEND", price: 10, category: "lab", subject: "Engineering Drawing", code: "ME 101", sem: 1, branch: "ALL", condition: "Good", desc: "Everything a first-year needs for drawing sheets. Compass is tight and accurate.", ownerId: "u_sneha", distanceM: 520, pickup: "canteen", tags: ["drawing", "first year"], likes: 18, art: { kind: "drafter", hue: 44, label: "Drafting" }, createdAt: ago(130) }),
  R({ id: "r_pi", title: "Raspberry Pi 4 (4 GB) kit", subtitle: "Case, 32 GB card, power supply, HDMI cable", mode: "LEND", price: 120, category: "tech", subject: "Embedded Systems", code: "CS 412", sem: 7, branch: "CSE", condition: "Excellent", desc: "Flashed with Raspberry Pi OS. Good for IoT and computer-vision mini projects.", ownerId: "u_marcus", distanceM: 1900, pickup: "gate", maxDays: 28, deposit: 1000, tags: ["raspberry pi", "iot", "project"], likes: 47, art: { kind: "pi", hue: 340, label: "Pi 4" }, createdAt: ago(100) }),
  R({ id: "r_notes", title: "Engineering Mathematics II handwritten notes", subtitle: "Scanned PDF + originals · toppers' set", mode: "DONATE", price: 0, category: "notes", subject: "Engineering Mathematics", code: "MA 201", sem: 3, branch: "ALL", condition: "Excellent", desc: "Neat handwritten notes with solved previous-year problems. Free for any junior; pay it forward with your own notes.", ownerId: "u_meera", distanceM: 600, pickup: "lib", tags: ["notes", "mathematics", "pyq"], likes: 88, art: { kind: "notes", hue: 275, label: "Notes" }, tag: "Senior Pass-down", createdAt: ago(320) }),
];

// The listing that goes live during the demo to trigger the wishlist alert (see the store).
export const LIVE_LISTING = R({ id: "r_os", title: "Operating System Concepts", subtitle: "Silberschatz, Galvin & Gagne · 10th Edition", mode: "LEND", price: 25, category: "books", subject: "Operating Systems", code: "CS 303", sem: 4, branch: "CSE", condition: "Excellent", desc: "Practically new 10th edition (Galvin). Ideal for the scheduling and deadlock chapters. Comes with my handwritten summary sheets.", ownerId: "u_priya", distanceM: 2300, pickup: "lib", maxDays: 21, tags: ["os", "galvin", "scheduling"], likes: 0, art: { kind: "book", hue: 300, label: "OS" }, tag: "New", createdAt: Date.now() });

export const TRANSACTIONS = [
  { id: "t_req", resourceId: "r_ds", ownerId: "u_me", borrowerId: "u_sneha", status: "REQUESTED", days: 10, price: 43, deposit: 0, zone: "lib", message: "Hi Rahul! Need this for my sem exam prep. Can I pick it up tomorrow?", createdAt: ago(2), events: [{ at: ago(2), t: "Request sent" }] },
  { id: "t_qr", resourceId: "r_kreyszig", ownerId: "u_me", borrowerId: "u_arjun", status: "ACCEPTED", days: 7, price: 20, deposit: 0, zone: "lib", createdAt: ago(5), acceptedAt: ago(4), precheck: { grade: "Good", note: "Yellow highlights in Laplace + Fourier chapters. Cover corner slightly worn." }, events: [{ at: ago(5), t: "Request sent" }, { at: ago(4), t: "Accepted · pre-check recorded" }] },
  { id: "t_borrow", resourceId: "r_casio_lend", ownerId: "u_priya", borrowerId: "u_me", status: "ACCEPTED", days: 7, price: 15, deposit: 200, zone: "lib", createdAt: ago(8), acceptedAt: ago(6), precheck: { grade: "Excellent", note: "Screen clean, keys crisp. Slide cover and spare battery included." }, events: [{ at: ago(8), t: "Request sent" }, { at: ago(6), t: "Accepted · pre-check recorded" }] },
  { id: "t_active", resourceId: "r_mano", ownerId: "u_alex", borrowerId: "u_me", status: "ACTIVE", days: 7, price: 15, deposit: 0, zone: "union", createdAt: ago(100), startedAt: ago(96), dueAt: inDays(3), precheck: { grade: "Good", note: "Corners rubbed. Odd-problem solutions stapled at the back." }, events: [{ at: ago(100), t: "Request sent" }, { at: ago(98), t: "Accepted · pre-check recorded" }, { at: ago(96), t: "Handover confirmed by QR" }] },
  { id: "t_pending", resourceId: "r_python", ownerId: "u_me", borrowerId: "u_meera", status: "RETURN_PENDING", days: 7, price: 15, deposit: 0, zone: "lib", createdAt: ago(200), startedAt: ago(190), dueAt: ago(20), returnedAt: ago(1), precheck: { grade: "Excellent", note: "Like new. No marks." }, ret: { photo: "returned", match: 96, verdict: "Returned in original condition", diffs: ["No new marks", "Cover intact"] }, events: [{ at: ago(190), t: "Handover confirmed by QR" }, { at: ago(1), t: "Return photo uploaded · AI check 96% match" }] },
  { id: "t_h1", resourceId: "r_pi", ownerId: "u_marcus", borrowerId: "u_me", status: "RETURNED", days: 14, price: 240, deposit: 1000, zone: "gate", createdAt: ago(600), startedAt: ago(590), returnedAt: ago(250), dueAt: ago(250), ret: { match: 98, verdict: "Returned in original condition" }, review: { rating: 5, tags: ["On time", "Great condition"] }, events: [] },
  { id: "t_h2", resourceId: "r_drafter", ownerId: "u_sneha", borrowerId: "u_me", status: "RETURNED", days: 7, price: 10, deposit: 0, zone: "canteen", createdAt: ago(900), startedAt: ago(890), returnedAt: ago(720), dueAt: ago(720), ret: { match: 94, verdict: "Returned in original condition" }, review: { rating: 5, tags: ["Friendly"] }, events: [] },
];

export const KNOWLEDGE = [
  { id: "k_tcs", authorId: "u_vikram", type: "Interview", title: "TCS Digital: my 3-round experience (offer in hand)", tags: ["tcs", "placement", "sql", "oops"], likes: 214, comments: 31, saves: 98, helpful: 128, createdAt: ago(30), company: "TCS Digital",
    body: `Round 1 was an online test of 90 minutes: aptitude plus two coding questions. One was a string manipulation problem and the other an array problem solved with two pointers. Cut-off was roughly one full solution and one partial.\n\nRound 2 was technical. They started with my final-year project and asked me to draw the architecture. Then OOP (overloading vs overriding, abstract classes), DBMS normalization up to BCNF, and one SQL query using GROUP BY with HAVING.\n\nRound 3 was managerial and HR: why TCS, relocation, strengths and weaknesses, and a scenario about handling a team conflict. Tips: know your project end to end, practise SQL joins, structure your answers and be honest when you don't know something. I prepared for six weeks at two hours a day.` },
  { id: "k_zoho", authorId: "u_priya", type: "Placement", title: "How I prepared for Zoho in 8 weeks: C, patterns and logic", tags: ["zoho", "placement", "c programming", "patterns"], likes: 167, comments: 22, saves: 141, helpful: 96, createdAt: ago(70), company: "Zoho",
    body: `Zoho has multiple elimination rounds and the first one tests pure C programming with no libraries. I practised pattern printing, string and array problems, recursion and pointer questions on paper every day.\n\nRound 2 was an advanced programming round where you build a small application such as a parking lot or library system. Focus on clean structure, meaningful function names and handling edge cases rather than fancy syntax.\n\nThe final rounds were technical and HR. They care about problem-solving approach more than memorised answers. Week 1 to 3: C basics and patterns. Week 4 to 6: DSA and small application builds. Week 7 to 8: mocks with friends and timing practice.` },
  { id: "k_intern", authorId: "u_sneha", type: "Internship", title: "Landed a fintech internship through cold emails (template inside)", tags: ["internship", "cold email", "linkedin", "resume"], likes: 143, comments: 18, saves: 120, helpful: 74, createdAt: ago(120), company: "Fintech startup",
    body: `I sent 60 short cold emails over three weeks and got 9 replies and 3 interviews. The email was four lines: who I am, one project link, why their product interests me, and a clear ask for a 15 minute chat or an internship opening.\n\nI found founders and engineers on LinkedIn and small startups on job boards. Apply within the first two days of a posting because responses drop quickly afterwards.\n\nThe interview was a take-home task plus a discussion. Keep your GitHub tidy: pinned repositories with a proper README matter more than a long list of half-finished projects. Ask for a stipend clearly and follow up once after five days.` },
  { id: "k_sih", authorId: "u_karthik", type: "Hackathon", title: "Smart India Hackathon: how our team of six reached the finals", tags: ["hackathon", "sih", "team", "pitch"], likes: 188, comments: 27, saves: 86, helpful: 61, createdAt: ago(200), company: "Smart India Hackathon",
    body: `We picked a problem statement in agriculture supply chains and spent the first week only on user research: calling farmers and mandi agents. That gave us a clear problem before any code.\n\nRoles were split early: two on backend, one on mobile UI, one on ML for price prediction, one on the demo and pitch, and one project manager who kept the timeline. Our stack was Node.js, MongoDB and a simple React Native client.\n\nFor the pitch we showed a 90 second live demo first, then the numbers. Judges asked about scalability and offline use, so prepare answers for both. Sleep matters: we lost 2 hours debugging at 4 am that a fresh mind fixed in minutes.` },
  { id: "k_aws", authorId: "u_vikram", type: "Certification", title: "AWS Cloud Practitioner in 3 weeks with free resources", tags: ["aws", "cloud", "certification"], likes: 121, comments: 14, saves: 133, helpful: 88, createdAt: ago(260), company: "AWS",
    body: `Week 1: learn core services: EC2, S3, IAM, VPC and RDS, and the shared responsibility model. Use the free AWS Skill Builder digital course and take short notes on each service.\n\nWeek 2: pricing, billing and support plans, then the Well-Architected Framework pillars. These come up in many questions.\n\nWeek 3: take two full practice exams and review every wrong answer. The real exam has 65 questions in 90 minutes and the pass mark is 700 out of 1000. Register through the student discount if your college offers one.` },
  { id: "k_dbms", authorId: "u_ananya", type: "Notes", title: "DBMS quick notes: normalization, transactions and ACID", tags: ["dbms", "notes", "normalization", "acid", "sql"], likes: 176, comments: 12, saves: 201, helpful: 110, createdAt: ago(300), company: "",
    body: `1NF: atomic values only. 2NF: 1NF plus no partial dependency on part of a composite key. 3NF: 2NF plus no transitive dependency. BCNF: every determinant must be a candidate key.\n\nACID stands for atomicity, consistency, isolation and durability. Isolation levels from weakest to strongest are read uncommitted, read committed, repeatable read and serializable.\n\nExam favourites: convert an ER diagram to tables, find candidate keys using closure of attributes, and write GROUP BY queries with HAVING. Practise draw-and-prove problems for lossless decomposition.` },
  { id: "k_os", authorId: "u_priya", type: "Notes", title: "Operating Systems: scheduling and deadlock cheat-sheet", tags: ["os", "notes", "scheduling", "deadlock"], likes: 152, comments: 9, saves: 176, helpful: 92, createdAt: ago(350), company: "",
    body: `CPU scheduling: FCFS is simple but suffers from the convoy effect. SJF minimises average waiting time but needs burst prediction. Round robin depends on the time quantum. Priority scheduling can starve low priority processes, solved by aging.\n\nDeadlock needs four conditions together: mutual exclusion, hold and wait, no pre-emption and circular wait. Prevent one of them, or use the Banker's algorithm to avoid unsafe states.\n\nFor numericals, always draw the Gantt chart first and compute turnaround time and waiting time from it.` },
  { id: "k_proj", authorId: "u_marcus", type: "Project", title: "Final-year project: picking a topic, guides and review-panel tips", tags: ["project", "final year", "review", "guide"], likes: 139, comments: 16, saves: 111, helpful: 66, createdAt: ago(400), company: "",
    body: `Choose a problem you can demo end to end within four months. A modest idea that works beats an ambitious one that half works.\n\nMeet your guide in week one with a one-page plan, and send a short weekly update. Guides are far more supportive when they see steady progress.\n\nFor review panels: start with the problem, show a live demo, then the architecture. Keep a slide of limitations and future work. Panels respect honesty. Keep a backup video of the demo in case of network issues.` },
  { id: "k_gate", authorId: "u_priya", type: "Career", title: "GATE CSE prep strategy: 6 months, part-time", tags: ["gate", "career", "higher studies", "strategy"], likes: 132, comments: 24, saves: 150, helpful: 79, createdAt: ago(450), company: "GATE",
    body: `Months 1 and 2: finish the core subjects: data structures, algorithms, DBMS, operating systems and computer networks, using standard textbooks and NPTEL. Months 3 and 4: engineering mathematics and digital logic, plus the first round of previous year questions.\n\nMonths 5 and 6: only mock tests and revision. Analyse every test for silly mistakes and weak topics. Study three hours on weekdays and six on weekends alongside college.\n\nDecide early between GATE and placements. They can be combined, but only if you protect a fixed study slot every day.` },
  { id: "k_amz", authorId: "u_marcus", type: "Interview", title: "Amazon SDE intern online assessment: what I was asked", tags: ["amazon", "oa", "coding", "interview", "graphs"], likes: 205, comments: 40, saves: 189, helpful: 120, createdAt: ago(520), company: "Amazon",
    body: `The online assessment had two coding problems in 90 minutes plus a work-style questionnaire. One was a sliding window problem on strings and the other a graph traversal on a grid, similar to counting islands with a twist.\n\nThe interview round was 45 minutes: one medium coding problem, then a discussion on time and space complexity, then leadership principles such as ownership and customer obsession. Prepare two STAR stories from your projects.\n\nPractise on a plain editor without autocomplete, talk through your approach before you code and test with edge cases out loud.` },
];

export const SKILL_CATEGORIES = ["All skills", "Programming", "Music", "Design", "Placement prep", "Languages", "Electronics"];

export const SKILLS = [
  { id: "s_marcus", userId: "u_marcus", cat: "Programming", title: "Data Structures tutoring & exam prep", desc: "Asymptotics, trees, graph algorithms and mock viva. Two years as the course TA.", swapFor: "45m for a Figma review", credits: 8, minutes: 45, mentor: { label: "30m strategy call + shared notes pack", minutes: 30 }, tag: "Senior TA Alumni", sessions: 96 },
  { id: "s_ananya", userId: "u_ananya", cat: "Music", title: "Guitar basics: chords, strumming & first song", desc: "Four one-hour lessons to play your first song. Bring your own guitar or rent mine.", swapFor: "Python basics", credits: 10, minutes: 60, mentor: null, tag: "Peer tutor", sessions: 23, art: "guitar" },
  { id: "s_vikram", userId: "u_vikram", cat: "Placement prep", title: "Mock interviews & resume review", desc: "45 minute mock technical round with feedback, or a line-by-line resume teardown.", swapFor: "Guitar basics", credits: 8, minutes: 45, mentor: { label: "Resume review + LinkedIn tune-up", minutes: 30 }, tag: "Verified Senior", sessions: 61 },
  { id: "s_karthik", userId: "u_karthik", cat: "Electronics", title: "Arduino & IoT project starter", desc: "From blinking LED to a working sensor dashboard. Debug your hardware project together.", swapFor: "UI/UX feedback", credits: 10, minutes: 60, mentor: null, tag: "Hackathon winner", sessions: 18 },
  { id: "s_sneha", userId: "u_sneha", cat: "Languages", title: "Spoken English & GD practice", desc: "Confidence-building sessions with mock group discussions. Great before campus drives.", swapFor: "Python basics", credits: 5, minutes: 30, mentor: null, tag: "Peer tutor", sessions: 34 },
  { id: "s_priya", userId: "u_priya", cat: "Programming", title: "GATE CSE: OS & DBMS problem solving", desc: "Concept clinic with numerical practice. Bring your doubts from previous year questions.", swapFor: "Photography basics", credits: 10, minutes: 60, mentor: { label: "GATE plan review (30m)", minutes: 30 }, tag: "Verified Senior", sessions: 48 },
  { id: "s_alex", userId: "u_alex", cat: "Electronics", title: "Verilog & digital design help", desc: "FSMs, testbenches and FPGA lab prep. Simulation walkthroughs.", swapFor: "Guitar basics", credits: 10, minutes: 60, mentor: null, tag: "Peer tutor", sessions: 15 },
];

export const CHATS = [
  { id: "ai", type: "ai", title: "Campus AI", pinned: true, unread: 0, members: [], messages: [] },
  { id: "c_priya", type: "dm", peer: "u_priya", unread: 2, context: { resourceId: "r_casio_lend", txId: "t_borrow" }, messages: [
    { id: "m1", from: "u_me", text: "Hi Priya! Thanks for accepting. Is the calculator okay for internals this week?", at: ago(7.9), status: "read" },
    { id: "m2", from: "u_priya", text: "Yes, works perfectly and it's exam-approved 👍", at: ago(7.8) },
    { id: "m3", from: "u_priya", type: "system", text: "Priya accepted your request · pre-check recorded", at: ago(6), txId: "t_borrow" },
    { id: "m4", from: "u_priya", text: "I can meet at the Central Library Safe Desk #2 around 5pm today", at: ago(0.6) },
    { id: "m5", from: "u_priya", text: "Bring your college ID, the desk staff will verify the QR 🙂", at: ago(0.5) },
  ] },
  { id: "c_ananya", type: "dm", peer: "u_ananya", unread: 0, messages: [
    { id: "m1", from: "u_ananya", text: "Hey! I saw you teach Python. I'd love to swap for guitar lessons 🎸", at: ago(30), status: "read" },
    { id: "m2", from: "u_me", text: "That sounds perfect! I've wanted to learn guitar since first year", at: ago(29.5), status: "read" },
    { id: "m3", from: "u_ananya", text: "1 hour each, alternating weeks? Skill credits will balance it out (+10 / -10)", at: ago(29), status: "read" },
    { id: "m4", from: "u_me", text: "Deal. Saturday 5pm at the Student Union?", at: ago(28.5), status: "read" },
    { id: "m5", from: "u_ananya", type: "voice", secs: 12, text: "Voice message", at: ago(28), status: "read" },
    { id: "m6", from: "u_ananya", text: "Sat 5pm works! See you there 🙌", at: ago(27.9), status: "read", reactions: { "🔥": ["u_me"] } },
  ] },
  { id: "g_cse3", type: "group", title: "CSE 3rd Year · Resource Circle", members: ["u_me", "u_karthik", "u_priya", "u_sneha", "u_arjun", "u_alex"], memberCount: 42, unread: 5, messages: [
    { id: "m1", from: "u_karthik", text: "Anyone has Galvin OS textbook to lend for a week? 🙏", at: ago(3) },
    { id: "m2", from: "u_arjun", text: "Try Campus AI. It finds books by subject and semester", at: ago(2.9) },
    { id: "m3", from: "u_alex", text: "Also set a wishlist alert, Priya lists stuff at the end of every sem", at: ago(2.8) },
    { id: "m4", from: "u_sneha", text: "Just borrowed a drafter from someone in this group and returned it. The QR handover is so smooth", at: ago(2.5) },
    { id: "m5", from: "u_priya", text: "I'll list mine tomorrow 😄", at: ago(2.2) },
  ] },
  { id: "c_sneha", type: "dm", peer: "u_sneha", unread: 1, context: { resourceId: "r_ds", txId: "t_req" }, messages: [
    { id: "m1", from: "u_sneha", type: "listing", resourceId: "r_ds", text: "Interested in this", at: ago(2.1) },
    { id: "m2", from: "u_sneha", text: "Hi Rahul! Need this for my sem exam prep. Can I pick it up tomorrow?", at: ago(2) },
  ] },
  { id: "c_vikram", type: "dm", peer: "u_vikram", unread: 0, messages: [
    { id: "m1", from: "u_me", text: "Hi Vikram, could we book a mock interview slot next week?", at: ago(52), status: "read" },
    { id: "m2", from: "u_vikram", text: "Sure! Thursday 6pm works. Send me your resume beforehand", at: ago(50), status: "read" },
    { id: "m3", from: "u_me", text: "Will do. Should I focus on DSA or projects?", at: ago(49), status: "delivered" },
  ] },
  { id: "g_place", type: "group", title: "Placement Prep 2027", members: ["u_me", "u_marcus", "u_vikram", "u_priya"], memberCount: 128, unread: 0, muted: true, messages: [
    { id: "m1", from: "u_marcus", text: "Posted the Amazon OA breakdown in the Knowledge Hub. Check it out 👇", at: ago(26) },
    { id: "m2", from: "u_vikram", text: "Mock interview slots for next week are open in Skill Swap", at: ago(24) },
  ] },
  { id: "c_karthik", type: "dm", peer: "u_karthik", unread: 0, context: { resourceId: "r_dbms" }, messages: [
    { id: "m1", from: "u_me", type: "listing", resourceId: "r_dbms", text: "Is this still available?", at: ago(80), status: "read" },
    { id: "m2", from: "u_karthik", text: "Yes! Whenever you need it. It's on my desk", at: ago(79), status: "read" },
  ] },
];

export const NOTIFICATIONS = [
  { id: "n1", kind: "request", icon: "package", title: "Sneha requested your Data Structures textbook", body: "10 days · ₹43 · pick-up at Central Library", at: ago(2), read: false, action: { type: "tx", id: "t_req" }, group: "requests" },
  { id: "n2", kind: "return", icon: "clock", title: "Digital Logic Design is due in 3 days", body: "Return to Alex at the Student Union to keep your on-time streak", at: ago(6), read: false, action: { type: "tx", id: "t_active" }, group: "requests" },
  { id: "n3", kind: "return", icon: "check", title: "Meera returned Python Crash Course", body: "AI condition check: 96% match. Confirm to close the exchange", at: ago(1), read: false, action: { type: "tx", id: "t_pending" }, group: "requests" },
  { id: "n4", kind: "credit", icon: "coins", title: "You earned +10 Campus Credits", body: "Teaching Python basics to Sneha (1 hour)", at: ago(26), read: true, action: { type: "wallet" }, group: "social" },
  { id: "n5", kind: "trust", icon: "shield", title: "Your Trust Score is now 94", body: "Up 2 points after an on-time return with a 5-star review", at: ago(48), read: true, action: { type: "trust" }, group: "social" },
  { id: "n6", kind: "social", icon: "heart", title: "Priya and 41 others found your post helpful", body: "“DBMS quick notes” has reached 110 juniors", at: ago(72), read: true, action: { type: "post", id: "k_dbms" }, group: "social" },
];

export const WISHLIST = [
  { id: "w1", title: "Operating Systems: Galvin", mode: "LEND", maxPrice: 40, alerts: true, createdAt: ago(80) },
  { id: "w2", title: "Casio scientific calculator", mode: "SELL", maxPrice: 900, alerts: true, createdAt: ago(200) },
  { id: "w3", title: "Computer Networks: Tanenbaum", mode: "LEND", maxPrice: 30, alerts: false, createdAt: ago(300) },
];

export const CREDITS = {
  balance: 120,
  ledger: [
    { id: "l1", delta: +10, note: "Taught Python basics to Sneha", at: ago(26) },
    { id: "l2", delta: -10, note: "Guitar basics with Ananya (held)", at: ago(24) },
    { id: "l3", delta: +10, note: "Python for ML: study circle", at: ago(120) },
    { id: "l4", delta: +50, note: "Knowledge bonus: 2 posts helped 200+ juniors", at: ago(240) },
    { id: "l5", delta: +60, note: "Welcome bonus", at: ago(2000) },
  ],
};

export const SESSIONS = [{ id: "ss1", skillId: "s_ananya", userId: "u_ananya", when: "Sat, 5:00 pm", zone: "union", minutes: 60, credits: 10, mode: "swap", status: "BOOKED" }];

export const STORIES = [
  { id: "st_tcs", authorId: "u_vikram", label: "TCS Digital", seen: false, frames: [
    { hue: 232, kicker: "Interview story", title: "TCS Digital in 3 rounds", text: "Online test, technical, then HR. Here's what actually got asked.", cta: { label: "Read full experience", to: { type: "post", id: "k_tcs" } } },
    { hue: 262, kicker: "Round 2", title: "Project first, then OOP, DBMS & SQL", text: "They asked me to draw my project's architecture before any theory. Know it end to end." },
    { hue: 300, kicker: "Tip", title: "Practise GROUP BY + HAVING", text: "One SQL question decided my technical round. Ten minutes of joins a day is enough.", cta: { label: "Ask Campus AI more", to: { type: "ai", q: "How should I prepare for the TCS Digital interview?" } } },
  ] },
  { id: "st_new", authorId: "u_priya", label: "New today", seen: false, frames: [
    { hue: 158, kicker: "Fresh listing", title: "Chemistry lab coat + goggles", text: "Free for a first-year. Pass-down from Meera.", cta: { label: "Claim free", to: { type: "item", id: "r_labcoat" } }, art: { kind: "coat", hue: 158, label: "Lab kit" } },
    { hue: 30, kicker: "Fresh listing", title: "Yamaha F310 guitar", text: "₹150 a week with capo and gig bag.", cta: { label: "View listing", to: { type: "item", id: "r_guitar" } }, art: { kind: "guitar", hue: 30, label: "F310" } },
    { hue: 172, kicker: "Fresh listing", title: "Hero Sprint 21-speed cycle", text: "₹60 a week. Hostel to department in 6 minutes.", cta: { label: "View listing", to: { type: "item", id: "r_cycle" } }, art: { kind: "bike", hue: 172, label: "21-speed" } },
  ] },
  { id: "st_sih", authorId: "u_karthik", label: "SIH finals", seen: false, frames: [
    { hue: 12, kicker: "Hackathon story", title: "From idea to SIH finals", text: "Six people, one week of user research, then code.", cta: { label: "Read the playbook", to: { type: "post", id: "k_sih" } } },
    { hue: 340, kicker: "Pitch tip", title: "Demo first, numbers second", text: "Judges remember what they saw in the first 90 seconds." },
  ] },
  { id: "st_impact", authorId: "u_priya", label: "Milestone", seen: true, frames: [
    { hue: 250, kicker: "Campus milestone", title: "1,830 resources reused", text: "That's 1,830 things nobody had to buy new. Est. student savings: ₹12.4 lakh.", cta: { label: "See campus impact", to: { type: "impact" } } },
  ] },
  { id: "st_gate", authorId: "u_priya", label: "GATE 101", seen: true, frames: [
    { hue: 200, kicker: "Career", title: "GATE CSE in 6 months, part-time", text: "Core subjects first, mocks in the last two months.", cta: { label: "Read the strategy", to: { type: "post", id: "k_gate" } } },
  ] },
];

export const IMPACT = {
  campus: { shared: 2450, reused: 1830, knowledge: 3650, interviews: 420, skillExchanges: 870, savings: 1240000, hours: 1850, peerCost: 350000, retail: 1590000, waste: 4.2, co2: 18.4, greenTarget: 94, packs: 142, sessions: 640,
    categories: [{ id: "books", label: "Textbooks & course packs", rate: "92% reuse rate", loans: 1410, retained: 740000 }, { id: "lab", label: "Lab equipment & model kits", rate: "Safety verified", loans: 512, retained: 310000 }, { id: "tech", label: "Calculators & tech", rate: "100% condition-checked", loans: 388, retained: 190000 }],
    topCourses: ["CS 201 · Data Structures", "CH 102 · Organic", "MA 201 · Engg Maths", "EC 202 · Digital Logic", "CS 305 · DBMS"],
    hall: { userId: "u_vikram", title: "Placement Prep Pack", downloads: 184, hours: 45 } },
  me: { saved: 3860, reused: 7, co2: 9, level: 3, posts: 2, sessions: 6, exchanges: 4, hoursTaught: 6 },
};

export const BADGES = [
  { id: "verified", label: "Campus Verified", icon: "shield", tone: "green", earned: true, hint: "College email confirmed" },
  { id: "first", label: "First lend", icon: "repeat", tone: "", earned: true, hint: "Lent your first item" },
  { id: "ontime", label: "10 on-time returns", icon: "clock", tone: "", earned: true, hint: "Ten returns before due" },
  { id: "mentor", label: "Peer mentor", icon: "grad", tone: "amber", earned: true, hint: "Taught 5+ hours" },
  { id: "green", label: "Green champion", icon: "leaf", tone: "green", earned: true, hint: "Saved 10 kg CO₂e" },
  { id: "sage", label: "Knowledge sage", icon: "bulb", tone: "amber", earned: false, hint: "Help 500 juniors" },
];

export const QUICK_REPLIES = ["Is this still available?", "Can we meet at the Library Safe Desk?", "Can I extend by 2 days?", "Thanks! 🙌"];
export const EMOJIS = ["👍", "❤️", "😂", "🔥", "🙏", "🎉", "😮", "👏", "📚", "🎸", "✅", "😅", "🤝", "💯", "🚲", "☕"];

export const REVIEWS = [
  { id: "rv1", forId: "u_me", fromId: "u_marcus", rating: 5, tags: ["On time", "Great condition"], text: "Returned the Pi kit spotless and two days early. Would lend again.", at: ago(250) },
  { id: "rv2", forId: "u_me", fromId: "u_sneha", rating: 5, tags: ["Friendly"], text: "Rahul's Python session made loops finally click. Super patient!", at: ago(500) },
  { id: "rv3", forId: "u_me", fromId: "u_alex", rating: 4, tags: ["Easy handover"], text: "Smooth QR handover at the Union desk.", at: ago(900) },
  { id: "rv4", forId: "u_priya", fromId: "u_me", rating: 5, tags: ["On time", "Would lend again"], text: "The calculator worked perfectly through internals.", at: ago(300) },
  { id: "rv5", forId: "u_ananya", fromId: "u_alex", rating: 5, tags: ["Friendly"], text: "Great guitar teacher. Played my first song in 3 lessons.", at: ago(400) },
  { id: "rv6", forId: "u_marcus", fromId: "u_arjun", rating: 5, tags: ["Great condition"], text: "Best DS revision session I've had.", at: ago(600) },
];
