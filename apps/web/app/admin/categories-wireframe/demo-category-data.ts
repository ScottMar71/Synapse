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
    "Regulatory and policy-aligned training. Same top-level label as the Course Categories box on the course editor; subfolders here are admin-only examples for storefront hierarchy.",
  onboarding:
    "New-hire and role-ramp curricula. Matches the editor preset; nested folders illustrate how L&D might split all-company vs revenue onboarding.",
  product:
    "Feature adoption and GTM collateral. Subcategories separate engineering-facing releases from positioning and packaging content.",
  ideas:
    "Innovation and internal experiments. Example subfolder groups facilitated workshops and community programs.",
  leadership:
    "People managers and org health. Example subfolder bundles foundational manager skills in one place.",
  safety:
    "Workplace and field safety. Example split between field crews and office workers mirrors common LMS subcategory patterns.",
  sales:
    "Revenue enablement. Example subfolders for SDR, AE, enterprise deal desk, and CS/partners — typical of a mature sales academy."
};

/** Example subfolders + root-level courses per editor preset (wireframe only). */
type PresetTreeConfig = {
  rootCourses: DemoCourseRow[];
  children: DemoCategoryNode[];
};

const PRESET_TREE: Record<WireframePresetCourseCategoryId, PresetTreeConfig> = {
  compliance: {
    rootCourses: [],
    children: [
      {
        id: "cat-compliance-privacy",
        name: "Privacy & HIPAA",
        slug: "compliance-privacy-hipaa",
        description:
          "PHI handling, breach workflows, and hybrid-work policies. Learners often land here from search while admins nest under Compliance.",
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
          }
        ]
      },
      {
        id: "cat-compliance-third-parties",
        name: "Third parties & BAAs",
        slug: "compliance-third-parties",
        description: "Vendors, business associates, and contract language used in audits.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
          {
            id: "crs-baa",
            title: "Business associate agreements in plain language",
            skillTags: "Legal · PHI",
            visibility: "Published",
            owners: "Compliance",
            updated: "Apr 4, 2026"
          }
        ]
      }
    ]
  },
  onboarding: {
    rootCourses: [
      {
        id: "crs-eng-welcome",
        title: "Company and tools onboarding hub",
        skillTags: "All roles · Week one",
        visibility: "Published",
        owners: "People ops",
        updated: "Apr 1, 2026"
      }
    ],
    children: [
      {
        id: "cat-onboarding-revenue",
        name: "Revenue roles ramp",
        slug: "onboarding-revenue-ramp",
        description: "ICP, CRM, pipeline, and inbound SLAs for sales and rev ops during the first quarter.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
        ]
      }
    ]
  },
  product: {
    rootCourses: [
      {
        id: "crs-k8s-onboarding",
        title: "Kubernetes onboarding for app teams",
        skillTags: "Engineering · Platform",
        visibility: "Published",
        owners: "Platform L&D",
        updated: "Apr 8, 2026"
      }
    ],
    children: [
      {
        id: "cat-product-gtm",
        name: "GTM & positioning",
        slug: "product-gtm-positioning",
        description: "Demos, pricing narrative, and competitive intel for customer-facing teams.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
        ]
      }
    ]
  },
  ideas: {
    rootCourses: [],
    children: [
      {
        id: "cat-ideas-workshops",
        name: "Workshops & labs",
        slug: "ideas-workshops-labs",
        description: "Facilitated sprints, hackathons, and lightweight experiments.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
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
        ]
      }
    ]
  },
  leadership: {
    rootCourses: [],
    children: [
      {
        id: "cat-leadership-managers",
        name: "People manager fundamentals",
        slug: "leadership-manager-fundamentals",
        description: "Core habits for new and tenured people managers.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
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
        ]
      }
    ]
  },
  safety: {
    rootCourses: [],
    children: [
      {
        id: "cat-safety-field",
        name: "Field & site safety",
        slug: "safety-field-site",
        description: "OSHA-aligned refreshers for crews and anyone visiting job sites.",
        grouping: "Topic",
        visibility: "Admin only",
        children: [],
        courses: [
          {
            id: "crs-osha-ladder",
            title: "Ladder and lift safety refresher",
            skillTags: "Field · OSHA",
            visibility: "Draft",
            owners: "Facilities",
            updated: "Feb 22, 2026"
          }
        ]
      },
      {
        id: "cat-safety-office",
        name: "Office & ergonomics",
        slug: "safety-office-ergonomics",
        description: "Desk, posture, and injury prevention for office and hybrid workers.",
        grouping: "Topic",
        visibility: "Catalog",
        children: [],
        courses: [
          {
            id: "crs-ergo",
            title: "Office ergonomics and injury prevention",
            skillTags: "Workplace",
            visibility: "Published",
            owners: "Facilities",
            updated: "Jan 14, 2026"
          }
        ]
      }
    ]
  },
  sales: {
    rootCourses: [
      {
        id: "crs-quota-math",
        title: "Quota, coverage model, and forecast hygiene",
        skillTags: "Rev ops · Forecasting",
        visibility: "Published",
        owners: "Rev ops",
        updated: "Apr 4, 2026"
      }
    ],
    children: [
      {
        id: "cat-sales-sdr",
        name: "SDR & outbound",
        slug: "sales-sdr-outbound",
        description: "Sequences, cold outreach, and meeting-setting plays.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
          }
        ]
      },
      {
        id: "cat-sales-ae",
        name: "AE & discovery",
        slug: "sales-ae-discovery",
        description: "Discovery, talk tracks, qualification, and late-stage close hygiene.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
            id: "crs-mutual-close",
            title: "Mutual close plans and next-step accountability",
            skillTags: "Closing · Process",
            visibility: "Published",
            owners: "Rev enablement",
            updated: "Apr 10, 2026"
          }
        ]
      },
      {
        id: "cat-sales-enterprise",
        name: "Enterprise & procurement",
        slug: "sales-enterprise-procurement",
        description: "Multi-threaded pursuits, security reviews, and deal desk paperwork.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
          }
        ]
      },
      {
        id: "cat-sales-cs-partners",
        name: "Customer success & partners",
        slug: "sales-cs-partners",
        description: "Handoffs, expansion, and channel-led opportunities.",
        grouping: "Skill track",
        visibility: "Catalog",
        children: [],
        courses: [
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
      }
    ]
  }
};

export const DEFAULT_CATEGORY_WIREFRAME_ID = "cat-sales";

export const DEMO_CATEGORY_TREE: DemoCategoryNode[] = WIREFRAME_PRESET_COURSE_CATEGORIES.map((preset) => {
  const tree = PRESET_TREE[preset.id];
  return {
    id: `cat-${preset.id}`,
    name: preset.label,
    slug: preset.id,
    description: DESCRIPTIONS[preset.id],
    grouping: "Topic" as const,
    visibility: "Catalog" as const,
    children: tree.children,
    courses: tree.rootCourses
  };
});

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
