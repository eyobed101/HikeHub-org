import React from "react";

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {

    return (
        <div className="rounded-t-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

            <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">{title}</h1>
        </div>
    );
};

export default Header;

