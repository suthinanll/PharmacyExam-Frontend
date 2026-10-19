import type { Metadata } from 'next';
import SurveyClient from './SurveyClient';

export const metadata: Metadata = {
  title: 'แบบประเมินความพึงพอใจ | เภสัชพร้อมสอบ',
};

export default function SurveyPage() {
  return <SurveyClient />;
}
