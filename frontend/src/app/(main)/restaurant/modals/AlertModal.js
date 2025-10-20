"use client";

import { useEffect } from "react";

export default function AlertModal({ message, onClose }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition w-full"
                >
                    확인
                </button>
            </div>
        </div>
    );
}