import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <div className="py-8 px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Реквизиты</h3>
            <ul className="space-y-2">
              <li>ИП Кунявский Юрий Павлович</li>
              <li>ИНН: 772377683301</li>
              <li>ОГРНИП 316774600328431 от 19 июля 2016 г.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Банковские данные</h3>
            <ul className="space-y-2">
              <li>Счет получателя: 40817810550011493838</li>
              <li>Банк получателя: АО ЮниКредит Банк</li>
              <li>БИК: 044525545</li>
              <li>Корр. счет: 30101810300000000545</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Документы</h3>
            <ul className="space-y-2">
              <li><Link to="/offer" className="hover:text-gray-800 dark:hover:text-white">Оферта</Link></li>
              <li><Link to="/privacy" className="hover:text-gray-800 dark:hover:text-white">Политика обработки персональных данных</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} neurocheck. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
