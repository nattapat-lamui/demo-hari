import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const NotFound: React.FC = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <ExclamationCircleIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>

      <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">
        {t('errors.pageNotFound')}
      </h1>
      <p className="text-text-muted-light dark:text-text-muted-dark max-w-md mb-8">
        {t('errors.pageNotFoundDesc')}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          {t('errors.goHome')}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t('errors.goBack')}
        </button>
      </div>
    </div>
  );
};
