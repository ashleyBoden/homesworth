import { useState } from "react";
import { Link } from 'react-router-dom';
import styles from "./Login.module.css";

export default function Login() {

    return (
        <main className={styles.main}>
            <form className={styles.form}>
                <div className={styles.email}>
                    <input placeholder="Email Address" type="email" name="email" id="email" required />
                </div>

                <div className={styles.password}>
                    <input placeholder="Password" type="password" name="password" id="password" required />
                </div>

                <button type="submit">Sign in</button>
            </form>

            <Link className={styles.continueAsGuest} to="/">
                Continue as guest
            </Link>
        </main>
    )
}