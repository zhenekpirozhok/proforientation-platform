import Link from 'next/link';

export default function PublicHomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>
        <Link href="/en/quizzes">Go to quizzes</Link>
      </p>
    </main>
  );
}
