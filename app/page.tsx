import { redirect } from 'next/navigation';

export default function RootPage() {
    // Esto enviará al usuario automáticamente al login al entrar a localhost:3000
    redirect('/auth/login');
}