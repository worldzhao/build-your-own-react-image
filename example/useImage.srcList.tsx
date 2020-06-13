import * as React from 'react';
import { useImage } from '../dist';

const SrcListDemo = () => {
  const { src, loading, error } = useImage({
    srcList: [
      'error-path',
      'error-path',
      'https://dummyimage.com/3000x3000/000/green',
      'https://dummyimage.com/3000x3000/000/fff',
    ],
  });

  return (
    <div>
      <div>
        <strong> 传入srcList的值为：</strong>
        <ol style={{ border: '1px solid #000', color: 'rgb(64, 59, 133)' }}>
          <li>error-path</li>
          <li>error-path</li>
          <li>https://dummyimage.com/3000x3000/000/green</li>
          <li>https://dummyimage.com/3000x3000/000/fff</li>
        </ol>
      </div>
      <p>loading:{JSON.stringify(loading)}</p>
      <p>error:{JSON.stringify(error)}</p>
      <p>
        <strong>获取到的src值为:</strong>
        <span style={{ color: 'green' }}> {src}</span>
      </p>
      {loading && <p>加载中</p>}
      {error && <p>出错啦</p>}
      {src && <img src={src} alt="100*100" width={100} height={100} />}
    </div>
  );
};

export default SrcListDemo;
