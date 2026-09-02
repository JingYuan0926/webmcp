"use client";

import { useEffect, useRef, useState } from "react";

const sections = [
  { id: "quick-start", label: "Quick start" },
  { id: "execution", label: "Execution model" },
  { id: "value", label: "Who it protects" },
  { id: "tools", label: "Register tools" },
  { id: "policies", label: "Policies" },
  { id: "approvals", label: "Approval UI" },
  { id: "api", label: "Client API" },
  { id: "events", label: "Events" },
  { id: "scope", label: "Protection boundary" },
  { id: "trust", label: "Trust and privacy" },
  { id: "roadmap", label: "Roadmap" },
] as const;

export function DocsSidebar() {
  const sidebarRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("quick-start");

  useEffect(() => {
    const sectionElements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    let animationFrame = 0;

    const updateActiveSection = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const pageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        let nextSection = sectionElements[0]?.id ?? "quick-start";

        if (pageBottom) {
          nextSection = sectionElements.at(-1)?.id ?? nextSection;
        } else {
          const readingLine = Math.min(180, window.innerHeight * 0.3);

          for (const section of sectionElements) {
            if (section.getBoundingClientRect().top > readingLine) break;
            nextSection = section.id;
          }
        }

        setActiveSection(nextSection as (typeof sections)[number]["id"]);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const activeLink = sidebar?.querySelector<HTMLElement>(`a[href="#${activeSection}"]`);
    if (!sidebar || !activeLink) return;

    const sidebarBox = sidebar.getBoundingClientRect();
    const linkBox = activeLink.getBoundingClientRect();
    const inset = 8;

    if (linkBox.top < sidebarBox.top + inset) {
      sidebar.scrollTop -= sidebarBox.top + inset - linkBox.top;
    } else if (linkBox.bottom > sidebarBox.bottom - inset) {
      sidebar.scrollTop += linkBox.bottom - sidebarBox.bottom + inset;
    }

    if (linkBox.left < sidebarBox.left + inset) {
      sidebar.scrollLeft -= sidebarBox.left + inset - linkBox.left;
    } else if (linkBox.right > sidebarBox.right - inset) {
      sidebar.scrollLeft += linkBox.right - sidebarBox.right + inset;
    }
  }, [activeSection]);

  return (
    <aside ref={sidebarRef} className="sdk-docs-sidebar">
      <nav aria-label="SDK documentation">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
