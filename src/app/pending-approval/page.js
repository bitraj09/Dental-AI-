'use client';
import { Suspense } from 'react';
import PendingApprovalContent from './PendingApprovalContent';

export default function PendingApprovalPage() {
    return (
        <Suspense fallback={
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
            }}>
                Loading...
            </div>
        }>
            <PendingApprovalContent />
        </Suspense>
    );
}
