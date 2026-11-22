import awsIcon from "@/assets/tech/aws.svg";
import azureIcon from "@/assets/tech/azure.svg";
import dockerIcon from "@/assets/tech/docker.svg";
import gcpIcon from "@/assets/tech/gcp.svg";
import goIcon from "@/assets/tech/go.svg";
import grpcIcon from "@/assets/tech/grpc-logo.svg";
import javaIcon from "@/assets/tech/java.svg";
import kafkaIcon from "@/assets/tech/kafka.svg";
import kubernetesIcon from "@/assets/tech/kubernetes.svg";
import mariadbIcon from "@/assets/tech/mariadb.svg";
import mongodbIcon from "@/assets/tech/mongodb.svg";
import mysqlIcon from "@/assets/tech/mysql.svg";
import postgresqlIcon from "@/assets/tech/postgresql.svg";
import rabbitmqIcon from "@/assets/tech/rabbitmq.svg";
import redisIcon from "@/assets/tech/redis.svg";
import restIcon from "@/assets/tech/rest.png";
import terraformIcon from "@/assets/tech/terraform.svg";

import cupOGoLogo from "@/assets/course/cup-o-go-dark.webp";
import gitReferenceLogo from "@/assets/course/git-command-reference-dark.webp";
import goConcurrencyLogo from "@/assets/course/go-concurrency-dark.webp";
import goTestingLogo from "@/assets/course/go-testing-handbook-light.webp";
import goPathLogo from "@/assets/course/gopath-zero-to-gopher-light.webp";

import finbetLogo from "@/assets/experience/finbet.webp";
import goEvangelistLogo from "@/assets/experience/go-evangelist.webp";
import ingsoftwareLogo from "@/assets/experience/ingsoftware.webp";

export const CONTACT_EMAIL = "codex7soft@gmail.com";

export const SOCIAL = {
  linkedin: "https://www.linkedin.com/in/goevangelist",
  github: "https://github.com/golang-evangelist",
  x: "https://x.com/go_evangelist",
  instagram: "https://instagram.com/go_evangelist",
} as const;

export type Platform = "instagram" | "x" | "linkedin" | "github";

/* ---------------------------------- Skills --------------------------------- */

export type Skill = { name: string; icon: string; featured: boolean };

export const SKILLS_INTRO =
  "A diverse set of technologies and tools powering robust backend solutions and modern software systems.";
export const SKILLS_MORE =
  "Technologies, tools, and engineering practices behind reliable, scalable, and maintainable backend systems.";

/** Featured skills show first; the rest appear after "Show All Skills". */
export const SKILLS: Skill[] = [
  { name: "Go", icon: goIcon, featured: true },
  { name: "Java", icon: javaIcon, featured: true },
  { name: "PostgreSQL", icon: postgresqlIcon, featured: true },
  { name: "MySQL", icon: mysqlIcon, featured: true },
  { name: "REST API", icon: restIcon, featured: true },
  { name: "gRPC", icon: grpcIcon, featured: true },
  { name: "Apache Kafka", icon: kafkaIcon, featured: true },
  { name: "Docker", icon: dockerIcon, featured: true },
  { name: "RabbitMQ", icon: rabbitmqIcon, featured: false },
  { name: "MongoDB", icon: mongodbIcon, featured: false },
  { name: "MariaDB", icon: mariadbIcon, featured: false },
  { name: "Redis", icon: redisIcon, featured: false },
  { name: "Kubernetes", icon: kubernetesIcon, featured: false },
  { name: "Terraform", icon: terraformIcon, featured: false },
  { name: "GCP", icon: gcpIcon, featured: false },
  { name: "AWS", icon: awsIcon, featured: false },
  { name: "Azure", icon: azureIcon, featured: false },
];

export function visibleSkills(expanded: boolean): Skill[] {
  return expanded ? SKILLS : SKILLS.filter((s) => s.featured);
}

/* -------------------------------- Experience ------------------------------- */

export type Job = {
  role: string;
  company: string;
  period: string;
  logo: string;
  logoAlt: string;
  /** Wrap a phrase in **double asterisks** to highlight it. */
  bullets: string[];
};

export const EXPERIENCE_INTRO =
  "From legacy systems to modern microservices — across iGaming and beyond.";

export const EXPERIENCE: Job[] = [
  {
    role: "Go Educator & Content Creator",
    company: "Self-employed",
    period: "Mar 2026 – Present",
    logo: goEvangelistLogo,
    logoAlt: "Go Evangelist logo",
    bullets: [
      "Created 5 free educational courses: Go Concurrency, GoPath, Git Command Reference, Go Testing Handbook, and Cup 'o Go.",
      "Active on X and Instagram as **@go_evangelist** and on LinkedIn as **@goevangelist**",
    ],
  },
  {
    role: "Backend Software Engineer",
    company: "Fincore/Finbet d.o.o.",
    period: "Aug 2020 – Present",
    logo: finbetLogo,
    logoAlt: "Fincore/Finbet logo",
    bullets: [
      "Casino Online Gambling Platform (Go)",
      "Sportsbook Platform (legacy Go)",
      "Casino Gaming Management System (legacy Java)",
    ],
  },
  {
    role: "Software Developer",
    company: "Ingsoftware d.o.o.",
    period: "Jun 2017 – Dec 2019",
    logo: ingsoftwareLogo,
    logoAlt: "Ingsoftware logo",
    bullets: ["Developed features for FamiliPay and Vistair SafetyNet."],
  },
];

