import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const formattedPost = postsPagination.results.map((post) => ({
    ...post, first_publication_date: format(
      new Date(post.first_publication_date), 'dd MMM yyyy', {locale: ptBR}
    ),
  }));

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  const handleNextPage = async (): Promise<void> => {
    if (currentPage !== 1 && !nextPage) return;

    const postsResults = await fetch(`${nextPage}`).then((res) => res.json());
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map(({ uid, first_publication_date, data }) => ({
      uid,
      first_publication_date: format(
        new Date(first_publication_date), 'dd MMM yyyy', {locale: ptBR}
      ),
      data,
    }));

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map((post) => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar />
                    {post.first_publication_date}
                  </li>
                  <li>
                    <FiUser />
                    {post.data.author}
                  </li>
                </ul>
              </a>
            </Link>
          ))}

          {nextPage && <button type="button" onClick={handleNextPage}>Carregar mais posts</button>}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')], {pageSize: 1}
    );

  const { next_page, results } = postsResponse;
  const posts = results.map(({ uid, first_publication_date, data }) => ({
    uid, first_publication_date, data,
  }));

  return { props: { postsPagination: { next_page, results: posts } } };
};
