import { Link, useLocation } from "react-router-dom";
import styles from "./Results.module.css";
import { useEffect, useState } from "react";
import { calculateScores } from "../utils/scoring";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { OverpassAPI } from "../api/OverpassAPI";
import {
  School,
  Dumbbell,
  ShoppingCart,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import {
  findNearestCity,
  findNearestAmenity,
  distanceMiles,
} from "../utils/distance";
import {
  getPriceSummary,
  getLast5Years,
  housePriceData,
} from "../utils/prices";
import {
  formatCategory,
  formatMonth,
  formatPostcode,
} from "../utils/formatting";
import { processCrimeData } from "../utils/crime";
import { maxDeprivationRank } from "../constants/maxDeprivationRank";
import { getPostcodeData } from "../api/postcodeAPI";
import { getCrimeData } from "../api/crimeAPI";
import { getLandRegistryData } from "../api/landRegistry";
import DetailCard from "../DetailCard/DetailCard";
import { deprivationDescription } from "../constants/deprivationDescription";

const years = getLast5Years();

export default function Results({ criteria }) {
  const location = useLocation();
  const { postcode } = location.state;
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);

  const [priceData, setPriceData] = useState(null);
  const housePriceStats = priceData ? housePriceData(priceData) : null;
  const {
    currentPrice,
    priceChange,
    vsUKAverage,
    vsUKAverageFormatted,
    mostCommonType,
    priceChartData,
  } = housePriceStats || {};

  const [crimeData, setCrimeData] = useState(null);
  const crimeStats = crimeData ? processCrimeData(crimeData) : null;
  const { total, mostCommonCategory } = crimeStats || {}; //Crime data

  const [commuteData, setCommuteData] = useState(null);
  const [showPriceTrend, setShowPriceTrend] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [openCard, setOpenCard] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [overpassData, setOverpassData] = useState(null);
  const [overpassApiFailed, setOverpassApiFailed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const postcodeData = await getPostcodeData(postcode);
        setLocationData(postcodeData);
        const locality = postcodeData.result.admin_ward.toUpperCase();
        const { latitude, longitude } = postcodeData.result;
        const nearestCity = findNearestCity(latitude, longitude);
        const miles = distanceMiles(nearestCity.distance);
        const town = postcodeData.result.admin_district.toUpperCase();

        //Land registry and Crime data APIs
        const [crimeDataJson, landRegistryData] = await Promise.all([
          getCrimeData(latitude, longitude),
          getLandRegistryData(locality, town, years),
        ]);

        try {
          const overpassJson = await OverpassAPI(latitude, longitude);
          setOverpassData(overpassJson);
          setOverpassApiFailed(false);
        } catch (err) {
          console.error("Overpass API error: ", err);
          setOverpassApiFailed(true);
        }

        setPriceData(landRegistryData);
        setCrimeData(crimeDataJson);
        setCommuteData({
          nearestCity: nearestCity.name,
          miles,
        });
      } catch (err) {
        console.error("fetchAll error: ", err);
        setError(err.message);
      }
    };

    fetchAll();
  }, [postcode]);

  //National rank
  const rank = locationData?.result.index_of_multiple_deprivation;

  const scores =
    currentPrice && total && commuteData && rank
      ? calculateScores(
          {
            currentPrice,
            priceChange: parseFloat(priceChange),
            total: total,
            miles: commuteData.miles,
            deprivationRank: rank,
          },
          criteria,
        )
      : null;

  // loading
  const isLoading =
    !locationData ||
    !crimeData ||
    !priceData ||
    !commuteData ||
    (!overpassData && !overpassApiFailed);

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

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setAnimate(true), 100);
    }
  }, [isLoading]);

  const countOfAmenities = [
    {
      name: "Supermarkets",
      data: overpassData?.supermarketData,
      count: overpassData?.supermarketData.length,
      icon: !isMobile ? (
        <ShoppingCart
          stroke="#0D9488"
          strokeWidth="2"
          size="48"
          className={styles.amenityIcon}
        />
      ) : (
        <ShoppingCart
          stroke="#0D9488"
          strokeWidth="2"
          size="24"
          className={styles.amenityIcon}
        />
      ),
    },
    {
      name: "Gyms",
      data: overpassData?.gymData,
      count: overpassData?.gymData.length,
      icon: !isMobile ? (
        <Dumbbell
          stroke="#0D9488"
          strokeWidth="2"
          size="48"
          className={styles.amenityIcon}
        />
      ) : (
        <Dumbbell
          stroke="#0D9488"
          strokeWidth="2"
          size="24"
          className={styles.amenityIcon}
        />
      ),
    },
    {
      name: "Schools",
      data: overpassData?.schoolData,
      count: overpassData?.schoolData.length,
      icon: !isMobile ? (
        <School
          stroke="#0D9488"
          strokeWidth="2"
          size="48"
          className={styles.amenityIcon}
        />
      ) : (
        <School
          stroke="#0D9488"
          strokeWidth="2"
          size="24"
          className={styles.amenityIcon}
        />
      ),
    },
  ];

  const mobileAmenitiesCard = (
    <div
      className={styles.mobileAmenitiesContainer}
      onClick={() =>
        setOpenCard(openCard === "nearbyAmenities" ? null : "nearbyAmenities")
      }
    >
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>Nearby Amenities</p>
        <div className={styles.chevronsWrapper}>
          {openCard === "nearbyAmenities" ? (
            <ChevronsUp stroke="#0D9488" strokeWidth="2" size="24" />
          ) : (
            <ChevronsDown stroke="#0D9488" strokeWidth="2" size="24" />
          )}
        </div>
      </div>
      {openCard === "nearbyAmenities" &&
        countOfAmenities
          .sort((a, b) => b.count - a.count)
          .map((amenity) => (
            <>
              <div key={amenity.name} className={styles.mobileAmenitiesCard}>
                <p className={styles.amenityName}>{amenity?.name}</p>

                {amenity?.count > 0 ? (
                  <>
                    <p className={styles.amenityCount}>{amenity?.count}</p>
                    <p className={styles.closestAmenityName}>
                      {findNearestAmenity(amenity?.data).name}
                    </p>
                    <p className={styles.closestAmenityDistance}>
                      {parseFloat(
                        findNearestAmenity(amenity?.data).distance,
                      ).toFixed(1)}{" "}
                      km away
                    </p>
                  </>
                ) : (
                  <p className={styles.noAmenityFound}>
                    No {amenity.name} have been found within 1 km.
                  </p>
                )}
              </div>
            </>
          ))}
    </div>
  );

  function scoreDotClass(score) {
    if (score == 0.0) return styles.scoreDotLow;
    if (!score) return "";
    if (score >= 7) return styles.scoreDotHigh;
    if (score >= 4) return styles.scoreDotMid;
    return styles.scoreDotLow;
  }

  return (
    <main className={styles.main}>
      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Scoring your postcode...</p>
        </div>
      ) : (
        <>
          <Link className={styles.back} to="/">
            New search
          </Link>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <p className={styles.postcode}>{formatPostcode(postcode)}</p>
              <p className={styles.location}>
                {locationData
                  ? `${locationData.result.admin_ward}, ${locationData.result.admin_district}`
                  : "Loading..."}
              </p>
            </div>

            <div className={styles.headerRight}>
              <svg width="200" height="200" viewBox="0 0 120 120">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="4"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="8"
                  strokeDasharray="339.3"
                  strokeDashoffset={
                    animate
                      ? 339.3 * (1 - (scores?.overallScore ?? 0) / 10)
                      : 339.3
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  filter="url(#glow)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
                <text
                  x="60"
                  y="53"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize="35"
                  fontWeight="700"
                  fontFamily="Outfit, sans-serif"
                >
                  {scores ? scores.overallScore.toFixed(1) : "—"}
                </text>
                <text
                  x="60"
                  y="80"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#888892"
                  fontSize="12"
                  fontFamily="Outfit, sans-serif"
                >
                  / 10
                </text>
              </svg>
              <p className={styles.scoreName}>HOMESWORTH SCORE</p>
            </div>
          </div>

          {!isMobile ? (
            <div className={styles.smallCardsContainer}>
              {countOfAmenities
                .sort((a, b) => b.count - a.count)
                .map((amenity) => (
                  <div key={amenity.name} className={styles.smallCard}>
                    <div className={styles.smallCardHeading}>
                      <p className={styles.amenityName}>{amenity?.name}</p>
                      {amenity?.icon}
                    </div>
                    <p className={styles.smallCardCount}>{amenity?.count}</p>
                    {amenity.count > 0 && !isMobile ? (
                      <p className={styles.smallCardFooter}>
                        {findNearestAmenity(amenity?.data).name} ·{" "}
                        {parseFloat(
                          findNearestAmenity(amenity?.data).distance,
                        ).toFixed(1)}{" "}
                        km away
                      </p>
                    ) : (
                      <p className={styles.smallCardFooter}>
                        No {amenity.name.toLocaleLowerCase()} found within 1km
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            mobileAmenitiesCard
          )}

          <div className={styles.card}>
            <div
              className={styles.cardHeader}
              onClick={() =>
                setOpenCard(openCard === "housePrices" ? null : "housePrices")
              }
            >
              <div>
                <p className={styles.cardTitle}>House prices</p>
                <p className={styles.cardSource}>
                  HM Land Registry · {locationData?.result.admin_ward} area
                </p>
              </div>
              <div
                className={`${styles.scorePill} ${scorePillClass(scores?.housePricesScore)}`}
              >
                <span
                  className={` ${styles.scoreDot} ${scoreDotClass(scores?.housePricesScore)}`}
                ></span>
                <span>{scores ? scores.housePricesScore.toFixed(1) : "—"}</span>
              </div>
            </div>

            {(!isMobile || openCard === "housePrices") && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: animate
                        ? `${scores?.housePricesScore * 10}%`
                        : "0%",
                    }}
                  ></div>
                </div>

                <p className={styles.cardSummary}>
                  {vsUKAverage !== null
                    ? getPriceSummary(vsUKAverage, parseFloat(priceChange))
                    : ""}
                </p>

                <div className={`${styles.stats} ${styles.statsWithBorder}`}>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Median sold price</p>
                    <p className={styles.statValue}>
                      {currentPrice
                        ? `£${currentPrice.toLocaleString()}`
                        : "No data"}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>vs UK Median</p>
                    <p className={styles.statValue}>
                      {vsUKAverageFormatted || "No data"}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Most common type</p>
                    <p className={styles.statValue}>
                      {mostCommonType || "No data"}
                    </p>
                  </div>
                </div>

                <button
                  className={styles.trendToggle}
                  onClick={() => setShowPriceTrend(!showPriceTrend)}
                >
                  Trend {showPriceTrend ? "▲" : "▼"}
                </button>

                {showPriceTrend && (
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={priceChartData}
                        margin={{ top: 10, right: 20, bottom: 0, left: 20 }}
                      >
                        <XAxis
                          dataKey="year"
                          stroke="#888892"
                          tick={{ fill: "#888892", fontSize: 12 }}
                        />
                        <YAxis
                          hide={true}
                          domain={["dataMin - 10000", "dataMax + 10000"]}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `£${value.toLocaleString()}`,
                            "Median price",
                          ]}
                          contentStyle={{
                            background: "#222226",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#888892" }}
                          itemStyle={{ color: "#F5F4F0" }}
                        />
                        <Line
                          type="linear"
                          dataKey="price"
                          stroke="#0D9488"
                          strokeWidth={2}
                          dot={{ fill: "#0D9488", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>

          <DetailCard
            cardTitle="Crime rate"
            cardSource={`Police UK · ${formatMonth(crimeData?.[0]?.month)}`}
            stats={[
              { label: "Total crime for the month", value: total },
              {
                label: "Data period",
                value: formatMonth(crimeData?.[0]?.month),
              },
              {
                label: "Most common",
                value: mostCommonCategory
                  ? formatCategory(mostCommonCategory)
                  : "No data",
              },
            ]}
            score={scores?.crimeScore}
            isMobile={isMobile}
            animate={animate}
            isOpen={openCard === "crime"}
            toggleOpen={() =>
              setOpenCard(openCard === "crime" ? null : "crime")
            }
          />

          <DetailCard
            cardTitle="Commute time"
            cardSource="OpenStreetMap · Nearby transport"
            stats={[
              {
                label: "Nearest city",
                value:
                  `${commuteData?.nearestCity} · ${commuteData.miles} mi` ||
                  "Loading...",
              },
              {
                label: "Tram access",
                value: overpassApiFailed
                  ? "—"
                  : overpassData?.tramData.length > 0
                    ? "Yes"
                    : "No",
              },
              {
                label: "Closest Train Station",
                value: overpassApiFailed
                  ? "—"
                  : `${findNearestAmenity(overpassData?.trainData).name} · ${distanceMiles(findNearestAmenity(overpassData?.trainData).distance)} mi`,
              },
            ]}
            score={scores?.commuteScore}
            isMobile={isMobile}
            animate={animate}
            isOpen={openCard === "commute"}
            toggleOpen={() =>
              setOpenCard(openCard === "commute" ? null : "commute")
            }
          />

          <DetailCard
            cardTitle="Deprivation index"
            cardSource="ONS · IMD 2019"
            stats={[
              {
                label: "IMD decile",
                value: rank
                  ? Math.ceil((rank / maxDeprivationRank) * 10)
                  : null,
              },
              {
                label: "National rank",
                value: `${rank ? rank : null} out of ${maxDeprivationRank.toLocaleString()}`,
              },
              {
                label: "Parliamentary constituency",
                value: locationData
                  ? locationData.result.parliamentary_constituency_2024
                  : null,
              },
            ]}
            score={scores?.deprivationScore}
            isMobile={isMobile}
            animate={animate}
            isOpen={openCard === "deprivation"}
            toggleOpen={() =>
              setOpenCard(openCard === "deprivation" ? null : "deprivation")
            }
          >
            <button
              className={styles.moreInfoButton}
              onClick={() => setShowMoreInfo(!showMoreInfo)}
            >
              What is the Deprivation Index?
            </button>

            {showMoreInfo && (
              <div className={styles.moreInfoOverlay}>
                <div className={styles.moreInfoContent}>
                  <p>{deprivationDescription}</p>
                  <button
                    className={styles.closeButton}
                    onClick={() => setShowMoreInfo(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </DetailCard>
        </>
      )}
    </main>
  );
}
