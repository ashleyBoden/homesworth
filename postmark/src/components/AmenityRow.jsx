import styles from "./Amenity.module.css";
import { convertKmToMetres } from "../utils/distance";

export default function AmenityRow({ rowName, count, nearest }) {
  return (
    <div className={styles.mobileAmenitiesCard}>
      <p className={styles.amenityName}>{rowName}</p>

      {count > 0 ? (
        <>
          <p className={styles.amenityCount}>{count}</p>
          <p className={styles.closestAmenityName}>{nearest.name}</p>
          <p className={styles.closestAmenityDistance}>
            {convertKmToMetres(nearest.distance)}
          </p>
        </>
      ) : (
        <p className={styles.noAmenityFound}>
          No {rowName} have been found within 1 km.
        </p>
      )}
    </div>
  );
}
