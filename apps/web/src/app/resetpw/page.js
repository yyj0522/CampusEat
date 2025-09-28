"use client";

import { Suspense } from 'react';
import ResetPwForm from '../login/ResetPwForm';

function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPwForm />
        </Suspense>
    );
}

export default ResetPasswordPage;