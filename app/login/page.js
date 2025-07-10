"use client";

import { signIn } from "next-auth/react";
import styles from "./page.module.css";

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1>Bem-vindo!</h1>
          <h2>Por favor, clique no botão abaixo para entrar</h2>
        </div>

        <button
          onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
          className={styles.microsoftButton}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
            <path fill="#f25022" d="M1 1h9v9H1z"/>
            <path fill="#00a4ef" d="M1 11h9v9H1z"/>
            <path fill="#7fba00" d="M11 1h9v9h-9z"/>
            <path fill="#ffb900" d="M11 11h9v9h-9z"/>
          </svg>
          Entrar com Microsoft
        </button>
      </div>
    </div>
  );
}