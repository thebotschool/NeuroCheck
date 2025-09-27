import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next";
import { LanguagesIcon } from "lucide-react";

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const { t } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger><div className="flex gap-2"><LanguagesIcon></LanguagesIcon>{t("header.language")}</div></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{t("header.switch-language")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ru")}>Русский</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("az")}>Azərbaycan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("he")}>עברית</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
};

export default LanguageSelector;
