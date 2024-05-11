import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY ?? "";

export const notion = new Client({ auth: NOTION_API_KEY });

export const queryDatabase = async () =>
  await notion.databases.query({
    database_id: import.meta.env.NOTION_DATABASE_ID ?? "",
  });

export type Post = {
  id: string;
  title: string;
  slug: string;
  date: Date;
  content: BlockObjectResponse[];
  description: string;
  cover: string | null;
};

export async function getAllPosts(): Promise<Post[]> {
  const database = await queryDatabase();

  const posts: Post[] = [];
  for (const row of database.results) {
    if ("properties" in row && "cover" in row) {
      const id = row.id;
      const titleCell =
        row.properties.Name.type === "title" ? row.properties.Name.title : null;
      const title = titleCell?.[0]?.plain_text ?? "";
      const dateCell =
        row.properties.Date.type === "date" ? row.properties.Date.date : null;
      const date = new Date(dateCell?.start);
      const cover = row.cover
        ? row.cover.type === "external"
          ? row.cover.external.url
          : row.cover.file.url
        : null;
      const slug = titleToSlug(title);

      if (title) {
        const content = (
          await notion.blocks.children.list({
            block_id: id,
          })
        ).results as BlockObjectResponse[];

        let description = "";

        for (const block of content) {
          if (description === "" && block.type === "paragraph") {
            for (const paragraph of block.paragraph.rich_text) {
              description = paragraph.plain_text;
            }
          }
        }

        posts.push({ id, title, slug, content, date, cover, description });
      }
    }
  }

  return posts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
