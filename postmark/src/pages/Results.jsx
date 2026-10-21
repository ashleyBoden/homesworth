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
import { School, Dumbbell, ShoppingCart } from "lucide-react";
import { findNearestCity, findNearestAmenity, distanceMiles } from "../utils/distance";
import { getPriceSummary, getLast5Years, housePriceData } from "../utils/prices";
import { formatCategory, formatMonth, formatPostcode } from "../utils/formatting";
import { processCrimeData } from "../utils/crime";
import { maxDeprivationRank } from "../constants/maxDeprivationRank";
import { getPostcodeData } from "../api/postcodeAPI";

const years = getLast5Years();

export default function Results({ criteria }) {
  const location = useLocation();
  const { postcode } = location.state;
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);

  const [priceData, setPriceData] = useState(null);
  const housePriceStats = priceData ? housePriceData(priceData) : null;
  const { currentPrice, priceChange, vsUKAverage, vsUKAverageFormatted, mostCommonType, priceChartData } = housePriceStats || {};

  const [crimeData, setCrimeData] = useState(null);
  const crimeStats = crimeData ? processCrimeData(crimeData) : null;
  const { total, mostCommonCategory } = crimeStats || {}; //Crime data

  const [commuteData, setCommuteData] = useState(null);
  const [showPriceTrend, setShowPriceTrend] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [openCard, setOpenCard] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [amenities, setAmenities] = useState(null);
  const [amenitiesFailed, setAmenitiesFailed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const postcodeData = await getPostcodeData(postcode)

        setLocationData(postcodeData);

        console.log(postcodeData);


        const locality = postcodeData.result.admin_ward.toUpperCase();
        console.log('Locality: ', {locality});

        const { latitude, longitude } = postcodeData.result;

        const nearestCity = findNearestCity(latitude, longitude);
        const miles = distanceMiles(nearestCity.distance);

        const overpassQuery = `
          [out:json];
          (
            node["railway"="station"](around:3000,${latitude},${longitude});
            node["railway"="halt"](around:3000,${latitude},${longitude});
            node["railway"="tram_stop"](around:3000,${latitude},${longitude});
          );
          out;
        `;

        //Land registry and Crime data APIs
        const [crimeRes, ...priceResByYear] = await Promise.all([
          fetch(
            `https://data.police.uk/api/crimes-street/all-crime?lat=${latitude}&lng=${longitude}`,
          ),
          ...years.map((year) =>
            fetch(
              `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.locality=${locality}&min-transactionDate=${year}-01-01&max-transactionDate=${year}-12-31&_page=0&_pageSize=50`,
            ),
          ),
        ]);

        // Transport - separate so it doesn't block everything else
        let nearbyStations = null;
        let hasTram = null;

        try {
          const transportRes = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
              method: "POST",
              body: overpassQuery,
            },
          );
          const transportJson = await transportRes.json();

          const stations = transportJson.elements.filter(
            (e) => e.tags.railway === "station" || e.tags.railway === "halt",
          );
          const tramStops = transportJson.elements.filter(
            (e) => e.tags.railway === "tram_stop",
          );

          nearbyStations = stations.length;
          hasTram = tramStops.length > 0;
        } catch {
          console.log("Transport data unavailable");
        }

        const crimeJson = await crimeRes.json();
        const priceJsonByYear = await Promise.all(
          priceResByYear.map((r) => r.json()),
        );

        const noPriceByYear = priceJsonByYear.every(
          (year) => year.result.items.length === 0,
        );

        if (noPriceByYear) {
          const town = postcodeData.result.admin_district.toUpperCase();
          const fallbackResults = await Promise.all(
            years.map((year) =>
              fetch(
                `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.town=${town}&min-transactionDate=${year}-01-01&max-transactionDate=${year}-12-31&_page=0&_pageSize=50`,
              ),
            ),
          );
          const fallbackJsonByYear = await Promise.all(
            fallbackResults.map((r) => r.json()),
          );
          setPriceData(fallbackJsonByYear);
        } else {
          setPriceData(priceJsonByYear);
        }

        setCrimeData(crimeJson);
        setCommuteData({
          nearestCity: nearestCity.name,
          miles,
          nearbyStations,
          hasTram,
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
  const isLoading = !locationData || !crimeData || !priceData || !commuteData || (!amenities && !amenitiesFailed);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setAnimate(true), 100);
    }
  }, [isLoading]);

  function scorePillClass(score) {
    if (score == 0.0) return styles.scorePillLow;
    if (!score) return "";
    if (score >= 7) return styles.scorePillHigh;
    if (score >= 4) return styles.scorePillMid;
    return styles.scorePillLow;
  }

  useEffect(() => {
    async function getOverpass() {
      try {
        const data = await OverpassAPI(postcode);
        setAmenities(data);
        setAmenitiesFailed(false);
      } catch (err) {
        setAmenitiesFailed(true);
      }
    }

    getOverpass();
  }, [postcode]);

    const countOfAmenities = [
    {
      name: "Supermarkets",
      data: amenities?.supermarketData,
      count: amenities?.supermarketData.length,
      icon: <ShoppingCart stroke="#0D9488" strokeWidth="2" size="48"/>
    },
    {
      name: "Gyms",
      data: amenities?.gymData,
      count: amenities?.gymData.length,
      icon: <Dumbbell stroke="#0D9488" strokeWidth="2" size="48"/>
    },
    {
      name: "Schools",
      data: amenities?.schoolData,
      count: amenities?.schoolData.length,
      icon: <School stroke="#0D9488" strokeWidth="2" size="48"/>
    },
  ];

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

          {amenities ?
          <div className={styles.smallCardsContainer}>
            {countOfAmenities
              .sort((a, b) => b.count - a.count)
              .map((amenity) => (
                <div className={styles.smallCard}>
                  <div className={styles.smallCardHeading}>
                    <p key={amenity.name} className={styles.amenityName}>
                      {amenity.name}
                    </p>
                    {amenity.icon}
                  </div>
                  <p className={styles.smallCardCount}>{amenity.count}</p>
                  <p className={styles.smallCardFooter}>
                    {findNearestAmenity(amenity.data).name} ·{" "}
                    {parseFloat(findNearestAmenity(amenity.data).distance).toFixed(1)}
                    {" "}km away
                  </p>
                </div>
              ))}
          </div> : null}

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

          <div className={styles.card}>
            <div
              className={styles.cardHeader}
              onClick={() => setOpenCard(openCard === "crime" ? null : "crime")}
            >
              <div>
                <p className={styles.cardTitle}>Crime rate</p>
                <p className={styles.cardSource}>
                  Police.uk · {formatMonth(crimeData?.[0]?.month)}
                </p>
              </div>
              <div
                className={`${styles.scorePill} ${scorePillClass(scores?.crimeScore)}`}
              >
                <span
                  className={` ${styles.scoreDot} ${scoreDotClass(scores?.crimeScore)}`}
                ></span>
                <span>{scores ? scores.crimeScore.toFixed(1) : "—"}</span>
              </div>
            </div>

            {(!isMobile || openCard === "crime") && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: animate ? `${scores?.crimeScore * 10}%` : "0%",
                    }}
                  ></div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>
                      Total crime for the month
                    </p>
                    <p className={styles.statValue}>{total ? total : null}</p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Data period</p>
                    <p className={styles.statValue}>
                      {formatMonth(crimeData?.[0]?.month)}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Most common</p>
                    <p className={styles.statValue}>
                      {mostCommonCategory
                        ? formatCategory(mostCommonCategory)
                        : "No data"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.card}>
            <div
              className={styles.cardHeader}
              onClick={() =>
                setOpenCard(openCard === "commute" ? null : "commute")
              }
            >
              <div>
                <p className={styles.cardTitle}>Commute time</p>
                <p className={styles.cardSource}>
                  OpenStreetMap · Nearby transport
                </p>
              </div>
              <div
                className={`${styles.scorePill} ${scorePillClass(scores?.commuteScore)}`}
              >
                <span
                  className={` ${styles.scoreDot} ${scoreDotClass(scores?.commuteScore)}`}
                ></span>
                <span>{scores ? scores.commuteScore.toFixed(1) : "—"}</span>
              </div>
            </div>

            {(!isMobile || openCard === "commute") && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: animate ? `${scores?.commuteScore * 10}%` : "0%",
                    }}
                  ></div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Nearest city</p>
                    <p className={styles.statValue}>
                      {`${commuteData?.nearestCity} · ${commuteData.miles} mi` ||
                        "Loading..."}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>Tram access</p>
                    <p className={styles.statValue}>
                      {commuteData?.hasTram === null
                        ? "—"
                        : commuteData?.hasTram
                          ? "Yes"
                          : "No"}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>
                      Train Stations &lt; 3 miles
                    </p>
                    <p className={styles.statValue}>
                      {commuteData?.nearbyStations === null
                        ? "—"
                        : commuteData?.nearbyStations}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.card}>
            <div
              className={styles.cardHeader}
              onClick={() =>
                setOpenCard(openCard === "deprivation" ? null : "deprivation")
              }
            >
              <div>
                <p className={styles.cardTitle}>Deprivation index</p>

                <p className={styles.cardSource}>ONS · IMD 2019</p>
              </div>
              <div
                className={`${styles.scorePill} ${scorePillClass(scores?.deprivationScore)}`}
              >
                <span
                  className={` ${styles.scoreDot} ${scoreDotClass(scores?.deprivationScore)}`}
                ></span>
                <span>{scores ? scores.deprivationScore.toFixed(1) : "—"}</span>
              </div>
            </div>

            {(!isMobile || openCard === "deprivation") && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: animate
                        ? `${scores?.deprivationScore * 10}%`
                        : "0%",
                    }}
                  ></div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>IMD decile</p>
                    <p className={styles.statValue}>
                      {rank ? Math.ceil((rank / maxDeprivationRank) * 10) : null}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>National rank</p>
                    <p className={styles.statValue}>
                      {rank ? rank : null} out of {maxDeprivationRank.toLocaleString()}
                    </p>
                  </div>
                  <div className={styles.stat}>
                    <p className={styles.statLabel}>
                      Parliamentary constituency
                    </p>
                    <p className={styles.statValue}>
                      {locationData
                        ? locationData.result.parliamentary_constituency_2024
                        : null}
                    </p>
                  </div>
                </div>
                <button
                  className={styles.moreInfoButton}
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                >
                  What is the Deprivation Index?
                </button>
                {showMoreInfo && (
                  <div className={styles.moreInfoOverlay}>
                    <div className={styles.moreInfoContent}>
                      <p>
                        The Deprivation Index is a measure of relative
                        deprivation in England, based on factors such as income,
                        employment, health, education, housing, and crime. It is
                        calculated by the Office for National Statistics (ONS)
                        and is used to identify areas that may require
                        additional support or resources. Decile 1 means the area
                        is in the most deprived 10% nationally. Decile 10 means
                        least deprived.
                      </p>
                      <button
                        className={styles.closeButton}
                        onClick={() => setShowMoreInfo(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
