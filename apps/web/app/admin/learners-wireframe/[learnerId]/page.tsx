"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { FormEvent, ReactElement } from "react";
import { Suspense, useEffect, useState } from "react";

import { AvatarTile } from "../avatar-tile";
import { getDemoLearner } from "../demo-learners";
import styles from "../learners-wireframe.module.css";
import { getDeletedLearnerIds } from "../wireframe-deleted-learners";
import { getSuspendedLearnerIds } from "../wireframe-suspended-learners";

function LearnerWireframeProfileContent(): ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const learnerId = typeof params.learnerId === "string" ? params.learnerId : "";
  const isEdit = searchParams.get("edit") === "1";

  const [ready, setReady] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const row = learnerId ? getDemoLearner(learnerId) : undefined;

  useEffect(() => {
    if (!learnerId) {
      setReady(true);
      return;
    }
    setIsDeleted(getDeletedLearnerIds().includes(learnerId));
    setIsSuspended(getSuspendedLearnerIds().includes(learnerId));
    setReady(true);
  }, [learnerId]);

  if (!ready) {
    return (
      <main className={styles.shell}>
        <p className={styles.profilePlaceholder}>Loading…</p>
      </main>
    );
  }

  if (!learnerId || !row) {
    return (
      <main className={styles.shell}>
        <Link href="/admin/learners-wireframe" className={styles.backLink}>
          ← Back to Learners
        </Link>
        <p className={styles.profilePlaceholder}>No learner found for this link.</p>
        <p className={styles.caption}>
          Wireframe demo: profile URLs only work for demo rows on the learners list (ids 1–4).
        </p>
      </main>
    );
  }

  if (isDeleted) {
    return (
      <main className={styles.shell}>
        <Link href="/admin/learners-wireframe" className={styles.backLink}>
          ← Back to Learners
        </Link>
        <p className={styles.profilePlaceholder}>
          This learner was removed from the wireframe list in this browser tab. Open the list again or clear site
          data to reset the demo.
        </p>
      </main>
    );
  }

  const statusLabel = isSuspended
    ? "Wireframe: suspended"
    : row.status === "activated"
      ? "Activated"
      : "Not activated";

  const statusClass = isSuspended
    ? `${styles.badge} ${styles.badgeSuspended}`
    : row.status === "activated"
      ? `${styles.badge} ${styles.badgeActivated}`
      : `${styles.badge} ${styles.badgePending}`;

  function onSaveEdit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSavedBanner(true);
  }

  return (
    <main className={styles.shell}>
      <Link href="/admin/learners-wireframe" className={styles.backLink}>
        ← Back to Learners
      </Link>

      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          {isEdit ? "Edit learner" : "Learner profile"}
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        {!isEdit ? (
          <div className={styles.actionsRow}>
            <Link
              href={`/admin/learners-wireframe/${learnerId}?edit=1`}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Edit
            </Link>
          </div>
        ) : null}
      </div>

      {savedBanner ? (
        <p className={styles.profileSaveBanner} role="status">
          Changes saved (wireframe only — nothing is stored).
        </p>
      ) : null}

      {isEdit ? (
        <form className={styles.profilePageForm} onSubmit={onSaveEdit}>
          <div className={styles.profileHero}>
            <div className={styles.profileAvatar}>
              <AvatarTile seed={row.avatarId} className={styles.avatar} />
            </div>
            <div className={styles.profileHeroText}>
              <p className={styles.profileEditHint}>Update display details for this learner (demo only).</p>
              <div className={styles.profileHeroEditStack}>
                <div className={styles.profileHeroField}>
                  <label htmlFor="wireframe-learner-name" className={styles.profileHeroFieldLabel}>
                    Name
                  </label>
                  <input
                    id="wireframe-learner-name"
                    className={styles.profileHeroInput}
                    defaultValue={row.name}
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
                    defaultValue={row.organization}
                    autoComplete="organization"
                  />
                </div>
                <div className={styles.actionsRow}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Save
                  </button>
                  <Link href={`/admin/learners-wireframe/${learnerId}`} className={`${styles.btn} ${styles.btnSecondary}`}>
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className={styles.profileHero}>
          <div className={styles.profileAvatar}>
            <AvatarTile seed={row.avatarId} className={styles.avatar} />
          </div>
          <div className={styles.profileHeroText}>
            <h2 className={styles.profileHeroName}>{row.name}</h2>
            <p className={styles.profileHeroMeta}>{row.organization}</p>
            <p className={styles.profileEmail}>
              <Link href={`mailto:${row.email}`} className={styles.emailLink}>
                {row.email}
              </Link>
            </p>
            <div className={styles.profileBadgeWrap}>
              <span className={statusClass}>{statusLabel}</span>
            </div>
          </div>
        </div>
      )}

      {!isEdit ? (
        <div className={styles.profileGrid}>
          <section className={styles.profileCard}>
            <h3 className={styles.profileCardTitle}>Account</h3>
            <dl className={styles.profileDl}>
              <div>
                <dt className={styles.profileDt}>Created</dt>
                <dd className={styles.profileDd}>{row.created}</dd>
              </div>
              <div>
                <dt className={styles.profileDt}>Last logged in</dt>
                <dd className={styles.profileDd}>{row.lastLoggedIn ?? "—"}</dd>
              </div>
            </dl>
          </section>
          <section className={styles.profileCard}>
            <h3 className={styles.profileCardTitle}>Access</h3>
            <div className={styles.profilePlaceholder}>Wireframe placeholder — SSO, roles, and groups would go here.</div>
          </section>
        </div>
      ) : null}

      <p className={styles.caption}>
        Static wireframe: profile and edit views do not persist changes except the “saved” banner after Save on
        edit. Suspended state matches the list (session storage).
      </p>
    </main>
  );
}

export default function LearnerWireframeProfilePage(): ReactElement {
  return (
    <Suspense
      fallback={
        <main className={styles.shell}>
          <p className={styles.profilePlaceholder}>Loading…</p>
        </main>
      }
    >
      <LearnerWireframeProfileContent />
    </Suspense>
  );
}
