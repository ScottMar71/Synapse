"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactElement } from "react";

import type { LmsPlatformContract } from "@conductor/contracts";

import { LearningTimeAssistant } from "../components/LearningTimeAssistant";

const runtimeContract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id",
  dataResidencyRegion: "eu-west-1"
};

const roleViews = [
  "Learner",
  "Manager",
  "Coach",
  "Admin"
] as const;

type RoleView = (typeof roleViews)[number];
type Audience = "Employees" | "Clients" | "Partners" | "Community";

const audiences: Audience[] = [
  "Employees",
  "Clients",
  "Partners",
  "Community"
];

const portalsByAudience: Record<Audience, string[]> = {
  Employees: ["Internal HQ", "Regional Ops"],
  Clients: ["ACME Client", "Contoso Client"],
  Partners: ["Enablement Hub", "Reseller Academy"],
  Community: ["Public Community", "Expert Circle"]
};

type NavIconName = "home" | "discover" | "learning" | "skills" | "community" | "reports" | "admin";

const navItems: ReadonlyArray<{ label: string; icon: NavIconName }> = [
  { label: "Home", icon: "home" },
  { label: "Discover", icon: "discover" },
  { label: "My Learning", icon: "learning" },
  { label: "Skills", icon: "skills" },
  { label: "Community", icon: "community" },
  { label: "Reports", icon: "reports" },
  { label: "Admin", icon: "admin" }
];

function NavIcon({ icon }: { icon: NavIconName }): ReactElement {
  if (icon === "home") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <path d="M2 7.5L8 2.5L14 7.5" />
        <path d="M4 7.5V13.5H12V7.5" />
      </svg>
    );
  }

  if (icon === "discover") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" />
      </svg>
    );
  }

  if (icon === "learning") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <path d="M2.5 3.5H7.5V12.5H2.5Z" />
        <path d="M8.5 3.5H13.5V12.5H8.5Z" />
      </svg>
    );
  }

  if (icon === "skills") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <circle cx="5" cy="5" r="2" />
        <circle cx="11" cy="5" r="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M6.5 6.5L7.2 9.3" />
        <path d="M9.5 6.5L8.8 9.3" />
      </svg>
    );
  }

  if (icon === "community") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <circle cx="5" cy="6" r="2" />
        <circle cx="11" cy="6" r="2" />
        <path d="M2.5 12C2.8 10.4 4 9.5 5.5 9.5C7 9.5 8.2 10.4 8.5 12" />
        <path d="M7.5 12C7.8 10.4 9 9.5 10.5 9.5C12 9.5 13.2 10.4 13.5 12" />
      </svg>
    );
  }

  if (icon === "reports") {
    return (
      <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
        <path d="M2.5 13.5H13.5" />
        <path d="M4.5 12V8.5" />
        <path d="M8 12V5.5" />
        <path d="M11.5 12V7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" style={styles.navSvg} aria-hidden="true">
      <circle cx="8" cy="8" r="2.3" />
      <path d="M8 2.2V4" />
      <path d="M8 12V13.8" />
      <path d="M2.2 8H4" />
      <path d="M12 8H13.8" />
      <path d="M3.8 3.8L5 5" />
      <path d="M11 11L12.2 12.2" />
      <path d="M11 5L12.2 3.8" />
      <path d="M3.8 12.2L5 11" />
    </svg>
  );
}

function ClockIndicator({ minutesLeft }: { minutesLeft: number }): ReactElement {
  return (
    <span style={styles.clockWrap}>
      <span style={styles.clockIcon} aria-hidden="true">
        <span style={styles.clockHandShort} />
        <span style={styles.clockHandLong} />
      </span>
      <span style={styles.body}>{minutesLeft} min left</span>
    </span>
  );
}

function ProgressRow({ label, percent, delta }: { label: string; percent: number; delta: string }): ReactElement {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div style={styles.progressRow}>
      <div style={styles.progressLabelRow}>
        <span style={styles.progressCircleWrap} aria-hidden="true">
          <svg viewBox="0 0 36 36" style={styles.progressCircleSvg}>
            <circle cx="18" cy="18" r={radius} style={styles.progressCircleTrack} />
            <circle
              cx="18"
              cy="18"
              r={radius}
              style={styles.progressCircleFill}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span style={styles.progressCircleText}>{percent}%</span>
        </span>
        <div style={styles.progressMeta}>
          <span style={styles.body}>{label}</span>
          <span style={styles.muted}>{delta}</span>
        </div>
      </div>
    </div>
  );
}

