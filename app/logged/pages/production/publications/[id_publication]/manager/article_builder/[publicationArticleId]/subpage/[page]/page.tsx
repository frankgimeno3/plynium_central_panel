import { redirect } from "next/navigation";

type ArticleBuilderSubpageRedirectPageProps = {
  params: Promise<{
    id_publication: string;
    publicationArticleId: string;
    page: string;
  }>;
};

export default async function ArticleBuilderSubpageRedirectPage({
  params,
}: ArticleBuilderSubpageRedirectPageProps) {
  const { id_publication, publicationArticleId, page } = await params;
  const query = new URLSearchParams({
    issue: id_publication,
    item: publicationArticleId,
    page,
  });
  redirect(`/logged/pages/production/publications/subpage?${query.toString()}`);
}
