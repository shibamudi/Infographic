import {GetStaticPaths, GetStaticProps} from 'next';
import DetailPage from '../../components/Gallery/DetailPage';
import {TEMPLATES} from '../../components/Gallery/templates';

interface Props {
  template: string;
}

export default function ExampleDetail({template}: Props) {
  return (
    <div>
      <DetailPage templateId={template} />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = TEMPLATES.map((t) => ({
    params: {template: t.template},
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({params}) => {
  const template = params?.template;
  if (typeof template !== 'string') {
    return {notFound: true};
  }

  return {
    props: {
      template,
    },
  };
};
