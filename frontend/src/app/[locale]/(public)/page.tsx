import Link from 'next/link';

export default function PublicHomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>
        <Link href="/en/quizzes">Go to quizzes</Link>
      </p>
      <div className="p-4 bg-indigo-600 text-white rounded-xl">
  Tailwind is alive 🚀
</div>
    </main>
  );
}
