import { useTranslation } from "react-i18next";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="mb-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                {t('common.return-to-main')}
            </Button>
        </div>
    );
};

export default Header;



