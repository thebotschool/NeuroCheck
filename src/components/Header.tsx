import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector"

const Header = () => {
    const { t } = useTranslation();
    
    return (
        <header className="px-8 py-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <nav className="flex justify-between align-middle bg-gray-100 h-10 w-full text-black size-7 text-xl">
                <ul className="flex gap-8 align-middle">
                    <li className="font-bold text-center"><Link to={"/"}>NeuroCheck</Link></li>
                    <li className=""><Link to={"/offer"}>{t("header.offer")}</Link></li>
                    <li className=""><Link to={"/access"}>{t("header.test")}</Link></li>
                </ul>
                <LanguageSelector/>
            </nav>
        </header>
    );
};

export default Header;
