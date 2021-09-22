# inke-tinypng 压缩图片

`inke-tinypng` 使用了网页版 tinypng 的压缩图片接口 `https://tinypng.com/web/shrink` ，参考借鉴了知乎专栏文章《原来TinyPNG可以这样玩!》原文链接：https://zhuanlan.zhihu.com/p/152317953，在该作者的基础上，加入了一些常用配置，并且可以递归遍历文件夹等。

说明：

1. 只支持压缩 `png` | `jpg` | `jpeg` 文件
2. 受限于网页版 tinypng 的接口限制，最大只能压缩 5MB 即 5120KB 的图片 
3. 可设置 `basePath` 方便频繁输入某个路径下的文件/文件夹的场景
4. 可设置 `minSize` ，在执行 `dir` 压缩文件时，指定大于 `minSize` 的文件才进行压缩（单张图片压缩时该配置不生效）
5. 默认配置 `config.basePath` 为 `./src/pages` ，`config.minSize` 为 `10` ，可进行更改

安装：

```shell
npm i inke-tinypng -g
```

使用：

* img：`ikt img <path> [options]`

  压缩单张图片，输出路径和原文件同级，默认情况下压缩输出的文件名和原文件一致，即覆盖。当配置了 `basePath` 时，最终查找的文件路径为 `basePath > path` 。基本使用：

  ```shell
  ikt img ./public/test.png
  ```

  * 选项

    * -r：`r` 为 `retain` 的缩写，指定该选项后压缩输出的文件名将会在原文件名的基础上添加后缀 `.tiny`

      ```shell
      ikt img ./public/test.png -r // ==> test.tiny.png
      ```

* dir：`ikt dir <path> [options]`

  压缩文件夹里所有满足条件的图片，当配置了 `config.basePath` 时，最终查找的文件路径为 `basePath > path` 。基本使用：

  ```shell
  ikt dir ./public
  ```

  * -d：`d` 为 `deep` 的缩写，指定该选项后为深度遍历文件夹，获取所有满足条件的图片进行压缩

    ```shell
    ikt dir ./public -d
    ```

  * -ms：`ms` 为 `minSize` 的缩写，设置压缩的最小文件大小，单位KB，设置后只有大于 `minSize` 的图片才会进行压缩，该指令后跟整数，权重大于 `config.minSize` ；

    ```shell
    ikt dir ./public -ms 10
    ```

  * -r：`r` 为 `retain` 的缩写，指定该选项后压缩输出的文件名将会在原文件名的基础上添加后缀 `.tiny`

    ```shell
    ikt dir ./public -r
    ```

  * -o：`o` 为 `output` 的缩写，后跟文件名/路径，指定该选项后，图片压缩后会输出到指定的文件夹中

    ```shell
    ikt dir ./public -o output // ==> 最终输出目录 ./public/output
    ```

* config：获取配置信息

* config.set.basePath：设置基路径，`img` | `dir` 压缩时指定的 `path` 将相对于 `baesPath` ，`basePath` 值应为一个文件夹路径

  ```shell
  ikt config.set.basePath ./src/pages
  ```

* config.clear.basePath：删除配置的基路径

  ```shell
  ikt config.clear.basePath
  ```

* config.set.minSize：设置最小文件大小，单位KB，需为整数，并且小于5120KB，只有执行dir时，该配置才会生效，`config.minSize` 权重小于命令行 `-ms` 选项

* config.clear.minSize：删除配置的最小文件大小限制