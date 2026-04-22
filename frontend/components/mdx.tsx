import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode from 'rehype-pretty-code'

const components: MDXRemoteProps['components'] = {
  // Add custom overrides if needed (e.g., Image, Alert, Callout)
}

export function MDX({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypePrettyCode,
              {
                theme: { light: 'github-light', dark: 'github-dark' },
                keepBackground: false,
              },
            ],
          ],
        },
      }}
    />
  )
}
