import {useState, useEffect} from 'react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {TrendingUp, Heart, Users, Clock} from 'lucide-react';
import {CircularProgressbar, buildStyles} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {toast} from 'sonner';

export default function DonationPanel() {
    const [progress, setProgress] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [liveCount, setLiveCount] = useState(774);

    const [ngos, setNgos] = useState([]);
    const [selectedNgo, setSelectedNgo] = useState('');
    const [loadingNgos, setLoadingNgos] = useState(false);

    const targetProgress = 51;
    const quickAmounts = [500, 1000, 2500, 5000];

    /* Load Razorpay */
    useEffect(() => {
        if (window.Razorpay) return;
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    /* Animate progress */
    useEffect(() => {
        const t = setTimeout(() => setProgress(targetProgress), 100);
        return () => clearTimeout(t);
    }, []);

    /* Live donation count */
    useEffect(() => {
        const i = setInterval(() => {
            setLiveCount((p) => p + Math.floor(Math.random() * 3));
        }, 5000);
        return () => clearInterval(i);
    }, []);

    /* Fetch NGO recommendations */
    useEffect(() => {
        const fetchNgos = async () => {
            try {
                setLoadingNgos(true);
                const res = await fetch(
                    import.meta.env.VITE_SERVER_URL +
                        '/api/v1/recommendation',
                    {
                        method: 'GET',
                        credentials: 'include',
                    }
                );

                const result = await res.json();

                if (result?.success) {
                    console.log(result);
                    setNgos(result?.data?.listing);
                } else {
                    toast.error('Failed to load NGO list');
                }
            } catch (err) {
                toast.error('Failed to load NGO list');
            } finally {
                setLoadingNgos(false);
            }
        };

        fetchNgos();
    }, []);

    const handleDonate = async () => {
        const amount = selectedAmount || Number(customAmount);

        if (!selectedNgo) {
            toast.error('Please select an NGO');
            return;
        }

        if (!amount || amount <= 0) {
            toast.error('Enter a valid amount');
            return;
        }

        try {
            /* Create order */
            const res = await fetch(
                import.meta.env.VITE_SERVER_URL +
                    '/api/v1/payment/create-order',
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({
                        amount,
                        ngoId: selectedNgo,
                    }),
                }
            );

            const data = await res.json();

            if (!data?.data?.id) {
                toast.error('Unable to initiate payment');
                return;
            }

            /* Razorpay checkout */
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.data.amount,
                currency: 'INR',
                order_id: data.data.id,
                name: 'NGO Donation',
                description: 'Thank you for making a difference',

                handler: async (response) => {
                    const verify = await fetch(
                        import.meta.env.VITE_SERVER_URL +
                            '/api/v1/payment/verify-payment',
                        {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            credentials: 'include',
                            body: JSON.stringify(response),
                        }
                    );

                    const result = await verify.json();

                    if (result.success) {
                        toast.success('Payment successful 💚');
                    } else {
                        toast.error('Payment verification failed');
                    }
                },

                theme: {color: '#7c3aed'},
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error('Payment failed');
        }
    };

    return (
        <Card className="p-6 rounded-3xl shadow-xl bg-[var(--card)] min-h-[600px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--primary)]/5 pointer-events-none" />

            <div className="relative z-10">
                {/* HEADER */}
                <div className="flex items-start gap-6 mb-6">
                    <div className="w-24 h-24">
                        <CircularProgressbar
                            value={progress}
                            text={`${Math.round(progress)}%`}
                            strokeWidth={12}
                            styles={buildStyles({
                                pathColor: 'var(--primary)',
                                trailColor: 'var(--muted)',
                                textColor: 'var(--foreground)',
                                strokeLinecap: 'round',
                            })}
                        />
                    </div>

                    <div className="flex-1 pt-2">
                        <p className="text-2xl font-bold">₹101,945 raised</p>
                        <p className="text-sm text-muted-foreground">
                            of ₹200,000 goal
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> 1.5K donations
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> 15 days left
                            </span>
                        </div>
                    </div>
                </div>

                {/* NGO SELECT */}
                <Select value={selectedNgo} onValueChange={setSelectedNgo}>
                    <SelectTrigger className="rounded-full py-6">
                        <SelectValue
                            placeholder={
                                loadingNgos
                                    ? 'Finding urgent NGOs...'
                                    : 'Choose NGO (AI recommended)'
                            }
                        />
                    </SelectTrigger>

                    <SelectContent>
                        {ngos.map((ngo) => (
                            <SelectItem key={ngo._id} value={ngo._id}>
                                {ngo.name} • Urgency{' '}
                                {ngo.metrics.urgencyScore}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* AMOUNTS */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                    {quickAmounts.map((amt) => (
                        <Button
                            key={amt}
                            variant={
                                selectedAmount === amt ? 'default' : 'outline'
                            }
                            onClick={() => {
                                setSelectedAmount(amt);
                                setCustomAmount('');
                            }}
                            className="rounded-full py-5"
                        >
                            ₹{amt}
                        </Button>
                    ))}
                </div>

                <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                    }}
                    className="w-full mt-3 px-4 py-3 rounded-full border"
                />

                {/* DONATE */}
                <Button
                    disabled={
                        !selectedNgo || (!selectedAmount && !customAmount)
                    }
                    onClick={handleDonate}
                    className="w-full mt-4 rounded-full py-6 flex gap-2"
                >
                    <Heart className="h-5 w-5" />
                    Donate ₹{selectedAmount || customAmount}
                </Button>

                {/* LIVE */}
                <div className="mt-6 flex gap-2 text-green-600 bg-green-500/10 px-4 py-3 rounded-full animate-pulse">
                    <TrendingUp className="h-4 w-4" />
                    {liveCount} people donated recently
                </div>
            </div>
        </Card>
    );
}
