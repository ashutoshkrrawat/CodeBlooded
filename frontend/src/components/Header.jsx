import {Link, useNavigate} from 'react-router-dom';
import {useTheme} from '@/components/theme-provider';
import {Button} from '@/components/ui/button';
import {Sun, Moon, LogOut, Sparkles} from 'lucide-react';
import {useState, useEffect} from 'react';

export default function Header() {
    const {theme, setTheme} = useTheme();
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    // Get role from localStorage
    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setRole(userRole);
    }, []);

    // Handle scroll behavior
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Track if we've scrolled for visual changes
            setIsScrolled(currentScrollY > 20);

            if (currentScrollY === 0) {
                setIsVisible(true);
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                // Scrolling down
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = async () => {
        try {
            const role = localStorage.getItem('role');

            if (role === 'user') {
                await fetch(
                    import.meta.env.VITE_SERVER_URL +
                        '/api/v1/user/logout',
                    {
                        method: 'POST',
                        credentials: 'include',
                    }
                );
            } else if (role === 'ngo') {
                await fetch(
                    import.meta.env.VITE_SERVER_URL + '/api/v1/ngo/logout',
                    {
                        method: 'POST',
                        credentials: 'include',
                    }
                );
            }
        } catch (err) {
            console.error('Logout failed', err);
        } finally {
            localStorage.removeItem('role');
            setRole(null);
            navigate('/');
        }
    };

    // Navigation items based on role
    const getNavItems = () => {
        if (role === 'user') {
            return [
                {label: 'Home', path: '/'},
                {label: 'Dashboard', path: '/dashboard'},
                {label: 'Donation', path: '/donate'},
                {label: 'Raise Issue', path: '/raise-issue'},
                {label: 'Simulator', path: '/simulator'},
            ];
        } else if (role === 'ngo') {
            return [
                {label: 'Home', path: '/'},
                {label: 'Dashboard', path: '/dashboard'},
                {label: 'Report Submission', path: '/ngo/report'},
                {label: 'Simulator', path: '/simulator'},
            ];
        }
        return [];
    };

    const navItems = getNavItems();

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        
        .header-capsule {
          font-family: 'Syne', sans-serif;
        }

        .header-logo-text {
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 60%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          position: relative;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #06b6d4, #3b82f6);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .auth-button {
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .auth-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .auth-button:hover::before {
          left: 100%;
        }

        .theme-toggle-btn {
          position: relative;
          background: rgba(100, 100, 100, 0.1);
          transition: all 0.3s ease;
        }

        .theme-toggle-btn:hover {
          background: rgba(100, 100, 100, 0.2);
          transform: rotate(180deg);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        .logo-icon {
          animation: float 3s ease-in-out infinite;
        }

        .header-glow {
          box-shadow: 
            0 0 20px rgba(6, 182, 212, 0.1),
            0 0 40px rgba(59, 130, 246, 0.05);
        }

        .dark .header-glow {
          box-shadow: 
            0 0 30px rgba(6, 182, 212, 0.15),
            0 0 60px rgba(59, 130, 246, 0.08);
        }
      `}</style>

            <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-4 pointer-events-none">
                <header
                    className={`
            header-capsule
            flex items-center justify-between 
            px-8 py-4 
            rounded-full border-2
            backdrop-blur-xl
            pointer-events-auto
            transition-all duration-500 ease-out
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}
            ${isScrolled ? 'header-glow' : ''}
          `}
                    style={{
                        backgroundColor:
                            theme === 'dark'
                                ? 'rgba(10, 10, 15, 0.85)'
                                : 'rgba(255, 255, 255, 0.85)',
                        borderColor:
                            theme === 'dark'
                                ? 'rgba(59, 130, 246, 0.3)'
                                : 'rgba(6, 182, 212, 0.3)',
                        maxWidth: '1300px',
                        width: '100%',
                    }}
                >
                    {/* Logo + Title */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div
                            className="logo-icon w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
                            style={{
                                background:
                                    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                            }}
                        >
                            <Sparkles
                                className="w-5 h-5 text-white"
                                strokeWidth={2.5}
                            />
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background:
                                        'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
                                }}
                            />
                        </div>
                        <h1 className="header-logo-text text-2xl">
                            CrisisLens
                        </h1>
                    </Link>

                    {/* Navigation - only show if role exists */}
                    {role && navItems.length > 0 && (
                        <nav className="flex items-center gap-8">
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="nav-link"
                                    style={{
                                        color:
                                            theme === 'dark'
                                                ? '#e5e7eb'
                                                : '#1f2937',
                                        animationDelay: `${index * 0.05}s`,
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    )}

                    {/* Auth Buttons - show when no role */}
                    {!role && (
                        <nav className="flex items-center gap-6">
                            <Link
                                to="/signup/ngo"
                                className="auth-button px-4 py-2 rounded-full border-2"
                                style={{
                                    borderColor:
                                        theme === 'dark'
                                            ? '#3b82f6'
                                            : '#06b6d4',
                                    color:
                                        theme === 'dark'
                                            ? '#3b82f6'
                                            : '#06b6d4',
                                }}
                            >
                                NGO
                            </Link>
                            <Link
                                to="/signup/user"
                                className="auth-button px-4 py-2 rounded-full border-2"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                                    borderColor: 'transparent',
                                    color: '#ffffff',
                                }}
                            >
                                User
                            </Link>
                        </nav>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Dark Mode Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            aria-label="Toggle dark mode"
                            className="theme-toggle-btn rounded-full w-10 h-10"
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>

                        {/* Logout Button - only show if role exists */}
                        {role && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                aria-label="Logout"
                                className="rounded-full w-10 h-10 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </header>
            </div>
        </>
    );
}
