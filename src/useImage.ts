import * as React from 'react';

function imgPromise(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve();
    i.onerror = reject;
    i.src = src;
  });
}

function promiseFind(
  sourceList: string[],
  imgPromise: (src: string) => Promise<void>
): Promise<string> {
  let done = false;
  return new Promise((resolve, reject) => {
    const queueNext = (src: string) => {
      return imgPromise(src).then(() => {
        done = true;
        resolve(src);
      });
    };

    const firstPromise = queueNext(sourceList.shift() || '');

    sourceList
      .reduce((p, src) => {
        return p.catch(() => {
          if (!done) return queueNext(src);
          return;
        });
      }, firstPromise)
      .catch(reject);
  });
}

const removeBlankArrayElements = (a: string[]) => a.filter(x => x);

const stringToArray = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

const cache: {
  [key: string]: Promise<string>;
} = {};

export interface useImageParams {
  loadImg?: (src: string) => Promise<void>;
  srcList: string | string[];
}

function useImage({
  loadImg = imgPromise,
  srcList,
}: useImageParams): { src: string | undefined; loading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  const sourceList = removeBlankArrayElements(stringToArray(srcList));
  const sourceKey = sourceList.join('');

  React.useEffect(() => {
    if (!cache[sourceKey]) {
      cache[sourceKey] = promiseFind(sourceList, loadImg);
    }

    cache[sourceKey]
      .then(src => {
        setLoading(false);
        setValue(src);
      })
      .catch(error => {
        setLoading(false);
        setError(error);
      });
  }, [sourceKey]);

  return { loading: loading, src: value, error: error };
}
export default useImage;
