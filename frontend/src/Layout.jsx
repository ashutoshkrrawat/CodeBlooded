import {Outlet} from 'react-router-dom';
import {Header, Footer} from './components';
import {Toaster} from '@/components/ui/sonner';

function Layout() {
    return (
        <>
            <div className="">
                <Header />
                {/* Spacer to prevent content from going under fixed header */}
                <div className="h-24" />
                <main className="">
                    <Outlet />
                </main>
            </div>
            <Footer />
            <Toaster />
        </>
    );
}

export default Layout;
