"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import AuthenticatedLayout from '../components/AuthenticatedLayout';

export default function MenuPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <h1>Selecione uma opção</h1>
          
          <div className={styles.menuOptions}>
            <button 
              className={`${styles.menuButton} ${styles.disabled}`}
              disabled
              title="Em breve"
            >
              <span className="material-icons-round">analytics</span>
              <div>
                <h3>Painel de Produtos</h3>
                <p>Visualize informações detalhadas sobre os produtos</p>
              </div>
            </button>

            <button 
              className={styles.menuButton}
              onClick={() => router.push("/matriz")}
            >
              <span className="material-icons-round">view_quilt</span>
              <div>
                <h3>Matriz GE - Educação Profissional</h3>
                <p>Análise do ciclo de vida dos produtos através da Matriz GE</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
} 