function renderRoleWireframe(role: RoleView, audience: Audience, portal: string): ReactElement {
  if (role === "Learner") {
    return (
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Learner Home</h2>
        <p style={styles.muted}>
          Audience: {audience} | Portal: {portal}
        </p>
        <div style={styles.gridTwo}>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Continue Learning</h3>
            <p style={styles.body}>Difficult conversation simulation</p>
            <ClockIndicator minutesLeft={12} />
            <p style={styles.muted}>Why now: manager feedback flagged coaching gaps</p>
            <div style={styles.inlineActions}>
              <span style={styles.chip}>Resume</span>
              <span style={styles.chip}>Ask AI Coach</span>
            </div>
          </article>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Skills Progress</h3>
            <ProgressRow label="Leadership" percent={62} delta="+4 this month" />
            <ProgressRow label="Communication" percent={71} delta="stable" />
          </article>
        </div>
        <LearningTimeAssistant />
      </section>
    );
  }

  if (role === "Manager") {
    return (
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Manager Dashboard</h2>
        <p style={styles.muted}>
          Audience: {audience} | Portal: {portal}
        </p>
        <div style={styles.gridThree}>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Skill Gap Heatmap</h3>
            <p style={styles.body}>Grid by skill and team member</p>
          </article>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>At-Risk Learners</h3>
            <p style={styles.body}>Learner alerts ranked by risk score</p>
            <ClockIndicator minutesLeft={5} />
          </article>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Suggested Actions</h3>
            <p style={styles.body}>Recommend learning, nudge, or coach</p>
          </article>
        </div>
        <article style={styles.block}>
          <h3 style={styles.blockTitle}>Impact Panel</h3>
          <p style={styles.body}>Negotiation path correlates with +12% close rate</p>
          <p style={styles.body}>Onboarding learning reduced escalations by 8%</p>
        </article>
      </section>
    );
  }

  if (role === "Coach") {
    return (
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Coach Workspace</h2>
        <p style={styles.muted}>
          Audience: {audience} | Portal: {portal}
        </p>
        <div style={styles.gridTwo}>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Coach Inbox</h3>
            <p style={styles.body}>18 alerts</p>
            <p style={styles.body}>Low progression, failed simulation, confidence drop</p>
          </article>
          <article style={styles.block}>
            <h3 style={styles.blockTitle}>Learner Detail</h3>
            <p style={styles.body}>Current goals and friction points</p>
            <ProgressRow label="Confidence" percent={48} delta="-6 this week" />
            <p style={styles.body}>AI coaching script with follow-up actions</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.cardTitle}>Admin / White-Label Console</h2>
      <p style={styles.muted}>
        Managing audience: {audience} | Active portal: {portal}
      </p>
      <div style={styles.inlineActions}>
        <span style={styles.chip}>Branding</span>
        <span style={styles.chip}>Audience Rules</span>
        <span style={styles.chip}>Roles & Permissions</span>
        <span style={styles.chip}>Content Visibility</span>
      </div>
      <div style={styles.gridTwo}>
        <article style={styles.block}>
          <h3 style={styles.blockTitle}>Branding Controls</h3>
          <p style={styles.body}>Logo upload, token colors, typography preset, URL slug</p>
          <p style={styles.muted}>AA contrast checks run on brand color choices</p>
        </article>
        <article style={styles.block}>
          <h3 style={styles.blockTitle}>Audience Rules</h3>
          <p style={styles.body}>Employees, clients, partners, community toggles</p>
          <p style={styles.body}>Default landing and module visibility per audience</p>
        </article>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    backgroundColor: "#f6f8fb",
    color: "#0a2545",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    padding: "24px"
  },
  shell: {
    backgroundColor: "#ffffff",
    border: "1px solid #d7e0ea",
    borderRadius: "12px",
    maxWidth: "1100px",
    margin: "0 auto",
    overflow: "hidden"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#0a2545",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    minHeight: "78px",
    padding: "16px 18px"
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "10px",
    fontWeight: 700
  },
  brandDot: {
    backgroundColor: "#e7910f",
    borderRadius: "50%",
    display: "inline-block",
    height: "10px",
    width: "10px"
  },
  brandLogo: {
    display: "block",
    height: "46px",
    objectFit: "contain",
    width: "260px"
  },
  topActions: {
    alignItems: "center",
    display: "flex",
    gap: "10px"
  },
  utilityBar: {
    backgroundColor: "#eef3f9",
    borderBottom: "1px solid #d7e0ea",
    color: "#304a66",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px 16px"
  },
  navBar: {
    borderBottom: "1px solid #d7e0ea",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px 16px"
  },
  navItemButton: {
    alignItems: "center",
    backgroundColor: "#f2f5f9",
    border: "1px solid #cad6e3",
    borderRadius: "999px",
    color: "#304a66",
    cursor: "pointer",
    display: "inline-flex",
    gap: "6px",
    padding: "6px 10px"
  },
  navIcon: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: "50%",
    display: "inline-flex",
    color: "#6AA84F",
    height: "18px",
    justifyContent: "center",
    width: "18px"
  },
  navSvg: {
    fill: "none",
    height: "16px",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.5,
    width: "16px"
  },
  roleSection: {
    display: "grid",
    gap: "12px",
    padding: "16px"
  },
  roleTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  roleTitle: {
    fontSize: "20px",
    margin: "6px 0 0"
  },
  card: {
    border: "1px dashed #c6d3e2",
    borderRadius: "10px",
    display: "grid",
    gap: "12px",
    padding: "14px"
  },
  cardTitle: {
    fontSize: "17px",
    margin: 0
  },
  gridTwo: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  gridThree: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
  },
  block: {
    backgroundColor: "#fbfdff",
    border: "1px solid #d7e0ea",
    borderRadius: "8px",
    display: "grid",
    gap: "8px",
    padding: "12px"
  },
  blockTitle: {
    fontSize: "15px",
    margin: 0
  },
  body: {
    margin: 0
  },
  muted: {
    color: "#526b86",
    margin: 0
  },
  inlineActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  chip: {
    backgroundColor: "#0a2545",
    borderRadius: "999px",
    color: "#ffffff",
    fontSize: "12px",
    padding: "4px 10px"
  },
  chipAlt: {
    backgroundColor: "#f2f5f9",
    border: "1px solid #cad6e3",
    borderRadius: "999px",
    color: "#304a66",
    fontSize: "12px",
    padding: "4px 10px"
  },
  chipActive: {
    backgroundColor: "#e7910f",
    borderRadius: "999px",
    color: "#0a2545",
    fontSize: "12px",
    fontWeight: 700,
    padding: "4px 10px"
  },
  profileUploadLabel: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    gap: "8px"
  },
  profileCircle: {
    alignItems: "center",
    backgroundColor: "#e7910f",
    border: "2px solid #ffffff",
    borderRadius: "50%",
    color: "#0a2545",
    display: "inline-flex",
    fontSize: "12px",
    fontWeight: 700,
    height: "28px",
    justifyContent: "center",
    width: "28px"
  },
  fileInputHidden: {
    display: "none"
  },
  clockWrap: {
    alignItems: "center",
    display: "inline-flex",
    gap: "8px"
  },
  clockIcon: {
    backgroundColor: "#ffffff",
    border: "2px solid #0a2545",
    borderRadius: "50%",
    display: "inline-flex",
    height: "18px",
    position: "relative",
    width: "18px"
  },
  clockHandShort: {
    backgroundColor: "#0a2545",
    height: "5px",
    left: "8px",
    position: "absolute",
    top: "4px",
    transform: "rotate(0deg)",
    transformOrigin: "bottom center",
    width: "2px"
  },
  clockHandLong: {
    backgroundColor: "#0a2545",
    height: "6px",
    left: "8px",
    position: "absolute",
    top: "6px",
    transform: "rotate(60deg)",
    transformOrigin: "top center",
    width: "2px"
  },
  progressRow: {
    display: "grid",
    gap: "6px"
  },
  progressLabelRow: {
    alignItems: "center",
    display: "flex",
    gap: "10px"
  },
  progressMeta: {
    display: "grid",
    gap: "2px"
  },
  progressCircleWrap: {
    display: "inline-flex",
    height: "36px",
    position: "relative",
    width: "36px"
  },
  progressCircleSvg: {
    height: "36px",
    transform: "rotate(-90deg)",
    width: "36px"
  },
  progressCircleTrack: {
    fill: "none",
    stroke: "#e3ebf4",
    strokeWidth: 4
  },
  progressCircleFill: {
    fill: "none",
    stroke: "#6AA84F",
    strokeLinecap: "round",
    strokeWidth: 4
  },
  progressCircleText: {
    alignItems: "center",
    color: "#0a2545",
    display: "inline-flex",
    fontSize: "9px",
    fontWeight: 700,
    height: "36px",
    inset: 0,
    justifyContent: "center",
    position: "absolute",
    width: "36px"
  },
  select: {
    backgroundColor: "#ffffff",
    border: "1px solid #cad6e3",
    borderRadius: "8px",
    color: "#304a66",
    fontSize: "13px",
    padding: "6px 10px"
  },
  tabButton: {
    backgroundColor: "#f2f5f9",
    border: "1px solid #cad6e3",
    borderRadius: "999px",
    color: "#304a66",
    cursor: "pointer",
    fontSize: "12px",
    padding: "6px 12px"
  },
  tabButtonActive: {
    backgroundColor: "#e7910f",
    border: "1px solid #e7910f",
    borderRadius: "999px",
    color: "#0a2545",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 12px"
  },
  footer: {
    borderTop: "1px solid #d7e0ea",
    color: "#526b86",
    fontSize: "13px",
    padding: "12px 16px"
  }
};

