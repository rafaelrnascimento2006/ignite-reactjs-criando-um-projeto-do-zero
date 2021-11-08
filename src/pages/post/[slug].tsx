import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import Prismic from '@prismicio/client';
import Header from '../../components/Header';
import { useRouter } from 'next/router';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map((item) => item.text.split(' ').length);
    words.forEach((word) => total += word)
    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  if (router.isFallback) return <h1>Carregando...</h1>;

  const formatedDate = format(
    new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR },
    );

  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.postContent}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {formatedDate}
              </li>
              <li>
                <FiUser />
                {post.data.author}
              </li>
              <li>
                <FiClock />
                {`${readTime} min`}
              </li>
            </ul>

            {post.data.content.map((content) => (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body)}}
                />
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([Prismic.predicates.at('document.type', 'post')]);

  const paths = posts.results.map((post) => ({ params: { slug: post.uid } }));

  return { paths, fallback: true  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});

  const { uid, first_publication_date, data: { content, ...rest } } = response;

  const post = {
    uid,
    first_publication_date,
    data: {
      ...rest,
      content: content.map(({ heading, body }) => ({ heading, body: [...body] })),
    },
  };

  return { props: { post } };
};
