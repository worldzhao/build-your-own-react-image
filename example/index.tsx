import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useImage } from '../.';

const App = () => {
  const [visible, setVisible] = React.useState(false);
  const { src, loading, error } = useImage({
    src: 'https://dummyimage.com/3000x3000/000/fff',
  });

  return (
    <div>
      <h2>main</h2>
      <p>loading:{JSON.stringify(loading)}</p>
      <p>error:{JSON.stringify(error)}</p>
      <p>src:{src}</p>
      <button onClick={() => setVisible(!visible)}>toggle</button>
      {visible && <Another></Another>}
    </div>
  );
};

const Another = () => {
  const { src, loading, error } = useImage({
    src: 'https://dummyimage.com/3000x3000/000/fff',
  });

  return (
    <div>
      <h2>another</h2>
      <p>loading:{JSON.stringify(loading)}</p>
      <p>error:{JSON.stringify(error)}</p>
      <p>src:{src}</p>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
