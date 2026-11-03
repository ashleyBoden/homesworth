import styles from "./DetailCard.module.css";

function scorePillClass(score) {
  if (score == 0.0) return styles.scorePillLow;
  if (!score) return "";
  if (score >= 7) return styles.scorePillHigh;
  if (score >= 4) return styles.scorePillMid;
  return styles.scorePillLow;
}

function scoreDotClass(score) {
  if (score == 0.0) return styles.scoreDotLow;
  if (!score) return "";
  if (score >= 7) return styles.scoreDotHigh;
  if (score >= 4) return styles.scoreDotMid;
  return styles.scoreDotLow;
}

export default function DetailCard({
  cardTitle,
  cardSource,
  stats,
  score,
  children,
  isMobile,
  animate,
  isOpen,
  toggleOpen,
  summary,
  addStatsBorder,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={() => toggleOpen()}>
        <div>
          <p className={styles.cardTitle}>{cardTitle}</p>
          <p className={styles.cardSource}>{cardSource}</p>
        </div>
        <div className={`${styles.scorePill} ${scorePillClass(score)}`}>
          <span
            className={` ${styles.scoreDot} ${scoreDotClass(score)}`}
          ></span>
          <span>{score?.toFixed(1) ?? "-"}</span>
        </div>
      </div>

      {(!isMobile || isOpen) && (
        <>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: animate ? `${score * 10}%` : "0%",
              }}
            ></div>
          </div>

          {summary && <p className={styles.cardSummary}>{summary}</p>}

          <div
            className={`${styles.stats} ${addStatsBorder ? styles.statsWithBorder : ""}`}
          >
            {stats.map((stat) => (
              <div className={styles.stat} key={stat.label}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
            ))}
          </div>

          {children}
        </>
      )}
    </div>
  );
}