export default function HomePage(): ReactElement {
  const [activeRole, setActiveRole] = useState<RoleView>("Learner");
  const [audience, setAudience] = useState<Audience>("Employees");
  const portalOptions = useMemo(() => portalsByAudience[audience], [audience]);
  const [portal, setPortal] = useState<string>(portalOptions[0]);
  const [profilePhotoName, setProfilePhotoName] = useState<string>("Upload photo");

  function onAudienceChange(nextAudience: Audience): void {
    setAudience(nextAudience);
    setPortal(portalsByAudience[nextAudience][0]);
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.topBar}>
          <div style={styles.brand}>
            <img src="/api/draft-logo" alt="Synapse logo draft" style={styles.brandLogo} />
          </div>
          <div style={styles.topActions}>
            <span style={styles.chip}>Search</span>
            <span style={styles.chip}>Notifications</span>
            <label style={styles.profileUploadLabel}>
              <span style={styles.profileCircle}>UP</span>
              <span style={styles.chip}>{profilePhotoName}</span>
              <input
                type="file"
                accept="image/*"
                style={styles.fileInputHidden}
                onChange={(event) => {
                  const fileName = event.target.files?.[0]?.name;
                  setProfilePhotoName(fileName ?? "Upload photo");
                }}
              />
            </label>
          </div>
        </header>

        <section style={styles.utilityBar}>
          <label>
            <span style={styles.chipAlt}>Audience</span>{" "}
            <select
              style={styles.select}
              value={audience}
              onChange={(event) => onAudienceChange(event.target.value as Audience)}
            >
              {audiences.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span style={styles.chipAlt}>Portal</span>{" "}
            <select
              style={styles.select}
              value={portal}
              onChange={(event) => setPortal(event.target.value)}
            >
              {portalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <span style={styles.chipAlt}>Role: {activeRole.toLowerCase()}</span>
          <span style={styles.chipAlt}>White-label: tokenized theme enabled</span>
        </section>

        <nav style={styles.navBar}>
          {navItems.map((item) => (
            <button key={item.label} type="button" style={styles.navItemButton}>
              <span style={styles.navIcon} aria-hidden="true">
                <NavIcon icon={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <section style={styles.roleSection}>
          <h1 style={styles.roleTitle}>Draft Wireframes in Browser View</h1>
          <div style={styles.roleTabs}>
            {roleViews.map((role) => (
              <button
                key={role}
                type="button"
                style={role === activeRole ? styles.tabButtonActive : styles.tabButton}
                onClick={() => setActiveRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
          {renderRoleWireframe(activeRole, audience, portal)}
        </section>

        <footer style={styles.footer}>
          API base: {runtimeContract.apiBasePath} | Protected path: /protected
        </footer>
      </div>
    </main>
  );
}
