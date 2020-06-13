import * as React from 'react';

function imgPromise(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve();
    i.onerror = reject;
    i.src = src;
  });
}

const cache: {
  [key: string]: Promise<void>;
} = {};

function useImage({
  src,
}: {
  src: string;
}): { src: string | undefined; loading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!cache[src]) {
      cache[src] = imgPromise(src);
    }

    cache[src]
      .then(() => {
        setLoading(false);
        setValue(src);
      })
      .catch(error => {
        setLoading(false);
        setError(error);
      });
  }, [src]);

  return { loading: loading, src: value, error: error };
}

export default useImage;
