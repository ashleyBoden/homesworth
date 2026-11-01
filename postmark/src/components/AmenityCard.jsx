import styles from "./Amenity.module.css";
import { convertKmToMetres } from "../utils/distance";

export default function AmenityCard({ cardName, count, icon, nearest }) {
  return (
    <div className={styles.smallCard}>
      <div className={styles.smallCardHeading}>
        <p className={styles.amenityName}>{cardName}</p>
        {icon}
      </div>
      <p className={styles.smallCardCount}>{count}</p>
      {count > 0 ? (
        <p
          className={styles.smallCardFooter}
        >{`${nearest.name} · ${convertKmToMetres(nearest.distance)}`}</p>
      ) : (
        <p className={styles.smallCardFooter}>No {cardName} found within 1km</p>
      )}
    </div>
  );
}
