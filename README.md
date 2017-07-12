摩拜单车爬虫
======================
声明：此爬虫仅用于学习、研究用途，请不要用于非法用途。任何由此引发的法律纠纷自行负责。

# 2017-5-16：现在如果没有登录也可以得到真实的数据，但是比登陆后的数据少一些，一般只会返回少于5个。可以在手机上和微信小程序上进行验证。登陆后可以获得完整的数据，爬下来的数据才是可用的。
# 对登录感兴趣的，可以参考login分支。

该代码爬取摩拜单车的微信小程序接口，以便用于共享单车的分析。
相关文章：

* [摩拜单车非官方大数据分析](http://www.jianshu.com/p/2a20d2a97ac0)
* [摩拜单车爬虫解析——找到API](http://www.jianshu.com/p/07225f301fc4)

如果你喜欢我的文章，请赏一杯咖啡或者Star，谢谢：）

<img src="https://s21.postimg.org/58f67s3dz/Wechat_IMG20.jpg" width="350">


目录结构：

* \analysis - jupyter做数据分析
* \influx-importer - 导入到influxdb，但之前没怎么弄好
* \modules - 代理模块
* \web - 实时图形化显示模块，当时只是为了学一下react而已，效果请见[这里](http://www.april1985.com/mobike)（注：服务端已经关闭，无法正常查看）
* crawler.py - 爬虫核心代码
* importToDb.py - 导入到postgres数据库中进行分析
* sql.sql - 创建表的sql
* start.sh -　持续运行的脚本

使用前请更新代理池，我这里仅仅提供的是一个样例，里面的代理很有可能已经失效：
```
r = requests.get("https://jsonblob.com/api/jsonBlob/31bf2dc8-00e6-11e7-a0ba-e39b7fdbe78b", timeout=10)
```

运行需求
```
python3 + numpy 组件
```

* `ujson` 被移除，改用了 python自带的 `json` 以及将`ujson.decode`换成了`json.loads`(有些人的电脑是装不上ujson的……)
使用：
代码中的参数经过了[@zxj5470](https://github.com/zxj5470)的修改……
原始数据意思左上右下表示理解不能……坐标数值上（纬度上）left比rifht大，（经度）top比bottom数值小。
这样的设定有点反人类啊。
* 有强迫症的我给改了。下面对于的np.arange也进行了修改并经过测试。

```
# 作者版本原始数据格式：
    left = 30.7828453209    #左上角点的纬度
    top = 103.9213455517    #左上角点的经度
    
    right = 30.4781772402    #右下角点的纬度
    bottom = 104.2178123382    #右下角点的纬度

    
# 经过zxj5470修改后的：
    left = 103.9213455517    #左上角点的经度
    top = 30.7828453209    #左上角点的纬度
    
    right = 104.2178123382    #右下角点的经度
    bottom =  30.4781772402   #右下角点的纬度
   
```
