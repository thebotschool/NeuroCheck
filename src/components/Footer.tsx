import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <div className="py-8 px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {t("footer.requisites.title")}
            </h3>
            <ul className="space-y-2">
              <li>{t("footer.requisites.name")}</li>
              <li>{t("footer.requisites.inn")}</li>
              <li>{t("footer.requisites.ogrnip")}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {t("footer.bank.title")}
            </h3>
            <ul className="space-y-2">
              <li>{t("footer.bank.account")}</li>
              <li>{t("footer.bank.name")}</li>
              <li>{t("footer.bank.bik")}</li>
              <li>{t("footer.bank.correspondent")}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {t("footer.docs.title")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/offer"
                  className="hover:text-gray-800 dark:hover:text-white"
                >
                  {t("footer.docs.offer")}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-gray-800 dark:hover:text-white"
                >
                  {t("footer.docs.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} neurocheck.{" "}
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
