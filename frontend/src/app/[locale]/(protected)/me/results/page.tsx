import type { Metadata } from 'next';
import MyResultsClient from './MyResultsClient';

export const metadata: Metadata = {
  title: 'My results',
};

export default function Page() {
  return <MyResultsClient />;
}
