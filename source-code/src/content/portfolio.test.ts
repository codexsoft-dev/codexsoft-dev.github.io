import { describe, expect, it } from "vitest";

import {
  aboutMoreAction,
  COURSES,
  INITIAL_REVEAL,
  revealReducer,
  visibleCourses,
  visibleSkills,
  type RevealAction,
} from "./portfolio";

describe("Technical Skills reveal", () => {
  it("shows the 8 featured technologies before Show All Skills", () => {
    expect(visibleSkills(false).map((s) => s.name)).toEqual([
      "Go",
      "Java",
      "PostgreSQL",
      "MySQL",
      "REST API",
      "gRPC",
      "Apache Kafka",
      "Docker",
    ]);
  });

  it("shows every technology from images/tech after Show All Skills", () => {
    const names = visibleSkills(true).map((s) => s.name);
    expect(names).toHaveLength(17);
    for (const n of ["RabbitMQ", "MongoDB", "MariaDB", "Redis", "Kubernetes", "Terraform", "GCP", "AWS", "Azure"]) {
      expect(names).toContain(n);
    }
  });
});

describe("Show all courses", () => {
  it("shows only Go Concurrency until Show all courses is clicked", () => {
    expect(visibleCourses(false).map((c) => c.title)).toEqual(["Go Concurrency"]);
  });

  it("shows all 5 courses after Show all courses", () => {
    expect(visibleCourses(true)).toHaveLength(5);
    expect(visibleCourses(true)).toEqual(COURSES);
  });
});

const run = (...actions: RevealAction[]) => actions.reduce(revealReducer, INITIAL_REVEAL);

describe("About show more / show less and the course list", () => {
  it("show more... also shows all courses when they were not shown", () => {
    const s = run("aboutMore");
    expect(s.aboutExpanded).toBe(true);
    expect(s.showAllCourses).toBe(true);
  });

  it("show less... folds the courses back when show more... opened them", () => {
    const s = run("aboutMore", "aboutLess");
    expect(s.aboutExpanded).toBe(false);
    expect(s.showAllCourses).toBe(false);
  });

  it("show less... keeps all courses when Show all courses opened them", () => {
    const s = run("showAllCourses", "aboutMore", "aboutLess");
    expect(s.aboutExpanded).toBe(false);
    expect(s.showAllCourses).toBe(true);
  });

  it("Show Fewer Courses folds the full list back to the first course", () => {
    const s = run("showAllCourses", "hideAllCourses");
    expect(s.showAllCourses).toBe(false);
    expect(visibleCourses(s.showAllCourses)).toHaveLength(1);
  });

  it("show less... after Show Fewer Courses leaves the list folded", () => {
    const s = run("aboutMore", "hideAllCourses", "aboutLess");
    expect(s.aboutExpanded).toBe(false);
    expect(s.showAllCourses).toBe(false);
  });

  it("on desktop, show more... is the linked action", () => {
    expect(aboutMoreAction(true)).toBe("aboutMore");
  });

  it("on tablets and phones, show more... does not open the courses", () => {
    const s = run(aboutMoreAction(false));
    expect(s.aboutExpanded).toBe(true);
    expect(s.showAllCourses).toBe(false);
  });

  it("on tablets and phones, show less... keeps the courses opened by Show All Courses", () => {
    const s = run("showAllCourses", aboutMoreAction(false), "aboutLess");
    expect(s.aboutExpanded).toBe(false);
    expect(s.showAllCourses).toBe(true);
  });

  it("on tablets and phones, Show Fewer Courses leaves About expanded", () => {
    const s = run("showAllCourses", aboutMoreAction(false), "hideAllCourses");
    expect(s.aboutExpanded).toBe(true);
    expect(s.showAllCourses).toBe(false);
  });
});
