"use client";

import { type ReactElement, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AvatarTile } from "./avatar-tile";
import type { DemoLearnerRow } from "./demo-learners";
import styles from "./learners-wireframe.module.css";
import { markLearnerDeletedWireframe } from "./wireframe-deleted-learners";

type CommittedProfile = {
  organization: string;
  email: string;
  name: string;
};

type LearnerProfileWireframePanelProps = {
  initialLearner: DemoLearnerRow;
  initialEditing?: boolean;
};

export function LearnerProfileWireframePanel({
  initialLearner,
  initialEditing = false
}: LearnerProfileWireframePanelProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const formId = `learner-profile-form-${initialLearner.id}`;
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [committed, setCommitted] = useState<CommittedProfile>(() => ({
    organization: initialLearner.organization,
    email: initialLearner.email,
    name: initialLearner.name
  }));
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [draft, setDraft] = useState<CommittedProfile>(() => ({
    organization: initialLearner.organization,
    email: initialLearner.email,
    name: initialLearner.name
  }));
  const [passwordDraft, setPasswordDraft] = useState("");
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const display = isEditing ? draft : committed;

  useLayoutEffect(() => {
    if (!isEditing) {
      return;
    }
    firstFieldRef.current?.focus();
  }, [isEditing]);

  function startEdit(): void {
    setDraft(committed);
    setPasswordDraft("");
    setSaveBanner(null);
    router.push(`${pathname}?edit=1`);
  }

  function cancelEdit(): void {
    setIsEditing(false);
    setDraft(committed);
    setPasswordDraft("");
    router.replace(pathname);
  }

  function saveProfile(): void {
    setCommitted({
      organization: draft.organization.trim(),
      email: draft.email.trim(),
      name: draft.name.trim()
    });
    setIsEditing(false);
    setPasswordDraft("");
    setSaveBanner("Profile saved (wireframe — changes stay in this browser tab only).");
    router.replace(pathname);
  }

  function requestDeleteUser(): void {
    if (
      !window.confirm(
        "Delete this learner profile? They will be removed from the wireframe list for this browser tab and you will return to Learners."
      )
    ) {
      return;
    }
    markLearnerDeletedWireframe(initialLearner.id);
    router.push("/admin/learners-wireframe?deleted=1");
  }

  return (
    <>
      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Learner profile
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        <div className={styles.actionsRow}>
          {isEditing ? (
            <>
              <button
                type="submit"
                form={formId}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Save
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  cancelEdit();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  startEdit();
                }}
              >
                Edit profile
              </button>
              <Link
                href={`/admin/assignments-wireframe?learnerId=${encodeURIComponent(initialLearner.id)}`}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Course assignments
              </Link>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => {
                  requestDeleteUser();
                }}
              >
                Delete user
              </button>
            </>
          )}
        </div>
      </div>

      <form
        id={formId}
        className={styles.profilePageForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!event.currentTarget.reportValidity()) {
            return;
          }
          saveProfile();
        }}
      >
        {saveBanner ? (
          <p className={styles.profileSaveBanner} role="status">
            {saveBanner}
          </p>
        ) : null}

        <section className={styles.profileHero} aria-labelledby="learner-profile-heading">
          <h2 id="learner-profile-heading" className={styles.srOnly}>
            Summary
          </h2>
          <div className={styles.profileAvatar}>
            <AvatarTile seed={initialLearner.avatarId} />
          </div>
          <div className={styles.profileHeroText}>
            {isEditing ? (
              <div className={styles.profileHeroEditStack}>
                <div className={styles.profileHeroField}>
                  <label className={styles.profileHeroFieldLabel} htmlFor={`${formId}-name`}>
                    Name
                  </label>
                  <input
                    ref={firstFieldRef}
                    id={`${formId}-name`}
                    name="name"
                    className={styles.profileHeroInput}
                    value={draft.name}
                    required
                    autoComplete="name"
                    onChange={(event) => {
                      setDraft((previous) => ({ ...previous, name: event.target.value }));
                    }}
                  />
                </div>
                <div className={styles.profileHeroField}>
                  <label className={styles.profileHeroFieldLabel} htmlFor={`${formId}-organization`}>
                    Organization
                  </label>
                  <input
                    id={`${formId}-organization`}
                    name="organization"
                    type="text"
                    className={styles.profileHeroInput}
                    value={draft.organization}
                    required
                    autoComplete="organization"
                    onChange={(event) => {
                      setDraft((previous) => ({ ...previous, organization: event.target.value }));
                    }}
                  />
                </div>
                <div className={styles.profileHeroField}>
                  <label className={styles.profileHeroFieldLabel} htmlFor={`${formId}-email`}>
                    Email
                  </label>
                  <input
                    id={`${formId}-email`}
                    name="email"
                    type="email"
                    className={styles.profileHeroInput}
                    value={draft.email}
                    required
                    autoComplete="email"
                    onChange={(event) => {
                      setDraft((previous) => ({ ...previous, email: event.target.value }));
                    }}
                  />
                </div>
                <div className={styles.profileHeroField}>
                  <label className={styles.profileHeroFieldLabel} htmlFor={`${formId}-password`}>
                    Password
                  </label>
                  <input
                    id={`${formId}-password`}
                    name="password"
                    type="password"
                    className={styles.profileHeroInput}
                    value={passwordDraft}
                    autoComplete="new-password"
                    placeholder="Optional — wireframe only"
                    onChange={(event) => {
                      setPasswordDraft(event.target.value);
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className={styles.profileHeroName}>{display.name}</p>
                <p className={styles.profileHeroMeta}>{display.organization}</p>
                <p className={styles.profileHeroMeta}>{display.email}</p>
              </>
            )}
            <p className={styles.profileBadgeWrap}>
              <span
                className={
                  initialLearner.status === "activated"
                    ? `${styles.badge} ${styles.badgeActivated}`
                    : `${styles.badge} ${styles.badgePending}`
                }
              >
                {initialLearner.status === "activated" ? "Activated" : "Not activated"}
              </span>
            </p>
          </div>
        </section>

        <div className={styles.profileGrid}>
          <section className={styles.profileCard} aria-labelledby="learner-profile-details">
            <h2 id="learner-profile-details" className={styles.profileCardTitle}>
              Account
            </h2>
            {isEditing ? (
              <p className={styles.profileEditHint}>
                <span className={styles.muted}>
                  Edit name, organization, email, and password in the summary above.
                </span>
              </p>
            ) : null}
            <dl className={styles.profileDl}>
              {isEditing ? null : (
                <>
                  <div>
                    <dt className={styles.profileDt}>Organization</dt>
                    <dd className={styles.profileDd}>{committed.organization}</dd>
                  </div>
                  <div>
                    <dt className={styles.profileDt}>Email</dt>
                    <dd className={styles.profileDd}>{committed.email}</dd>
                  </div>
                  <div>
                    <dt className={styles.profileDt}>Name</dt>
                    <dd className={styles.profileDd}>{committed.name}</dd>
                  </div>
                  <div>
                    <dt className={styles.profileDt}>Password</dt>
                    <dd className={styles.profileDd}>
                      <span
                        className={styles.profilePassword}
                        aria-label="Password value not shown in wireframe"
                      >
                        ••••••••
                      </span>
                    </dd>
                  </div>
                </>
              )}
              <div>
                <dt className={styles.profileDt}>Role</dt>
                <dd className={styles.profileDd}>Learner</dd>
              </div>
              <div>
                <dt className={styles.profileDt}>Created</dt>
                <dd className={styles.profileDd}>{initialLearner.created}</dd>
              </div>
              <div>
                <dt className={styles.profileDt}>Last logged in</dt>
                <dd className={styles.profileDd}>{initialLearner.lastLoggedIn ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.profileCard} aria-labelledby="learner-profile-enrolments">
            <h2 id="learner-profile-enrolments" className={styles.profileCardTitle}>
              Enrolments
            </h2>
            <div className={styles.profilePlaceholder}>Placeholder: course list</div>
          </section>
        </div>
      </form>

      <p className={styles.caption}>
        Edit and save update this page only (no API). Password is not stored. Delete user removes this learner
        from the demo list in this tab (sessionStorage) and returns you to Learners. “Edit profile” and the
        learners list “Edit” action navigate to this page with ?edit=1 so edit mode is bookmarkable and
        refresh-safe.
      </p>
    </>
  );
}
