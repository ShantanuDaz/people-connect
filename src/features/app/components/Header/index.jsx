import { MessageCircle, SquarePen, Bell, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '@components/Button';

const Header = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <header className="h-full flex flex-col justify-between p-4 border-r border-secondary/20">
            <section className="grid gap-3">
                <Button
                    icon={MessageCircle}
                    variant="primary"
                />
                <Button
                    icon={SquarePen}
                    disabled
                    title="In progress"
                />
                <Button
                    icon={Bell}
                    disabled
                    title="In progress"
                />
            </section>
            <section className="grid gap-3">
                <Button
                    icon={theme === 'light' ? Moon : Sun}
                    onClick={toggleTheme}
                    title="Toggle Theme"
                />
                <Button
                    icon={User}
                    variant="secondary"
                    rounded="full"
                />
            </section>
        </header>
    );
};

export default Header;
