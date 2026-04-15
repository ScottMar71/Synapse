"use client";

import type { FormEvent, ReactElement } from "react";
import Link from "next/link";
import { useState } from "react";

import styles from "../learners-wireframe.module.css";

export default function AddLearnersWireframePage(): ReactElement {
  const [emails, setEmails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className={styles.shell}>
      <Link href="/admin/learners-wireframe" className={styles.backLink}>
        ← Back to Learners
      </Link>

      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Add learners
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
      </div>

      {submitted ? (
        <p className={styles.csvFeedback} role="status">
          Invite queued (wireframe only — no email is sent and no learners are created).
        </p>
      ) : null}

      <form className={styles.profilePageForm} onSubmit={onSubmit}>
        <div className={styles.profileHero}>
          <div className={styles.profileHeroText}>
            <p className={styles.profileEditHint}>
              Enter one email per line. People receive an invite link and pick a name when they arrive.
            </p>
            <div className={styles.profileHeroEditStack}>
              <div className={styles.profileHeroField}>
                <label htmlFor="add-learners-emails" className={styles.profileHeroFieldLabel}>
                  Email addresses
                </label>
                <textarea
                  id="add-learners-emails"
                  className={styles.profileHeroInput}
                  rows={8}
                  value={emails}
                  onChange={(event) => {
                    setEmails(event.target.value);
                  }}
                  placeholder={"colleague@example.com\nnew.learner@example.org"}
                  autoComplete="off"
                />
              </div>
              <div className={styles.actionsRow}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Send invites
                </button>
                <Link href="/admin/learners-wireframe" className={`${styles.btn} ${styles.btnSecondary}`}>
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      <p className={styles.caption}>
        Static wireframe: “Send invites” shows a confirmation banner only — no network requests. The list on the main
        wireframe page is unchanged.
      </p>
    </main>
  );
}
