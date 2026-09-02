import {type Locale, useI18n} from '@/i18n';
import {requirePageRoute} from '@/router/routes';

export function usePageMeta(pageId: string) {
  const {locale} = useI18n();
  const route = requirePageRoute(pageId);
  return {
    title: route.title[locale as Locale],
    description: route.description?.[locale as Locale] || '',
  };
}