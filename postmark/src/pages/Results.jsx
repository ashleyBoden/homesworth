import { Link, useLocation } from "react-router-dom";
import styles from "./Results.module.css";
import { use, useEffect, useState } from "react";
import { calculateScores } from "../utils/scoring";
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
  convertKmToMetres,
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
import DetailCard from "../components/DetailCard";
import { deprivationDescription } from "../constants/deprivationDescription";
import TrendData from "../components/TrendData";
import AmenityCard from "../components/AmenityCard";
import AmenityRow from "../components/AmenityRow";
import OverallScoreCircle from "../components/OverallScoreCircle";
import { inDev } from "../constants/inDev";
import { capitaliseFirstLetter } from "../utils/miscFunctions";

const years = getLast5Years();

export default function Results({ criteria }) {
  const location = useLocation();
  const { postcode } = location.state;
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);

  const [priceData, setPriceData] = useState(null);
  const [locality, setLocality] = useState(null);
  const [district, setDistrict] = useState(null);
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
        const { latitude, longitude } = postcodeData.result;
        const nearestCity = findNearestCity(latitude, longitude);
        const nearestCityDistance = convertKmToMetres(
          nearestCity.distance,
          false,
        );

        const [crimeDataJson, landRegistryData] = await Promise.all([
          getCrimeData(latitude, longitude),
          getLandRegistryData(formatPostcode(postcode), years),
        ]);

        try {
          const overpassJson = await OverpassAPI(latitude, longitude);
          setOverpassData(overpassJson);
          setOverpassApiFailed(false);
        } catch (err) {
          console.error("Overpass API error: ", err);
          setOverpassApiFailed(true);
        }

        setPriceData(landRegistryData.data);
        setLocality(landRegistryData.locality);
        setDistrict(landRegistryData.district);

        setCrimeData(crimeDataJson);
        setCommuteData({
          nearestCity: nearestCity.name,
          nearestCityDistance,
        });
      } catch (err) {
        console.error("fetchAll error: ", err);
        setError(err.message);
      }
    };

    fetchAll();
  }, [postcode]);

  const rank = locationData?.result.index_of_multiple_deprivation;

  const closestTrainStation = findNearestAmenity(overpassData?.trainData);

  const scores =
    currentPrice && crimeData && commuteData && rank
      ? calculateScores(
          {
            currentPrice,
            priceChange: parseFloat(priceChange),
            total: total,
            nearestCityDistance: commuteData.nearestCityDistance,
            deprivationRank: rank,
          },
          criteria,
        )
      : null;

  const isLoading =
    !locationData ||
    !crimeData ||
    !priceData ||
    !commuteData ||
    (!overpassData && !overpassApiFailed);

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
      nearest: findNearestAmenity(overpassData?.supermarketData),
      icon: (
        <ShoppingCart
          stroke="#0D9488"
          strokeWidth="2"
          size={isMobile ? "24" : "48"}
          className={styles.amenityIcon}
        />
      ),
    },
    {
      name: "Gyms",
      data: overpassData?.gymData,
      count: overpassData?.gymData.length,
      nearest: findNearestAmenity(overpassData?.gymData),
      icon: (
        <Dumbbell
          stroke="#0D9488"
          strokeWidth="2"
          size={isMobile ? "24" : "48"}
          className={styles.amenityIcon}
        />
      ),
    },
    {
      name: "Schools",
      data: overpassData?.schoolData,
      count: overpassData?.schoolData.length,
      nearest: findNearestAmenity(overpassData?.schoolData),
      icon: (
        <School
          stroke="#0D9488"
          strokeWidth="2"
          size={isMobile ? "24" : "48"}
          className={styles.amenityIcon}
        />
      ),
    },
  ];

  const sortedAmenities = countOfAmenities.sort((a, b) => b.count - a.count);

  if (inDev) {
    console.clear();
    console.log("--------------------------");
    console.log(locality);
    console.log(district);
    console.log(priceData);
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
                  ? `${capitaliseFirstLetter(locality)}, ${capitaliseFirstLetter(district)}`
                  : "Loading..."}
              </p>
            </div>

            <div className={styles.headerRight}>
              <OverallScoreCircle
                animate={animate}
                overallScore={scores?.overallScore}
              />
              <p className={styles.scoreName}>HOMESWORTH SCORE</p>
            </div>
          </div>

          {!isMobile ? (
            <div className={styles.smallCardsContainer}>
              {sortedAmenities.map((amenity) => (
                <AmenityCard
                  key={amenity?.name}
                  cardName={amenity?.name}
                  count={amenity?.count}
                  icon={amenity?.icon}
                  nearest={amenity?.nearest}
                />
              ))}
            </div>
          ) : (
            <div
              className={styles.mobileAmenitiesContainer}
              onClick={() =>
                setOpenCard(openCard === "amenities" ? null : "amenities")
              }
            >
              <div className={styles.cardHeader}>
                <p className={styles.cardTitle}>Nearby Amenities</p>
                <div className={styles.chevronsWrapper}>
                  {openCard === "amenities" ? (
                    <ChevronsUp stroke="#0D9488" strokeWidth="2" size="24" />
                  ) : (
                    <ChevronsDown stroke="#0D9488" strokeWidth="2" size="24" />
                  )}
                </div>
              </div>
              {openCard === "amenities" &&
                sortedAmenities.map((amenity) => (
                  <AmenityRow
                    key={amenity?.name}
                    rowName={amenity?.name}
                    count={amenity?.count}
                    nearest={amenity?.nearest}
                  />
                ))}
            </div>
          )}

          <DetailCard
            cardTitle="House prices"
            cardSource={`HM Land Registry · ${capitaliseFirstLetter(locality)}`}
            stats={[
              {
                label: "Median sold price",
                value: currentPrice
                  ? `£${currentPrice.toLocaleString()}`
                  : "No data",
              },
              {
                label: "vs UK Median",
                value: vsUKAverageFormatted ?? "No data",
              },
              {
                label: "Most common type",
                value: mostCommonType ?? "No data",
              },
            ]}
            score={scores?.housePricesScore}
            isMobile={isMobile}
            animate={animate}
            isOpen={openCard === "housePrices"}
            toggleOpen={() =>
              setOpenCard(openCard === "housePrices" ? null : "housePrices")
            }
            summary={
              vsUKAverage !== null
                ? getPriceSummary(vsUKAverage, parseFloat(priceChange))
                : ""
            }
            addStatsBorder={true}
          >
            <button
              className={styles.trendToggle}
              onClick={() => setShowPriceTrend(!showPriceTrend)}
            >
              Trend {showPriceTrend ? "▲" : "▼"}
            </button>

            {showPriceTrend && (
              <TrendData
                data={priceChartData}
                datakeyLine="price"
                tooltipText={(value, count) => [
                  `£${value.toLocaleString()}`,
                  "Median price",
                ]}
              />
            )}
          </DetailCard>

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
                value: `${commuteData?.nearestCity} · ${convertKmToMetres(commuteData.nearestCityDistance, true)}`,
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
                value:
                  overpassApiFailed || overpassData?.trainData.length === 0
                    ? "—"
                    : `${closestTrainStation.name} · ${convertKmToMetres(closestTrainStation.distance, true)}`,
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
                value: rank ? Math.ceil((rank / maxDeprivationRank) * 10) : "-",
              },
              {
                label: "National rank",
                value: rank
                  ? `${rank} out of ${maxDeprivationRank.toLocaleString()}`
                  : "-",
              },
              {
                label: "Parliamentary constituency",
                value: locationData
                  ? locationData.result.parliamentary_constituency_2024
                  : "-",
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
