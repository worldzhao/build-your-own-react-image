## 前言

> 本文为笔者阅读 [react-image](https://github.com/mbrevda/react-image) 源码过程中的总结，若有所错漏烦请指出。

`<img />`可以说是开发过程中极其常用的标签了。然而很多同学都是`<img src="xxx.png" />`一把梭，直到 UI 小姐姐来找你谈谈人生理想：

1. 图片加载太慢，需要展示`loading`占位符；
2. 图片加载失败，加载备选图片或展示`error`占位符。

作为开发者的我们，可能会经历以下几个阶段：

- 第一阶段：`img`标签上使用`onLoad`以及`onError`进行处理；
- 第二阶段：写一个较为通用的组件；
- 第三阶段：抽离 `hooks`，使用方自定义视图组件（当然也要提供基本组件）；

现在让我们直接从第三阶段开始，看看如何使用少量代码打造一个易用性、封装性以及扩展性俱佳的`image`组件。

![Img.gif](https://fdfs.xmcdn.com/group82/M00/83/FC/wKg5Il7m3UHzLZnvABnCpmJg7MQ747.gif)
[本文仓库](https://github.com/worldzhao/build-your-own-react-image)

## useImage

首先分析可复用的逻辑，可以发现使用者需要关注三个状态：`loading`、`error`以及`src`，毕竟加载图片也是异步请求嘛。

> 对 [react-use](https://github.com/streamich/react-use) 熟悉的同学会很容易联想到`useAsync`。

自定义一个 hooks，接收图片链接作为参数，返回调用方需要的三个状态。

### 基础实现

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
      .catch((error) => {
        // 加载失败
        setLoading(false);
        setError(error);
      });
  }, [src]);

  return { isLoading: loading, src: value, error: error };
}
```

我们已经完成了最基础的实现，接下来慢慢优化。

### 性能优化

对于同一张图片来讲，在组件 A 加载过的图片，组件 B 不用再走一遍`new Image()`的流程，直接返回上一次结果即可。

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

优化了一丢丢性能。

### 支持 srcList

上文提到过一点：图片加载失败，加载备选图片或展示`error`占位符。

展示`error`占位符可以通过`error`状态去控制，但加载备选图片的功能还未完成。

主要思路如下：

1. 将入参`src`改为`srcList`，值为图片`url`或图片（含备选图片）的`url`数组；
2. 从第一张开始加载，若失败则加载第二张，直到某一张成功或全部失败，流程结束。

对入参进行处理：

```ts
const removeBlankArrayElements = (a: string[]) => a.filter((x) => x);

const stringToArray = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

function useImage({
  srcList,
}: {
  srcList: string | string[];
}): { src: string | undefined; loading: boolean; error: any } {
  // 获取url数组
  const sourceList = removeBlankArrayElements(stringToArray(srcList));
  // 获取用于缓存的键名
  const sourceKey = sourceList.join('');
}
```

接下来就是重要的加载流程啦，定义`promiseFind`方法，用于完成以上加载图片的逻辑。

```ts
/**
 * 注意 此处将imgPromise作为参数传入，而没有直接使用imgPromise
 * 主要是为了扩展性
 * 后面会将imgPromise方法作为一个参数由使用者传入，使得使用者加载图片的操作空间更大
 * 当然若使用者不传该参数，就是用默认的imgPromise方法
 */
function promiseFind(
  sourceList: string[],
  imgPromise: (src: string) => Promise<void>
): Promise<string> {
  let done = false;
  // 重新使用Promise包一层
  return new Promise((resolve, reject) => {
    const queueNext = (src: string) => {
      return imgPromise(src).then(() => {
        done = true;
        // 加载成功 resolve
        resolve(src);
      });
    };

    const firstPromise = queueNext(sourceList.shift() || '');

    // 生成一条promise链[队列]，每一个promise都跟着catch方法处理当前promise的失败
    // 从而继续下一个promise的处理
    sourceList
      .reduce((p, src) => {
        // 如果加载失败 继续加载
        return p.catch(() => {
          if (!done) return queueNext(src);
          return;
        });
      }, firstPromise)
      // 全都挂了 reject
      .catch(reject);
  });
}
```

再来改动`useImage`。

```diff
const cache: {
-  [key: string]: Promise<void>;
+  [key: string]: Promise<string>;
} = {};

function useImage({
-  src,
+  srcList,
}: {
- src: string;
+ srcList: string | string[];
}): { src: string | undefined; loading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

// 图片链接数组
+ const sourceList = removeBlankArrayElements(stringToArray(srcList));
// cache唯一键名
+ const sourceKey = sourceList.join('');

  React.useEffect(() => {
-   if (!cache[src]) {
-     cache[src] = imgPromise(src);
-   }

+   if (!cache[sourceKey]) {
+     cache[sourceKey] = promiseFind(sourceList, imgPromise);
+   }

-    cache[src]
-    .then(() => {
+    cache[sourceKey]
+     .then((src) => {
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

需要注意的一点：现在传入的图片链接可能不是单个`src`，最终设置的`value`为`promiseFind`找到的`src`，所以 `cache` 类型定义也有变化。

![useImage-srcList](https://fdfs.xmcdn.com/group87/M02/83/6E/wKg5IV7m3XuiK523AAET-9d0vGk051.png)

### 自定义 imgPromise

前面提到过，加载图片过程中，使用方可能会插入自己的逻辑，所以将 `imgPromise` 方法作为可选参数`loadImg`传入，若使用者想自定义加载方法，可传入该参数。

```diff
function useImage({
+ loadImg = imgPromise,
  srcList,
}: {
+ loadImg?: (src: string) => Promise<void>;
  srcList: string | string[];
}): { src: string | undefined; loading: boolean; error: any } {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  const sourceList = removeBlankArrayElements(stringToArray(srcList));
  const sourceKey = sourceList.join('');

  React.useEffect(() => {
    if (!cache[sourceKey]) {
-     cache[sourceKey] = promiseFind(sourceList, imgPromise);
+     cache[sourceKey] = promiseFind(sourceList, loadImg);
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
```

## 实现 Img 组件

完成`useImage`后，我们就可以基于其实现 `Img` 组件了。

预先定义好相关 API：

| 属性     | 说明                                 | 类型                        | 默认值     |
| -------- | ------------------------------------ | --------------------------- | ---------- |
| src      | 图片链接                             | string / string[]           | -          |
| loader   | 可选，加载过程占位元素               | ReactNode                   | null       |
| unloader | 可选，加载失败占位元素               | ReactNode                   | null       |
| loadImg  | 可选，图片加载方法，返回一个 Promise | (src:string)=>Promise<void> | imgPromise |

当然，除了以上 API，还有`<img />`标签原生属性。编写类型声明文件如下：

```ts
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
```

实现如下：

```tsx
export default ({
  src: srcList,
  loadImg,
  loader = null,
  unloader = null,
  ...imgProps
}: ImgProps) => {
  const { src, loading, error } = useImage({
    srcList,
    loadImg,
  });

  if (src) return <img src={src} {...imgProps} />;
  if (loading) return loader;
  if (error) return unloader;

  return null;
};
```

测试效果如下：

![Img.gif](https://fdfs.xmcdn.com/group82/M00/83/FC/wKg5Il7m3UHzLZnvABnCpmJg7MQ747.gif)
比较简单，就不多说啦。

[本文仓库](https://github.com/worldzhao/build-your-own-react-image)，欢迎 star😝。

## 结语

值得注意的是，本文遵循 `react-image` 大体思路，但部分内容暂未实现（所以代码可读性要好一点）。其它特性，如：

1. 支持 Suspense 形式调用；
2. 默认在渲染图片前会进行 decode，避免页面卡顿或者闪烁。

有兴趣的同学可以看看下面这些文章：

- [用于数据获取的 Suspense（试验阶段）](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html)
- [错误边界（Error Boundaries）](https://zh-hans.reactjs.org/docs/error-boundaries.html#introducing-error-boundaries)
- [React：Suspense 的实现与探讨](https://zhuanlan.zhihu.com/p/34210780)
- [HTMLImageElement.decode()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLImageElement/decode)
- [Chrome 图片解码与 Image.decode API](https://zhuanlan.zhihu.com/p/43991630)
