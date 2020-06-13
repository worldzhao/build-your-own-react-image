import React from 'react';
import useImage, { useImageParams } from './useImage';

export type ImgProps = Omit<
  React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
  'src'
> &
  Omit<useImageParams, 'srcList'> & {
    src: useImageParams['srcList'];
    loader?: JSX.Element | null;
    unloader?: JSX.Element | null;
  };

export default function Img({
  src: srcList,
  loadImg,
  loader = null,
  unloader = null,
  ...imgProps
}: ImgProps) {
  const { src, loading, error } = useImage({
    srcList,
    loadImg,
  });

  if (src) return <img src={src} {...imgProps} />;
  if (loading) return loader;
  if (error) return unloader;

  return null;
}
