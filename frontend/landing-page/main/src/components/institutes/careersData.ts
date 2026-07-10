export interface JobOpening {
  id: string;
  title: string;
  team: "Frontend" | "Backend";
  type: string;
  location: string;
  experience: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export const jobOpenings: JobOpening[] = [
  {
    id: "frontend-engineer",
    title: "Frontend Engineer (React / Next.js)",
    team: "Frontend",
    type: "Full-time",
    location: "Remote (India)",
    experience: "2–5 years",
    summary:
      "Build fast, accessible, delightful interfaces for the DailyTaiyari platform used by institutes and students across India.",
    responsibilities: [
      "Build and ship features in our Next.js + TypeScript codebase.",
      "Craft polished, responsive UI with Tailwind CSS and Framer Motion.",
      "Integrate REST APIs and manage client-side state cleanly.",
      "Care about performance, accessibility and Core Web Vitals.",
    ],
    requirements: [
      "Strong React, TypeScript and modern CSS fundamentals.",
      "Experience with Next.js (App Router) and component-driven development.",
      "An eye for detail and good product sense.",
      "Bonus: experience with design systems or EdTech products.",
    ],
  },
  {
    id: "frontend-intern",
    title: "Frontend Engineering Intern",
    team: "Frontend",
    type: "Internship",
    location: "Remote (India)",
    experience: "0–1 years",
    summary:
      "Learn on a real product. Work alongside senior engineers shipping features that reach thousands of students.",
    responsibilities: [
      "Implement UI components from designs.",
      "Fix bugs and improve existing screens.",
      "Write clean, reviewable code with guidance.",
    ],
    requirements: [
      "Solid grasp of HTML, CSS and JavaScript.",
      "Some exposure to React.",
      "Eagerness to learn and take feedback.",
    ],
  },
  {
    id: "backend-engineer-django",
    title: "Backend Engineer (Django / DRF)",
    team: "Backend",
    type: "Full-time",
    location: "Remote (India)",
    experience: "2–5 years",
    summary:
      "Design and scale the multi-tenant Django backend that powers assessments, analytics and content for the whole platform.",
    responsibilities: [
      "Build robust APIs with Django REST Framework.",
      "Design data models for a multi-tenant architecture.",
      "Own performance, reliability and security of services.",
      "Write tests and participate in code reviews.",
    ],
    requirements: [
      "Strong Python and Django / DRF experience.",
      "Solid understanding of relational databases and query optimization.",
      "Experience building and consuming REST APIs.",
      "Bonus: Docker, Celery, PostgreSQL, cloud deployment.",
    ],
  },
  {
    id: "backend-engineer-senior",
    title: "Senior Backend Engineer (Django)",
    team: "Backend",
    type: "Full-time",
    location: "Remote (India)",
    experience: "5+ years",
    summary:
      "Lead backend architecture decisions and mentor engineers as we scale DailyTaiyari to many more institutes.",
    responsibilities: [
      "Drive architecture for scalability and multi-tenancy.",
      "Mentor engineers and raise the engineering bar.",
      "Own critical services end-to-end.",
    ],
    requirements: [
      "Deep Django / Python expertise at scale.",
      "Experience designing distributed, high-traffic systems.",
      "Strong communication and mentorship skills.",
    ],
  },
];
