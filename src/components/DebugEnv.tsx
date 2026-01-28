'use client';

import { useEffect, useState } from 'react';

export const DebugEnv = () => {
    const [envStatus, setEnvStatus] = useState<string>('Checking...');

    useEffect(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        setEnvStatus(
            `URL: ${url ? 'OK (' + url.substring(0, 10) + '...)' : 'MISSING'}\n` +
            `KEY: ${key ? 'OK' : 'MISSING'}`
        );
    }, []);

    if (process.env.NODE_ENV === 'production') {
        return (
            <div className="fixed bottom-0 right-0 bg-black/80 text-green-400 p-2 text-xs font-mono whitespace-pre pointer-events-none z-50">
                {envStatus}
            </div>
        );
    }
    return null;
};