/* --------------------------------- Courses --------------------------------- */

export type CourseBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };
export type CourseLink = { platform: Platform; label: string; href: string };
export type Course = {
  title: string;
  logo: string;
  logoAlt: string;
  date?: string;
  featured: boolean;
  body: CourseBlock[];
  links: CourseLink[];
};

export const COURSES: Course[] = [
  {
    title: "Go Concurrency",
    logo: goConcurrencyLogo,
    logoAlt: "Go Concurrency course logo",
    date: "Starts on November 30th, 2026",
    featured: true,
    body: [
      {
        type: "p",
        text: "This course takes you from goroutines and channels, through coordination and synchronization, to the memory model, atomics, lock-free techniques, profiling, and production architecture.",
      },
      {
        type: "p",
        text: "It is not a catalog of APIs. It is a model of who runs the work, who owns the state, who waits for whom, what establishes happens-before, how work stops, and how you measure that.",
      },
      {
        type: "p",
        text: "The text assumes Go 1.23 or later in the go line of go.mod, and it notes where Go 1.25 changes the default GOMAXPROCS. When behavior depends on a version, that version is stated. Scheduler details outside the specification are a model of the runtime. They are not a contract of the language.",
      },
    ],
    links: [
      { platform: "instagram", label: "Lesson #01", href: "https://www.instagram.com/go_evangelist" },
      { platform: "x", label: "Lesson #01", href: "https://x.com/go_evangelist" },
      { platform: "linkedin", label: "Lesson #01", href: "https://www.linkedin.com/in/goevangelist" },
      {
        platform: "github",
        label: "Full course",
        href: "https://github.com/golang-evangelist/handbook/tree/main/golang%2Fgo-concurrency",
      },
    ],
  },
  {
    title: "GoPath – Zero to Gopher",
    logo: goPathLogo,
    logoAlt: "GoPath – Zero to Gopher course logo",
    featured: false,
    body: [
      {
        type: "p",
        text: "The course takes you from the first program to services, tests, concurrency, secure code, profiling, and tools around the Go ecosystem. Each lesson explains the mechanism, shows code, and breaks down the decision: why Go works exactly that way and what trade-off that decision carries.",
      },
      {
        type: "p",
        text: "The target language version is Go 1.22+. Where a lesson depends on a newer API, that is noted in the text itself.",
      },
      {
        type: "p",
        text: "The course has 227 lessons in three modules: 01-Basics, 02-Intermediate, and 03-Others. The basics are areas 01 through 08.",
      },
    ],
    links: [
      { platform: "instagram", label: "Full course", href: "https://www.instagram.com/p/De5MXs6ldnx/" },
      { platform: "x", label: "Lesson #01", href: "https://x.com/go_evangelist/status/2114117036620345756" },
      { platform: "linkedin", label: "Lesson #01", href: "https://www.linkedin.com/in/goevangelist" },
      {
        platform: "github",
        label: "Full course",
        href: "https://github.com/golang-evangelist/handbook/tree/main/golang%2Fgo-path",
      },
    ],
  },
  {
    title: "Git Command Reference",
    logo: gitReferenceLogo,
    logoAlt: "Git Command Reference course logo",
    featured: false,
    body: [
      {
        type: "p",
        text: "A complete practical Git Command Reference for Developers, Software Engineers, and DevOps Engineers.",
      },
      {
        type: "p",
        text: "This course is a structured reference of Git commands, organized into 35 thematic chapters. Each chapter is contained in a separate *.md file and can be read independently or as part of the complete Git guide.",
      },
    ],
    links: [
      { platform: "instagram", label: "Lesson #01", href: "https://www.instagram.com/p/DekccLmEhkG" },
      { platform: "x", label: "Lesson #01", href: "https://x.com/go_evangelist/status/2111197058824802392" },
      { platform: "linkedin", label: "Lesson #01", href: "https://www.linkedin.com/in/goevangelist" },
      {
        platform: "github",
        label: "Full course",
        href: "https://github.com/golang-evangelist/handbook/tree/main/git%2Fcommand-reference",
      },
    ],
  },
  {
    title: "Go Testing Handbook",
    logo: goTestingLogo,
    logoAlt: "Go Testing Handbook course logo",
    featured: false,
    body: [
      {
        type: "p",
        text: "This course contains a comprehensive tutorial dedicated to testing in the Go (Golang) programming language.",
      },
      {
        type: "p",
        text: "The goal is not only to explain how to write tests, but also to explain:",
      },
      {
        type: "ul",
        items: [
          "why a particular testing technique exists,",
          "when it should be used,",
          "when it should be avoided,",
          "and how experienced Go developers organize tests in production projects.",
        ],
      },
      {
        type: "p",
        text: "The documentation gradually progresses from basic concepts to advanced topics and is intended for developers who already know the Go language and want to improve the quality of their code.",
      },
    ],
    links: [
      { platform: "instagram", label: "Lesson #01", href: "https://www.instagram.com/p/DbQZaCADCBW/" },
      { platform: "x", label: "Lesson #01", href: "https://x.com/go_evangelist/status/2106476500782399687" },
      { platform: "linkedin", label: "Lesson #01", href: "https://www.linkedin.com/in/goevangelist" },
      {
        platform: "github",
        label: "Full course",
        href: "https://github.com/golang-evangelist/handbook/tree/main/golang%2Ftesting",
      },
    ],
  },
  {
    title: "Cup 'o Go: 30 Pointer days",
    logo: cupOGoLogo,
    logoAlt: "Cup 'o Go course logo",
    featured: false,
    body: [
      {
        type: "p",
        text: "Cup 'o Go is a free, bite-sized course that turns Go pointers, one of the language's most misunderstood topics, into a daily habit. Over 30 days, each lesson takes about as long as a cup of coffee. Every lesson pairs a short, practical explanation with real Go code and focuses on what you'll actually meet in production codebases, not on dry theory.",
      },
      {
        type: "p",
        text: "The course goes from the very basics to the low-level details, and also explains why Go's pointer rules are designed the way they do. By the end, you'll know when to reach for a pointer and when a plain value is the better choice. The result is Go code that is simpler, safer and more idiomatic.",
      },
    ],
    links: [
      { platform: "instagram", label: "Lesson #01", href: "https://www.instagram.com/p/DVWFMCSjO84/" },
    ],
  },
];

