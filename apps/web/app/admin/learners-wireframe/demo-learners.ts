export type DemoLearnerRow = {
  id: string;
  name: string;
  organization: string;
  email: string;
  created: string;
  lastLoggedIn: string | null;
  status: "activated" | "pending";
  /** When true, list view seeds this learner as suspended until unsuspended in the wireframe tab. */
  suspended?: boolean;
  avatarId: number;
};

export const DEMO_LEARNERS: DemoLearnerRow[] = [
  {
    id: "1",
    name: "Alex Chen",
    organization: "Northern District Library",
    email: "learner.one@example.com",
    created: "Aug 6, 2024",
    lastLoggedIn: "Aug 12, 2024",
    status: "activated",
    avatarId: 1
  },
  {
    id: "2",
    name: "Jordan Smith",
    organization: "Harborview Compliance LLC",
    email: "learner.two@example.com",
    created: "Jul 22, 2024",
    lastLoggedIn: null,
    status: "pending",
    suspended: true,
    avatarId: 2
  },
  {
    id: "3",
    name: "Sam Rivera",
    organization: "Oakridge Academy Trust",
    email: "learner.three@example.com",
    created: "Jun 3, 2024",
    lastLoggedIn: "Jun 18, 2024",
    status: "activated",
    avatarId: 3
  },
  {
    id: "4",
    name: "Taylor Brooks",
    organization: "Westline Logistics",
    email: "learner.four@example.com",
    created: "May 18, 2024",
    lastLoggedIn: null,
    status: "pending",
    avatarId: 4
  }
];

export function getDemoLearner(id: string): DemoLearnerRow | undefined {
  return DEMO_LEARNERS.find((row) => row.id === id);
}
