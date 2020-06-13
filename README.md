## 循序渐进，写一个好用的 react-image 组件

### 前言

本文为笔者阅读 [react-image](https://github.com/mbrevda/react-image) 仓库源码过程中的总结，若有所错漏烦请指出。

`<img />`可以说是开发过程中极其常用的标签了。但是很多同学都是`<img src="xxx.png" />`一把梭，直到 UI 小姐姐来找你谈谈人生理想：

1. 图片加载太慢，需要展示`loading`占位符；
2. 图片加载失败，加载备选图片或展示`error`占位符。

可能有些公司要求严格一些，错误的图片需要进行上报。

作为开发者的我们，可能会经历以下几个阶段：

- 第一阶段：`img`标签上使用`onLoad`以及`onError`进行处理；
- 第二阶段：写一个较为通用的组件；
- 第三阶段：抽离 `hooks`，使用方自定义视图组件（当然也要提供基本组件）；

现在让我们直接从第三阶段开始，看看如何使用少量代码打造一个易用性、封装性以及扩展性俱佳的`image`组件。

Talk is cheap, show me your code.

### useImage

首先分析可复用的逻辑，可以发现使用者需要关注三个状态：`loading`、`error`以及`src`，毕竟加载图片也是异步请求嘛。

> 对 [react-use](https://github.com/streamich/react-use) 熟悉的同学会很容易联想到`useAsync`。

自定义一个 hooks，接收图片链接作为参数，返回调用方需要的三个状态。

#### 基础实现

```ts
import * as React from 'react';

// 将图片加载转为promise调用形式
function imgPromise(src: string) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve();
    i.onerror = reject;
    i.src = src;
  });
}

function useImage({
  src,
}: {
  src: string;
}): { src: string | undefined; isLoading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    imgPromise(src)
      .then(() => {
        // 加载成功
        setLoading(false);
        setValue(src);
      })
      .catch(error => {
        // 加载失败
        setLoading(false);
        setError(error);
      });
  }, [src]);

  return { isLoading: loading, src: value, error: error };
}
```

我们已经完成了最基础的实现，现在来慢慢优化。

#### 缓存已加载过的图片

![使用缓存前](https://tva1.sinaimg.cn/large/007S8ZIlgy1gfqgcg3t73g31qw0puqn2.gif)

由于使用`new Image()`的形式加载图片，对于同一张图片来讲，在组件 A 加载过的图片，组件 B 不用再走一遍`new Image()`的流程（在 `Chrome` 上表现为重复请求了图片，同时浏览器一般会缓存图片），直接返回上一次结果即可。

```diff
+ const cache: {
+  [key: string]: Promise<void>;
+ } = {};

function useImage({
  src,
}: {
  src: string;
}): { src: string | undefined; isLoading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
+   if (!cache[src]) {
+     cache[src] = imgPromise(src);
+   }

-   imgPromise(src)
+   cache[src]
      .then(() => {
        setLoading(false);
        setValue(src);
      })
      .catch(error => {
        setLoading(false);
        setError(error);
      });
  }, [src]);

  return { isLoading: loading, src: value, error: error };
}
```

对比一下效果：

![使用缓存后](https://tva1.sinaimg.cn/large/007S8ZIlgy1gfqgak4enug31qw0puam3.gif)

#### 支持 srcList

上文提到过一点：图片加载失败，加载备选图片或展示`error`占位符。

展示`error`占位符我们可以通过`error`状态去控制，但是加载备选图片的功能还没有完成。

主要思路如下：从第一张开始加载，如果加载失败就加在第二张，直到加载成功某一张或全部加载失败，流程结束。类似于 [tapable](https://github.com/webpack/tapable) 的`AsyncSeriesBailHook`。
