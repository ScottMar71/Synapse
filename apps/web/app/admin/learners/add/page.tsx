"use client";

import type { FormEvent, ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  formatTenantAdminError,
  postProvisionLearner,
  probeAdminRoute,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { getSession } from "../../../../lib/lms-session";
import { AdminLoading, AdminSignInRequired } from "../../admin-page-states";
import styles from "../../admin-learners-shell.module.css";

const EMAIL_EMPTY = "Enter an email address.";
const EMAIL_INVALID = "Enter a valid email address.";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AddLearnerPage(): ReactElement {
  const router = useRouter();
  const [session, setSession] = useState<LmsApiSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (!s) {
      setLoading(false);
      return;
    }
    void (async () => {
      const admin = await probeAdminRoute(s);
      setIsAdmin(admin);
      setLoading(false);
    })();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);
    if (!session || !isAdmin) {
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length === 0) {
      setFieldError(EMAIL_EMPTY);
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFieldError(EMAIL_INVALID);
      return;
    }
    setSubmitting(true);
    const res = await postProvisionLearner(session, {
      email: trimmedEmail,
      displayName: displayName.trim().length > 0 ? displayName.trim() : undefined
    });
    if (!res.ok) {
      setSubmitError(formatTenantAdminError(res.error));
      setSubmitting(false);
      return;
    }
    router.push("/admin/learners?provisioned=1");
  }

  if (!session && !loading) {
    return <AdminSignInRequired context="add learners (tenant admins only)" />;
  }

  if (loading) {
    return <AdminLoading label="Loading…" />;
  }

  if (!isAdmin) {
    return (
      <div className={styles.shell}>
        <Link href="/admin/learners" className={styles.backLink}>
          ← Back to Learners
        </Link>
        <h1 className={styles.titleRow}>Add learner</h1>
        <p role="status">
          Only tenant <strong>admins</strong> can create learner accounts. Instructors can view the directory but
          cannot add learners.
        </p>
        <p>
          <Link href="/admin/learners" className={`${styles.btn} ${styles.btnSecondary}`}>
            Back to directory
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Link href="/admin/learners" className={styles.backLink}>
        ← Back to Learners
      </Link>

      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Add learner
          <span className={styles.staffTag} style={{ opacity: 0.85 }}>
            Admin
          </span>
        </h1>
      </div>

      <p className={styles.profileEditHint} style={{ marginBottom: "var(--space-4)" }}>
        Email is the tenant-scoped login identifier. No invitation email is sent in this release; the person can sign
        in once their account exists.
      </p>

      <form className={styles.profilePageForm} onSubmit={(e) => void onSubmit(e)}>
        <div className={styles.profileHero}>
          <div className={styles.profileHeroText}>
            <div className={styles.profileHeroEditStack}>
              <div className={styles.profileHeroField}>
                <label htmlFor="add-learner-email" className={styles.profileHeroFieldLabel}>
                  Email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="add-learner-email"
                  type="email"
                  className={styles.profileHeroInput}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="colleague@example.com"
                />
                {fieldError ? (
                  <p id="add-learner-email-error" role="alert" style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem", color: "#b42318" }}>
                    {fieldError}
                  </p>
                ) : null}
              </div>
              <div className={styles.profileHeroField}>
                <label htmlFor="add-learner-display-name" className={styles.profileHeroFieldLabel}>
                  Display name <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
                </label>
                <input
                  id="add-learner-display-name"
                  type="text"
                  className={styles.profileHeroInput}
                  autoComplete="name"
                  maxLength={200}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                  }}
                  placeholder="Alex Rivera"
                />
              </div>
              {submitError ? (
                <p role="alert" style={{ margin: 0, fontSize: "0.875rem", color: "#b42318" }}>
                  {submitError}
                </p>
              ) : null}
              <div className={styles.actionsRow}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Create learner"}
                </button>
                <Link href="/admin/learners" className={`${styles.btn} ${styles.btnSecondary}`}>
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
