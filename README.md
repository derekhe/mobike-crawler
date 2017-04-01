摩拜单车爬虫
======================
声明：此爬虫仅用于学习、研究用途，请不要用于非法用途。任何由此引发的法律纠纷自行负责。

该代码爬取摩拜单车的微信小程序接口，以便用于共享单车的分析。
相关文章：

* [摩拜单车非官方大数据分析](http://www.jianshu.com/p/2a20d2a97ac0)
* [摩拜单车爬虫解析——找到API](http://www.jianshu.com/p/07225f301fc4)

如果你喜欢我的文章，请赏一杯咖啡或者Star，谢谢：）

<img src="https://s21.postimg.org/58f67s3dz/Wechat_IMG20.jpg" width="100">


目录结构：

* \analysis - jupyter做数据分析
* \influx-importer - 导入到influxdb，但之前没怎么弄好
* \modules - 代理模块
* \web - 实时图形化显示模块，当时只是为了学一下react而已，效果请见[这里](http://www.april1985.com/mobike)（注：服务端已经关闭，无法正常查看）
* crawler.py - 爬虫核心代码
* importToDb.py - 导入到postgres数据库中进行分析
* sql.sql - 创建表的sql
* start.sh -　持续运行的脚本