export function visibleCourses(showAll: boolean): Course[] {
  return showAll ? COURSES : COURSES.filter((c) => c.featured);
}

export const FOLLOW_LINKS: { platform: Platform; handle: string; href: string }[] = [
  { platform: "x", handle: "@go_evangelist", href: SOCIAL.x },
  { platform: "instagram", handle: "@go_evangelist", href: SOCIAL.instagram },
  { platform: "linkedin", handle: "/goevangelist", href: SOCIAL.linkedin },
];

/* ---------------------------------- About ---------------------------------- */

export const ABOUT_LEAD =
  "I’m a Backend Software Engineer based in Serbia, designing and building backend services and distributed systems in Go and Java. In iGaming, I’ve worked on online casino and sportsbook platforms in Go and on a gaming management system in Java. I work with REST APIs, gRPC, SQL databases, Kafka, and Docker.";

export const ABOUT_REST = [
  "I also teach Go. I’ve created four free courses, including GoPath and the Go Testing Handbook.",
  "I value pragmatic design decisions, clean code, and ownership of what I build. My current focus is event-driven architecture in Go.",
  "I’m open to full-time roles and to B2B engagements through CODEX · SOFT, my independent software engineering practice.",
];

/* ------------------------- Education ↔ About reveal ------------------------ */

export type RevealState = {
  aboutExpanded: boolean;
  showAllCourses: boolean;
  /** True when "show more..." (not "Show all courses") opened the full course list. */
  coursesOpenedByAbout: boolean;
};

/**
 * "aboutMore" is the desktop "show more..." (side-by-side columns, linked to the
 * course list); "aboutMoreOnly" is the tablet/phone one, which only expands About.
 */
export type RevealAction =
  | "showAllCourses"
  | "hideAllCourses"
  | "aboutMore"
  | "aboutMoreOnly"
  | "aboutLess";

/** Which "show more..." action applies: linked to the courses only on desktop. */
export function aboutMoreAction(desktop: boolean): RevealAction {
  return desktop ? "aboutMore" : "aboutMoreOnly";
}

export const INITIAL_REVEAL: RevealState = {
  aboutExpanded: false,
  showAllCourses: false,
  coursesOpenedByAbout: false,
};

/**
 * "show more..." also opens every course when they are not shown yet, so the
 * taller About card leaves no empty space under Education. "show less..."
 * folds the courses back only if "show more..." was what opened them.
 * On tablets and phones the two lists are stacked, so About expands alone.
 */
export function revealReducer(state: RevealState, action: RevealAction): RevealState {
  switch (action) {
    case "showAllCourses":
      return { ...state, showAllCourses: true, coursesOpenedByAbout: false };
    case "hideAllCourses":
      return { ...state, showAllCourses: false, coursesOpenedByAbout: false };
    case "aboutMore":
      return state.showAllCourses
        ? { ...state, aboutExpanded: true }
        : { aboutExpanded: true, showAllCourses: true, coursesOpenedByAbout: true };
    case "aboutMoreOnly":
      return { ...state, aboutExpanded: true };
    case "aboutLess":
      return state.coursesOpenedByAbout
        ? { aboutExpanded: false, showAllCourses: false, coursesOpenedByAbout: false }
        : { ...state, aboutExpanded: false };
  }
}
