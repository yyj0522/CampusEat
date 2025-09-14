import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ message, onConfirm, onCancel }) => {
return (
<div className={styles.modalBackdrop}>
<div className={styles.modalContainer}>
<p className={styles.modalMessage}>{message}</p>
<div className={styles.modalButtons}>
{onConfirm && (
<button className={styles.confirmBtn} onClick={onConfirm}>확인</button>
)}
{onCancel && (
<button className={styles.cancelBtn} onClick={onCancel}>취소</button>
)}
</div>
</div>
</div>
);
};

export default Modal;