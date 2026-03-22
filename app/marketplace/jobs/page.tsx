import { CategoryPage } from '@/components/CategoryPage';

export default function JobsPage() {
  return (
    <CategoryPage
      slug="marketplace/jobs"
      category="Jobs"
      title='Web3 Jobs. <span>Verified Opportunities.</span>'
      subtitle="Curated job leads across Web3, DeFi, and AI agent teams. Verified openings with direct contact info."
      trustLine1="Sourced from verified Web3 teams and protocols"
      trustLine2="Direct hiring manager contacts included"
    />
  );
}
