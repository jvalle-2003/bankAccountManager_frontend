import { Metadata } from 'next';
import Layout from '../../layout/layout';
import AuthGuard from '../../layout/AuthGuard';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'GESBANCA',
    description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'GESBANCA',
        url: '',
        description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.',
        ttl: 604800
    },
    icons: {
        icon: '/layout/images/hugo.png'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <AuthGuard>
            <Layout>{children}</Layout>
        </AuthGuard>
    );
}
