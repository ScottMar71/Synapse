"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AvatarTile } from "../avatar-tile";
import type { DemoLearnerRow } from "../demo-learners";
import styles from "../learners-wireframe.module.css";
import { getDeletedLearnerIds } from "../wireframe-deleted-learners";
import { getSuspendedLearnerIds } from "../wireframe-suspended-learners";

type LearnerProfileWireframeProps = {
  learner: DemoLearnerRow;
  initialEdit: boolean;
};

export function LearnerProfileWireframe({
  learner,
  initialEdit
}: LearnerProfileWireframeProps): ReactElement {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEdit);
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [saved, setSaved] = useState({
    name: learner.name,
    email: learner.email,
    organization: learner.organization
  });
  const [draftName, setDraftName] = useState(learner.name);
  const [draftEmail, setDraftEmail] = useState(learner.email);
  const [draftOrg, setDraftOrg] = useState(learner.organization);

  useEffect(() => {
    setRemoved(getDeletedLearnerIds().includes(learner.id));
    setSuspended(getSuspendedLearnerIds().includes(learner.id));
  }, [learner.id]);

  useEffect(() => {
    const next = {
      name: learner.name,
      email: learner.email,
      organization: learner.organization
    };
    setSaved(next);
    setDraftName(next.name);
    setDraftEmail(next.email);
    setDraftOrg(next.organization);
  }, [learner.email, learner.id, learner.name, learner.organization]);

  if (removed) {
    return (
      <main className={styles.shell}>
        <Link href="/admin/learners-wireframe" className={styles.backLink}>
          ← Back to Learners
        </Link>
        <p className={styles.csvFeedback} role="status">
          This learner was removed from the wireframe demo list in this browser tab. Return to the list or open a
          private window to use demo profile URLs again.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <Link href="/admin/learners-wireframe" className={styles.backLink}>
        ← Back to Learners
      </Link>

      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Learner profile
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        <div className={styles.actionsRow}>
          {isEditing ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setIsEditing(false);
                setDraftName(saved.name);
                setDraftEmail(saved.email);
                setDraftOrg(saved.organization);
                router.replace(`/admin/learners-wireframe/${learner.id}`, { scroll: false });
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setDraftName(saved.name);
                setDraftEmail(saved.email);
                setDraftOrg(saved.organization);
                setIsEditing(true);
                router.replace(`/admin/learners-wireframe/${learner.id}?edit=1`, { scroll: false });
              }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {showSaveBanner ? (
        <p className={styles.profileSaveBanner} role="status">
          Saved (wireframe only — nothing persisted).
        </p>
      ) : null}

      <form
        className={styles.profilePageForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!isEditing) {
            return;
          }
          const next = {
            name: draftName,
            email: draftEmail,
            organization: draftOrg
          };
          setSaved(next);
          setShowSaveBanner(true);
          setIsEditing(false);
          router.replace(`/admin/learners-wireframe/${learner.id}`, { scroll: false });
        }}
      >
        <div className={styles.profileHero}>
          <div className={styles.profileAvatar}>
            <AvatarTile seed={learner.avatarId} size={64} />
          </div>
          <div className={styles.profileHeroText}>
            {isEditing ? (
              <>
                <p className={styles.profileEditHint}>Update placeholder fields. Wireframe only — no API calls.</p>
                <div className={styles.profileHeroEditStack}>
                  <div className={styles.profileHeroField}>
                    <label htmlFor="wireframe-learner-name" className={styles.profileHeroFieldLabel}>
                      Name
                    </label>
                    <input
                      id="wireframe-learner-name"
                      className={styles.profileHeroInput}
                      value={draftName}
                      onChange={(event) => {
                        setDraftName(event.target.value);
                      }}
                      autoComplete="name"
                    />
                  </div>
                  <div className={styles.profileHeroField}>
                    <label htmlFor="wireframe-learner-org" className={styles.profileHeroFieldLabel}>
                      Organization
                    </label>
                    <input
                      id="wireframe-learner-org"
                      className={styles.profileHeroInput}
                      value={draftOrg}
                      onChange={(event) => {
                        setDraftOrg(event.target.value);
                      }}
                      autoComplete="organization"
                    />
                  </div>
                  <div className={styles.profileHeroField}>
                    <label htmlFor="wireframe-learner-email" className={styles.profileHeroFieldLabel}>
                      Email
                    </label>
                    <input
                      id="wireframe-learner-email"
                      type="email"
                      className={styles.profileHeroInput}
                      value={draftEmail}
                      onChange={(event) => {
                        setDraftEmail(event.target.value);
                      }}
                      autoComplete="email"
                    />
                  </div>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.profileHeroName}>{saved.name}</h2>
                <p className={styles.profileHeroMeta}>{saved.organization}</p>
                <p className={styles.profileEmail}>
                  <Link href={`mailto:${saved.email}`} className={styles.emailLink}>
                    {saved.email}
                  </Link>
                </p>
                <div className={styles.profileBadgeWrap}>
                  {suspended ? (
                    <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspended</span>
                  ) : learner.status === "activated" ? (
                    <span className={`${styles.badge} ${styles.badgeActivated}`}>Activated</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgePending}`}>Not activated</span>
                  )}
                  <span className={`${styles.badge} ${styles.badgePending}`} style={{ marginLeft: "var(--space-2)" }}>
                    Learner
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </form>

      {!isEditing ? (
        <div className={styles.profileGrid}>
          <section className={styles.profileCard}>
            <h3 className={styles.profileCardTitle}>Account</h3>
            <dl className={styles.profileDl}>
              <div>
                <dt className={styles.profileDt}>Created</dt>
                <dd className={styles.profileDd}>{learner.created}</dd>
              </div>
              <div>
                <dt className={styles.profileDt}>Last logged in</dt>
                <dd className={styles.profileDd}>{learner.lastLoggedIn ?? "—"}</dd>
              </div>
              <div>
                <dt className={styles.profileDt}>Role</dt>
                <dd className={styles.profileDd}>Learner</dd>
              </div>
            </dl>
          </section>
          <section className={styles.profileCard}>
            <h3 className={styles.profileCardTitle}>Security</h3>
            <dl className={styles.profileDl}>
              <div>
                <dt className={styles.profileDt}>Password</dt>
                <dd className={`${styles.profileDd} ${styles.profilePassword}`}>••••••••</dd>
              </div>
            </dl>
            <div className={styles.profilePlaceholder}>Password reset and SSO controls would live here.</div>
          </section>
        </div>
      ) : null}

      <p className={styles.caption}>
        Wireframe demo: profile URL matches row actions “View profile” / “Edit”; deleting a learner from the list
        invalidates this URL for this tab; suspension state follows the list wireframe session storage.
      </p>
    </main>
  );
}
