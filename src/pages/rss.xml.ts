import rss from "@astrojs/rss";
import { ISbRichtext } from "@storyblok/astro";
import { useStoryblokApi } from "@storyblok/astro";

type Post = {
  name: string;
  created_at: string;
  published_at: string;
  id: number;
  uuid: string;
  content: {
    _uid: string;
    tags: string[];
    content: ISbRichtext;
    summary: string;
    component: "post";
    sideImage: {
      id: number;
      filename: string;
    };
    coverImage: {
      id: number;
      filename: string;
    };
  };
  slug: string;
  full_slug: string;
};

export async function GET() {
  const storyblokApi = useStoryblokApi();

  const data: Post[] = await storyblokApi.getAll("cdn/stories", {
    version: import.meta.env.STORYBLOK_MODE,
  });

  const posts = data.toSorted(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
  );

  return rss({
    title: "Thoughtful Gay Odysseys",
    description: "Poetry by Rebekah Wardell",
    site: "https://thoughtfulgayodysseys.com",
    items: posts.map((post) => ({
      title: post.name,
      pubDate: new Date(post.published_at ?? post.created_at),
      description: post.content.summary,
      link: `/posts/${post.slug}/`,
      content: post.content.content.text,
    })),
    customData: `<language>en-us</language>`,
  });
}
