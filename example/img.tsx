import * as React from 'react';
import { Img } from '../dist';

const ImgDemo = () => {
  return (
    <div>
      <h3>情景：全部加载失败</h3>
      <Img
        src={['error-path', 'error-path']}
        unloader={<p>图片加载失败💣</p>}
      ></Img>

      <h3>情景：部分图片加载失败</h3>
      <Img
        width={100}
        height={100}
        src={[
          'error-path',
          'error-path',
          'https://dummyimage.com/3000x3000/000/fff',
        ]}
      ></Img>

      <h3>情景：加载中（需要切慢网速）</h3>
      <Img
        width={100}
        height={100}
        src={['https://dummyimage.com/3000x3000/000/green']}
        loader={<p>图片加载中...</p>}
      ></Img>
    </div>
  );
};

export default ImgDemo;
