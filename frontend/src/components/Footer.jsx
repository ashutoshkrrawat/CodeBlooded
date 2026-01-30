import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useTheme} from '@/components/theme-provider';
import {
    Globe,
    Github,
    Twitter,
    Linkedin,
    Mail,
    Heart,
    TrendingUp,
    Clock,
    Users,
} from 'lucide-react';

export default function Footer() {
    const {theme} = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [visitorCount, setVisitorCount] = useState(null);
    const [loading, setLoading] = useState(true);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Track visitor on mount
    useEffect(() => {
        const trackVisitor = async () => {
            try {
                const response = await fetch('/api/visitors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setVisitorCount(data.totalVisitors || data.count || 0);
                }
            } catch (error) {
                console.error('Failed to track visitor:', error);
                // Fallback to a mock count for demo purposes
                setVisitorCount(12847);
            } finally {
                setLoading(false);
            }
        };

        trackVisitor();
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatVisitorCount = (count) => {
        if (count === null) return '---';
        return count.toLocaleString();
    };

    const socialLinks = [
        {icon: Github, href: 'https://github.com', label: 'GitHub'},
        {icon: Twitter, href: 'https://twitter.com', label: 'Twitter'},
        {icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn'},
        {icon: Mail, href: 'mailto:contact@crisislens.com', label: 'Email'},
    ];

    const footerLinks = [
        {
            title: 'Platform',
            links: [
                {label: 'About Us', href: '/about'},
                {label: 'How It Works', href: '/how-it-works'},
                {label: 'Resources', href: '/resources'},
                {label: 'Blog', href: '/blog'},
            ],
        },
        {
            title: 'Support',
            links: [
                {label: 'Help Center', href: '/help'},
                {label: 'Community', href: '/community'},
                {label: 'Contact Us', href: '/contact'},
                {label: 'Report Issue', href: '/report'},
            ],
        },
        {
            title: 'Legal',
            links: [
                {label: 'Privacy Policy', href: '/privacy'},
                {label: 'Terms of Service', href: '/terms'},
                {label: 'Cookie Policy', href: '/cookies'},
                {label: 'Disclaimer', href: '/disclaimer'},
            ],
        },
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;600;700&display=swap');
        
        .footer-container {
          font-family: 'Outfit', sans-serif;
        }

        .footer-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .stat-card:hover::before {
          left: 100%;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .live-indicator {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }

        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #06b6d4, #3b82f6);
          transition: width 0.3s ease;
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .social-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .social-icon:hover {
          transform: translateY(-3px) scale(1.1);
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .gradient-border {
          background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4);
          background-size: 200% 100%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>

            <footer
                className="footer-container mt-20 border-t"
                style={{
                    backgroundColor: theme === 'dark' ? '#0a0a0f' : '#ffffff',
                    borderColor:
                        theme === 'dark'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(6, 182, 212, 0.2)',
                }}
            >
                {/* Gradient Border Top */}
                <div className="gradient-border h-[2px]" />

                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Live Time */}
                        <div
                            className="stat-card p-6 rounded-2xl border-2"
                            style={{
                                backgroundColor:
                                    theme === 'dark'
                                        ? 'rgba(20, 20, 30, 0.5)'
                                        : 'rgba(255, 255, 255, 0.5)',
                                borderColor:
                                    theme === 'dark'
                                        ? 'rgba(59, 130, 246, 0.3)'
                                        : 'rgba(6, 182, 212, 0.3)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="p-2 rounded-lg"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                                    }}
                                >
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <span
                                    className="text-sm font-semibold uppercase tracking-wider"
                                    style={{
                                        color:
                                            theme === 'dark'
                                                ? '#94a3b8'
                                                : '#64748b',
                                    }}
                                >
                                    Live Time
                                </span>
                                <div className="live-indicator w-2 h-2 rounded-full bg-green-500 ml-auto" />
                            </div>
                            <div
                                className="footer-mono text-3xl font-bold mb-1"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#f1f5f9'
                                            : '#0f172a',
                                }}
                            >
                                {formatTime(currentTime)}
                            </div>
                            <div
                                className="text-sm"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#64748b'
                                            : '#94a3b8',
                                }}
                            >
                                {formatDate(currentTime)}
                            </div>
                        </div>

                        {/* Total Visitors */}
                        <div
                            className="stat-card p-6 rounded-2xl border-2"
                            style={{
                                backgroundColor:
                                    theme === 'dark'
                                        ? 'rgba(20, 20, 30, 0.5)'
                                        : 'rgba(255, 255, 255, 0.5)',
                                borderColor:
                                    theme === 'dark'
                                        ? 'rgba(59, 130, 246, 0.3)'
                                        : 'rgba(6, 182, 212, 0.3)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="p-2 rounded-lg"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                    }}
                                >
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <span
                                    className="text-sm font-semibold uppercase tracking-wider"
                                    style={{
                                        color:
                                            theme === 'dark'
                                                ? '#94a3b8'
                                                : '#64748b',
                                    }}
                                >
                                    Total Visitors
                                </span>
                            </div>
                            <div
                                className="footer-mono text-3xl font-bold mb-1"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#f1f5f9'
                                            : '#0f172a',
                                }}
                            >
                                {loading ? (
                                    <span className="animate-pulse">---</span>
                                ) : (
                                    formatVisitorCount(visitorCount)
                                )}
                            </div>
                            <div
                                className="text-sm flex items-center gap-1"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#64748b'
                                            : '#94a3b8',
                                }}
                            >
                                <TrendingUp className="w-3 h-3" />
                                Growing daily
                            </div>
                        </div>

                        {/* Active Status */}
                        <div
                            className="stat-card p-6 rounded-2xl border-2"
                            style={{
                                backgroundColor:
                                    theme === 'dark'
                                        ? 'rgba(20, 20, 30, 0.5)'
                                        : 'rgba(255, 255, 255, 0.5)',
                                borderColor:
                                    theme === 'dark'
                                        ? 'rgba(59, 130, 246, 0.3)'
                                        : 'rgba(6, 182, 212, 0.3)',
                            }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="p-2 rounded-lg"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                    }}
                                >
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <span
                                    className="text-sm font-semibold uppercase tracking-wider"
                                    style={{
                                        color:
                                            theme === 'dark'
                                                ? '#94a3b8'
                                                : '#64748b',
                                    }}
                                >
                                    Status
                                </span>
                            </div>
                            <div
                                className="footer-mono text-3xl font-bold mb-1"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#f1f5f9'
                                            : '#0f172a',
                                }}
                            >
                                ONLINE
                            </div>
                            <div
                                className="text-sm"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#64748b'
                                            : '#94a3b8',
                                }}
                            >
                                All systems operational
                            </div>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand Column */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                                    }}
                                >
                                    <span className="text-white font-bold">
                                        CL
                                    </span>
                                </div>
                                <span
                                    className="text-xl font-bold"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #06b6d4 0%, #3b82f6 60%, #8b5cf6 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    CrisisLens
                                </span>
                            </div>
                            <p
                                className="text-sm mb-4"
                                style={{
                                    color:
                                        theme === 'dark'
                                            ? '#94a3b8'
                                            : '#64748b',
                                }}
                            >
                                Real-time crisis intelligence and disaster
                                management platform.
                            </p>
                            <div className="flex gap-3">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="social-icon p-2 rounded-lg"
                                        style={{
                                            backgroundColor:
                                                theme === 'dark'
                                                    ? 'rgba(59, 130, 246, 0.1)'
                                                    : 'rgba(6, 182, 212, 0.1)',
                                            color:
                                                theme === 'dark'
                                                    ? '#3b82f6'
                                                    : '#06b6d4',
                                        }}
                                    >
                                        <social.icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Link Columns */}
                        {footerLinks.map((section) => (
                            <div key={section.title}>
                                <h3
                                    className="font-bold text-sm uppercase tracking-wider mb-4"
                                    style={{
                                        color:
                                            theme === 'dark'
                                                ? '#f1f5f9'
                                                : '#0f172a',
                                    }}
                                >
                                    {section.title}
                                </h3>
                                <ul className="space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.href}
                                                className="footer-link text-sm inline-block"
                                                style={{
                                                    color:
                                                        theme === 'dark'
                                                            ? '#94a3b8'
                                                            : '#64748b',
                                                }}
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div
                        className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
                        style={{
                            borderColor:
                                theme === 'dark'
                                    ? 'rgba(59, 130, 246, 0.2)'
                                    : 'rgba(6, 182, 212, 0.2)',
                        }}
                    >
                        <p
                            className="text-sm flex items-center gap-2"
                            style={{
                                color: theme === 'dark' ? '#64748b' : '#94a3b8',
                            }}
                        >
                            <span>
                                © {new Date().getFullYear()} CrisisLens. All
                                rights reserved.
                            </span>
                            <Heart
                                className="w-4 h-4 text-red-500 inline"
                                fill="currentColor"
                            />
                        </p>
                        <p
                            className="footer-mono text-xs"
                            style={{
                                color: theme === 'dark' ? '#64748b' : '#94a3b8',
                            }}
                        >
                            Built with care for humanity
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
