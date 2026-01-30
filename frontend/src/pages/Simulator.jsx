import {useState} from 'react';

import SimulatorHeader from '@/components/simulator/SimulatorHeader';
import SimulatorMap from '@/components/simulator/SimulatorMap';
import DisasterFeed from '@/components/simulator/DisasterFeed';

export default function Simulator() {
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleGenerateDisaster = async (inputText) => {
        if (!inputText?.trim()) return;

        try {
            setLoading(true);

            const res = await fetch(
                import.meta.env.VITE_SERVER_URL +
                    '/api/v1/crisis/process-report',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({text: inputText}),
                }
            );

            const json = await res.json();

            console.log('API Response:', json);

            // Check for successful response with issue data
            if (json?.success && json?.data?.issue) {
                // Add new disaster to the beginning of the array
                setDisasters((prev) => [json.data.issue, ...prev]);
            } else {
                console.error('Invalid response structure:', json);
            }
        } catch (error) {
            console.error('Simulator error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* HEADER + INPUT */}
            <SimulatorHeader
                onGenerate={handleGenerateDisaster}
                loading={loading}
            />

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                    {/* MAP — ~70% */}
                    <div className="lg:col-span-7">
                        <SimulatorMap disasters={disasters} />
                    </div>

                    {/* DISASTER FEED — ~30% */}
                    <div className="lg:col-span-3">
                        <DisasterFeed disasters={disasters} />
                    </div>
                </div>
            </div>
        </div>
    );
}
