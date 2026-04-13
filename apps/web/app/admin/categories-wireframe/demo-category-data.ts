import type { WireframePresetCourseCategoryId } from "../wireframe-course-category-presets";
import { WIREFRAME_PRESET_COURSE_CATEGORIES } from "../wireframe-course-category-presets";

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

const DESCRIPTIONS: Record<WireframePresetCourseCategoryId, string> = {
  compliance:
    "Regulatory and policy-aligned training. Same taxonomy as the Course Categories box on the course editor — used for storefront filters and audit scope.",
  onboarding:
    "New-hire and role-ramp curricula. Matches the editor preset so assignments stay consistent between authoring and the category dashboard.",
  product:
    "Feature adoption, releases, and how-to for shipped capabilities. Linked to the “Product training” checkbox in course metadata.",
  ideas:
    "Innovation, proposals, and internal pitch tracks. Aligns with the Ideas preset in the course editor category picker.",
  leadership:
    "People managers, exec communication, and org health. Same label and id as Leadership in the editor metabox.",
  safety:
    "Workplace and field safety content. Pairs with the Safety preset on each course’s category list.",
  sales:
    "Revenue enablement: discovery, demos, pipeline, and CS handoffs. Mirrors Sales enablement in the course editor categories."
};

const COURSES_BY_PRESET: Record<WireframePresetCourseCategoryId, DemoCourseRow[]> = {
  compliance: [
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
  ],
  onboarding: [
    {
      id: "crs-eng-welcome",
      title: "Company and tools onboarding hub",
      skillTags: "All roles · Week one",
      visibility: "Published",
      owners: "People ops",
      updated: "Apr 1, 2026"
    },
    {
      id: "crs-ramp-week1",
      title: "Ramp week 1: ICP, personas, and territory",
      skillTags: "Sales · GTM",
      visibility: "Published",
      owners: "Rev enablement",
      updated: "Apr 11, 2026"
    },
    {
      id: "crs-crm-core",
      title: "CRM hygiene and pipeline basics",
      skillTags: "Sales ops · CRM",
      visibility: "Published",
      owners: "Rev enablement",
      updated: "Apr 6, 2026"
    },
    {
      id: "crs-inbound-sla",
      title: "Inbound lead response and SLA hygiene",
      skillTags: "Rev ops · Routing",
      visibility: "Published",
      owners: "Rev ops",
      updated: "Mar 31, 2026"
    }
  ],
  product: [
    {
      id: "crs-k8s-onboarding",
      title: "Kubernetes onboarding for app teams",
      skillTags: "Engineering · Platform",
      visibility: "Published",
      owners: "Platform L&D",
      updated: "Apr 8, 2026"
    },
    {
      id: "crs-demo-story",
      title: "Demo narrative and proof points by segment",
      skillTags: "Demos · Positioning",
      visibility: "Published",
      owners: "Product marketing",
      updated: "Apr 5, 2026"
    },
    {
      id: "crs-pricing-refresh",
      title: "Pricing & packaging update (Q2)",
      skillTags: "Packaging · GTM",
      visibility: "Published",
      owners: "Product marketing",
      updated: "Apr 9, 2026"
    },
    {
      id: "crs-competitive-q2",
      title: "Competitive landscape refresh: top three rivals",
      skillTags: "Positioning",
      visibility: "Published",
      owners: "Product marketing",
      updated: "Apr 11, 2026"
    }
  ],
  ideas: [
    {
      id: "crs-design-sprint",
      title: "Design sprint facilitation primer",
      skillTags: "Innovation · Workshops",
      visibility: "Published",
      owners: "Design ops",
      updated: "Mar 25, 2026"
    },
    {
      id: "crs-hackathon-kit",
      title: "Internal hackathon playbook",
      skillTags: "Engineering culture",
      visibility: "Draft",
      owners: "Tech community",
      updated: "Mar 10, 2026"
    }
  ],
  leadership: [
    {
      id: "crs-1on1-core",
      title: "Effective 1:1s and feedback habits",
      skillTags: "Managers · People",
      visibility: "Published",
      owners: "Leadership L&D",
      updated: "Apr 7, 2026"
    },
    {
      id: "crs-delegate",
      title: "Delegation and clarity of ownership",
      skillTags: "Managers · Ops",
      visibility: "Published",
      owners: "Leadership L&D",
      updated: "Mar 18, 2026"
    }
  ],
  safety: [
    {
      id: "crs-osha-ladder",
      title: "Ladder and lift safety refresher",
      skillTags: "Field · OSHA",
      visibility: "Draft",
      owners: "Facilities",
      updated: "Feb 22, 2026"
    },
    {
      id: "crs-ergo",
      title: "Office ergonomics and injury prevention",
      skillTags: "Workplace",
      visibility: "Published",
      owners: "Facilities",
      updated: "Jan 14, 2026"
    }
  ],
  sales: [
    {
      id: "crs-discovery-101",
      title: "Discovery calls that advance the deal",
      skillTags: "Discovery · MEDDPICC",
      visibility: "Published",
      owners: "Rev enablement",
      updated: "Apr 8, 2026"
    },
    {
      id: "crs-objections",
      title: "Handling objections: budget, timing, and status quo",
      skillTags: "Negotiation · Talk tracks",
      visibility: "Draft",
      owners: "Rev enablement",
      updated: "Mar 28, 2026"
    },
    {
      id: "crs-ae-sdr-align",
      title: "AE / SDR handoffs and meeting qualification",
      skillTags: "Process · Pipeline",
      visibility: "Published",
      owners: "Rev enablement",
      updated: "Mar 22, 2026"
    },
    {
      id: "crs-multi-thread",
      title: "Multi-threading and executive alignment",
      skillTags: "Enterprise · Stakeholders",
      visibility: "Published",
      owners: "Strategic sales",
      updated: "Apr 10, 2026"
    },
    {
      id: "crs-security-review",
      title: "Navigating IT and security questionnaires",
      skillTags: "Security · Sales eng",
      visibility: "Published",
      owners: "Strategic sales",
      updated: "Apr 3, 2026"
    },
    {
      id: "crs-procurement",
      title: "Procurement, legal redlines, and order forms",
      skillTags: "Deal desk · Contracts",
      visibility: "Published",
      owners: "Deal desk",
      updated: "Mar 29, 2026"
    },
    {
      id: "crs-seq-basics",
      title: "Outbound sequences that book meetings",
      skillTags: "Sequences · Email",
      visibility: "Published",
      owners: "SDR leadership",
      updated: "Apr 9, 2026"
    },
    {
      id: "crs-call-openers",
      title: "Cold call openers and voicemail scripts",
      skillTags: "Phone · SDR",
      visibility: "Published",
      owners: "SDR leadership",
      updated: "Apr 7, 2026"
    },
    {
      id: "crs-mutual-close",
      title: "Mutual close plans and next-step accountability",
      skillTags: "Closing · Process",
      visibility: "Published",
      owners: "Rev enablement",
      updated: "Apr 10, 2026"
    },
    {
      id: "crs-quota-math",
      title: "Quota, coverage model, and forecast hygiene",
      skillTags: "Rev ops · Forecasting",
      visibility: "Published",
      owners: "Rev ops",
      updated: "Apr 4, 2026"
    },
    {
      id: "crs-cs-handoff",
      title: "Sales to CS handoff: kickoff and success plan",
      skillTags: "Customer success · Handoff",
      visibility: "Published",
      owners: "Customer success",
      updated: "Mar 27, 2026"
    },
    {
      id: "crs-partner-sell",
      title: "Partner-led opportunities and co-sell basics",
      skillTags: "Channels · Partners",
      visibility: "Draft",
      owners: "Alliances",
      updated: "Mar 20, 2026"
    }
  ]
};

export const DEFAULT_CATEGORY_WIREFRAME_ID = "cat-sales";

export const DEMO_CATEGORY_TREE: DemoCategoryNode[] = WIREFRAME_PRESET_COURSE_CATEGORIES.map((preset) => ({
  id: `cat-${preset.id}`,
  name: preset.label,
  slug: preset.id,
  description: DESCRIPTIONS[preset.id],
  grouping: "Topic" as const,
  visibility: "Catalog" as const,
  children: [],
  courses: COURSES_BY_PRESET[preset.id]
}));

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
