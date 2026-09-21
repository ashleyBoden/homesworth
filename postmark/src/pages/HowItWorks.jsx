import styles from "./HowItWorks.module.css";
import { Link } from "react-router-dom";

export default function HowItWorks() {
    return (
        <main className={styles.main}>
            <p>Homesworth is a website you can use to find out more information about a certain postcode you are interested in.</p>
            <p>You can set your own criteria for what is most important to you. What you set as your criteria is then used to generate a score for how suitable each location is for you.</p>
            <p>We use the following data sources:</p>
            <ul>
                <li>House prices: <a href="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads" target="_blank" class="source-link" rel="noopener noreferrer">UK House Price Index</a></li>
                <li>Crime rate: <a href="https://data.police.uk/data/" target="_blank" class="source-link" rel="noopener noreferrer">Police API</a></li>
                <li>Commute time: <a href="https://www.gov.uk/government/statistical-data-sets/commuting-and-migration-statistics" target="_blank" class="source-link" rel="noopener noreferrer">UK Census</a></li>
                <li>Deprivation: <a href="https://www.gov.uk/government/statistical-data-sets/english-indices-of-deprivation" target="_blank" class="source-link" rel="noopener noreferrer">English Indices of Deprivation</a></li>
            </ul>
            <Link className={styles.getStarted} to="/criteria">
                Get started
            </Link>

            <Link className={styles.returnHome} to="/">
                Return home
            </Link>
        </main>
    )
}