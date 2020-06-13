import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Collapse } from 'react-collapse';
import CacheDemo from './useImage.cache';
import SrcListDemo from './useImage.srcList';

type DemoType = 'srcListDemo' | 'cacheDemo' | '';

const App = () => {
  const [demoType, showDemo] = React.useState<DemoType>('');
  return (
    <div>
      <h2>cache demo </h2>
      <button onClick={() => showDemo('cacheDemo')}>show cache demo</button>
      <Collapse isOpened={demoType === 'cacheDemo'}>
        <CacheDemo></CacheDemo>
      </Collapse>
      <br />
      <h2>srcList demo </h2>
      <button onClick={() => showDemo('srcListDemo')}>show srcList demo</button>
      <Collapse isOpened={demoType === 'srcListDemo'}>
        <SrcListDemo></SrcListDemo>
      </Collapse>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
