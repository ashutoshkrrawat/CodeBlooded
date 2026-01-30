import {Home, About, NotFound, Test} from './pages';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from "@/components/theme-provider"
import Layout from './Layout.jsx';


import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import SignupNgo from './pages/ngo/Signup';
import LoginNgo from './pages/ngo/Login';
import SignupUser from './pages/user/Signup';
// import LoginUser from './pages/user/Login';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '',
                element: <Home />,
            },
            {
                path: 'about',
                element: <About />,
            },
            {
                path: 'test',
                element: <Test />,
            },
            {
                path: 'signup/ngo',
                element: <SignupNgo />,
            },
            {
                path: 'login/ngo',
                element: <LoginNgo />,
            },
            {
                path: 'signup/user',
                element: <SignupUser />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <ErrorBoundary>
            <RouterProvider router={router} />
        </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
