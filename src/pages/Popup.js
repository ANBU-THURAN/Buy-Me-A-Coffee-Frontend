import React from "react";
import styles from "../styles/Popup.module.css"; // The CSS for the Popup component

const Popup = ({ message, onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <p>{message}</p>
                <button onClick={onClose} className={styles.okButton}>
                    OK
                </button>
            </div>
        </div>
    );
};

export default Popup;
