export type DemoCourseRow = {
  id: string;
  title: string;
  skillTags: string;
  visibility: "Published" | "Draft" | "Retired";
  owners: string;
  updated: string;
};

export type DemoCategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  grouping: "Topic" | "Skill track" | "Department";
  visibility: "Catalog" | "Admin only" | "Hidden";
  children: DemoCategoryNode[];
  courses: DemoCourseRow[];
};

export const DEFAULT_CATEGORY_WIREFRAME_ID = "cat-dept-compliance";

export const DEMO_CATEGORY_TREE: DemoCategoryNode[] = [
  {
    id: "cat-dept-engineering",
    name: "Engineering",
    slug: "engineering",
    description:
      "Product and platform training owned by Engineering. Subfolders separate skill tracks from department-wide onboarding.",
    grouping: "Department",
    visibility: "Catalog",
    children: [
      {
        id: "cat-skill-platform",
        name: "Platform & infrastructure",
        slug: "platform-infrastructure",
        description:
          "Deep dives on services, deployment, and observability. Learners filter here when looking for operational excellence content.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [
          {
            id: "cat-topic-reliability",
            name: "Reliability fundamentals",
            slug: "reliability-fundamentals",
            description:
              "SLOs, error budgets, incident response basics. Subcategory under the platform track for clearer storefront navigation.",
            grouping: "Topic",
            visibility: "Catalog",
            children: [],
            courses: [
              {
                id: "crs-slo-101",
                title: "SLOs and error budgets in practice",
                skillTags: "SRE · Metrics",
                visibility: "Published",
                owners: "Platform L&D",
                updated: "Apr 2, 2026"
              },
              {
                id: "crs-incident-201",
                title: "Incident commander playbook",
                skillTags: "Incidents · Comms",
                visibility: "Published",
                owners: "Platform L&D",
                updated: "Mar 18, 2026"
              }
            ]
          }
        ],
        courses: [
          {
            id: "crs-k8s-onboarding",
            title: "Kubernetes onboarding for app teams",
            skillTags: "Containers · K8s",
            visibility: "Published",
            owners: "Platform L&D",
            updated: "Apr 8, 2026"
          }
        ]
      },
      {
        id: "cat-skill-security",
        name: "Application security",
        slug: "application-security",
        description:
          "Secure SDLC, reviews, and secure coding. Parallel track to platform content so security training stays easy to locate.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
          {
            id: "crs-threat-model",
            title: "Threat modeling workshop",
            skillTags: "Security design",
            visibility: "Published",
            owners: "Security champions",
            updated: "Mar 30, 2026"
          },
          {
            id: "crs-deps",
            title: "Dependency hygiene lab",
            skillTags: "Supply chain",
            visibility: "Draft",
            owners: "Security champions",
            updated: "Mar 12, 2026"
          }
        ]
      }
    ],
    courses: [
      {
        id: "crs-eng-welcome",
        title: "Engineering onboarding hub",
        skillTags: "Onboarding",
        visibility: "Published",
        owners: "Engineering ops",
        updated: "Apr 1, 2026"
      }
    ]
  },
  {
    id: "cat-dept-compliance",
    name: "Compliance & risk",
    slug: "compliance-risk",
    description:
      "Regulatory and policy-aligned curricula. Administrators nest HIPAA, OSHA, and regional policies as subfolders while learners search by obligation.",
    grouping: "Department",
    visibility: "Catalog",
    children: [
      {
        id: "cat-topic-hipaa",
        name: "HIPAA & privacy",
        slug: "hipaa-privacy",
        description:
          "PHI handling, BAAs, and breach workflows. Treated as a dedicated subcategory for storefront filters and audit scope.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
          {
            id: "crs-hipaa-101",
            title: "HIPAA essentials for hybrid teams",
            skillTags: "Privacy · PHI",
            visibility: "Published",
            owners: "Compliance",
            updated: "Apr 10, 2026"
          },
          {
            id: "crs-baa",
            title: "Business associate agreements in plain language",
            skillTags: "Legal · PHI",
            visibility: "Published",
            owners: "Compliance",
            updated: "Apr 4, 2026"
          }
        ]
      },
      {
        id: "cat-topic-osha",
        name: "Workplace safety (OSHA)",
        slug: "osha-workplace-safety",
        description:
          "Site safety and reporting. Kept alongside HIPAA under Compliance so admins manage one hierarchy for risk-facing training.",
        grouping: "Topic",
        visibility: "Admin only",
        children: [],
        courses: [
          {
            id: "crs-osha-ladder",
            title: "Ladder and lift safety refresher",
            skillTags: "Safety · Field",
            visibility: "Draft",
            owners: "Facilities",
            updated: "Feb 22, 2026"
          }
        ]
      }
    ],
    courses: []
  },
  {
    id: "cat-dept-sales",
    name: "Revenue org",
    slug: "revenue-org",
    description:
      "Sales and customer success enablement. Often mirrored on learner dashboards with role-based visibility while admins curate by funnel stage.",
    grouping: "Department",
    visibility: "Catalog",
    children: [
      {
        id: "cat-topic-new-hire-sales",
        name: "Sales new hire",
        slug: "sales-new-hire",
        description: "First 90 days for AEs and SDRs. Subfolder isolates ramp content from continuous enablement.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
          {
            id: "crs-crm-core",
            title: "CRM hygiene and pipeline basics",
            skillTags: "Sales ops · CRM",
            visibility: "Published",
            owners: "Rev enablement",
            updated: "Apr 6, 2026"
          }
        ]
      }
    ],
    courses: [
      {
        id: "crs-pricing-refresh",
        title: "Pricing & packaging update (Q2)",
        skillTags: "Product marketing",
        visibility: "Published",
        owners: "Rev enablement",
        updated: "Apr 9, 2026"
      }
    ]
  }
];

function findPath(nodes: DemoCategoryNode[], id: string): DemoCategoryNode[] | null {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }
    const childPath = findPath(node.children, id);
    if (childPath) {
      return [node, ...childPath];
    }
  }
  return null;
}

export function findDemoCategory(id: string): DemoCategoryNode | null {
  const path = findPath(DEMO_CATEGORY_TREE, id);
  return path ? path[path.length - 1] ?? null : null;
}

export function getDemoCategoryBreadcrumb(id: string): DemoCategoryNode[] {
  return findPath(DEMO_CATEGORY_TREE, id) ?? [];
}

