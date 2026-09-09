import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "เพิ่มเพื่อน LINE @ddjung | DD jung salon",
  description: "จองคิวและสอบถาม DD jung salon ผ่าน LINE @ddjung พร้อม QR และวิธีเพิ่มเพื่อนสำหรับผู้ใช้ Facebook บน iPhone",
};

export default function LinePage() {
  return (
    <main className={styles.page} lang="th">
      <div className={styles.container}>
        <header className={styles.brand}>
          <div className={styles.monogram} aria-hidden="true">DD</div>
          <p>DD jung <span>salon</span></p>
        </header>

        <section className={styles.card} aria-labelledby="line-heading">
          <p className={styles.eyebrow}>ดูแลผมสวย เริ่มต้นด้วยการทักหาเรา</p>
          <h1 id="line-heading">คุยกับร้านผ่าน LINE</h1>
          <p className={styles.intro}>จองคิวทำผม หรือสอบถามบริการ<br />เพิ่มเพื่อน DD jung salon ได้เลยค่ะ</p>
          <a className={styles.primary} href="https://line.me/R/ti/p/%40ddjung">
            เปิด LINE เพิ่มเพื่อน @ddjung
          </a>
          <p className={styles.hint}>เมื่อ LINE เปิดขึ้น ให้กด “เพิ่มเพื่อน” แล้วทักหาร้านได้เลย</p>

          <section className={styles.help} aria-labelledby="help-heading">
            <h2 id="help-heading">กดแล้ว LINE ไม่เปิด?</h2>
            <p>หากเปิดจาก Facebook หรือ Messenger บน iPhone แล้วไม่เข้า LINE ให้เพิ่มเพื่อนด้วย ID ได้เลยค่ะ</p>
            <div className={styles.idBox}>
              <span>LINE ID</span>
              <strong>@ddjung</strong>
              <small>พิมพ์เครื่องหมาย @ ด้วยนะคะ</small>
            </div>
            <ol>
              <li>เปิดแอป LINE แล้วไปที่ “หน้าหลัก”</li>
              <li>แตะ “เพิ่มเพื่อน” → “ค้นหา” → เลือก “ID”</li>
              <li>พิมพ์ <b>@ddjung</b> แล้วกดค้นหาและเพิ่มเพื่อน</li>
            </ol>
            <p className={styles.browserHelp}>หรือแตะเมนู ⋯ ในหน้า Facebook แล้วเลือกเปิดในเบราว์เซอร์ภายนอก เช่น Safari จากนั้นกดปุ่มเพิ่มเพื่อนอีกครั้ง</p>
          </section>

          <section className={styles.qrSection} aria-labelledby="qr-heading">
            <h2 id="qr-heading">เพิ่มเพื่อนด้วย QR Code</h2>
            <p>เปิด LINE → เพิ่มเพื่อน → QR Code แล้วสแกน</p>
            <img className={styles.qr} src="/line-ddjung-qr.png" alt="QR Code เพิ่มเพื่อน LINE @ddjung" width="246" height="246" />
            <p className={styles.qrId}>@ddjung</p>
            <p>ใช้มือถือเครื่องเดียว? บันทึก QR หรือจับภาพหน้าจอ แล้วเปิดตัวสแกน QR ใน LINE และเลือกรูปจากอัลบั้ม</p>
            <a className={styles.secondary} href="/line-ddjung-qr.png" download="ddjung-line-qr.png">บันทึก QR เพิ่มเพื่อน</a>
          </section>
        </section>
        <footer className={styles.footer}><Link href="/">กลับหน้าจองคิวร้าน</Link><p>DD jung salon · ยินดีดูแลคุณค่ะ</p></footer>
      </div>
    </main>
  );
}
