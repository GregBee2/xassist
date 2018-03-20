# xassist
Several helper functions for Array's, objects, events, Dates, ...
## Installation

If you use [NPM](https://www.npmjs.com/), you can install the module via `npm install xassist`.
If you want, you can install the complete library from github [xassist](https://github.com/GregBee2/xassist), this includes all dependencies you may need or if you're looking for the [minified file](https://raw.githubusercontent.com/GregBee2/xassist/master/dist/xAssist.min.js).

The module uses [UMD](https://github.com/umdjs/umd) and supports [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) and vanilla environments. Using vanilla: the `xa`global is exported:

```html
<script>
xa.version()
</script>
```



## API
- [**xassist-object**](https://github.com/GregBee2/xassist-object)
  - [object()](https://github.com/GregBee2/xassist-object#object)
  - [object().onChange()](https://github.com/GregBee2/xassist-object#objectonchange)
  - [object().clone()](https://github.com/GregBee2/xassist-object#objectclone)
  - [object().assign()](https://github.com/GregBee2/xassist-object#objectassign)
  - [object().mergeUnique()](https://github.com/GregBee2/xassist-object#objectmergeunique)
  - [object().toArray()](https://github.com/GregBee2/xassist-object#objecttoarray)
  - [object().toMapArray()](https://github.com/GregBee2/xassist-object#objecttomaparray)
  - [object().forEach()](https://github.com/GregBee2/xassist-object#objectforeach)
  - [object().map()](https://github.com/GregBee2/xassist-object#objectmap)
- [**xassist-csv**](https://github.com/GregBee2/xassist-csv)
  - [csv()](https://github.com/GregBee2/xassist-csv#csv)
  - [csv().toArray()](https://github.com/GregBee2/xassist-csv#csvtoarray)
  - [csv().toObject()](https://github.com/GregBee2/xassist-csv#csvtoobject)
  - [csv().fromArray()](https://github.com/GregBee2/xassist-csv#csvfromarray)
  - [csv().fromObject()](https://github.com/GregBee2/xassist-csv#csvfromobject)
- [**xassist-array**](https://github.com/GregBee2/xassist-array)
  - [array()](https://github.com/GregBee2/xassist-array#array)
  - [array().pushUnique()](https://github.com/GregBee2/xassist-array#arraypushunique)
  - [array().groupSequence()](https://github.com/GregBee2/xassist-array#arraygroupsequence)
  - [array().replaceNull()](https://github.com/GregBee2/xassist-array#arrayreplacenull)
- [**xassist-eventdispatcher**](https://github.com/GregBee2/xassist-eventdispatcher)
  - [EventDispatcher()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcher)
  - [EventDispatcher().registerEvent()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcherregisterevent)
  - [EventDispatcher().hasEvent()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcherhasevent)
  - [EventDispatcher().on()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcheron)
  - [EventDispatcher().once()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcheronce)
  - [EventDispatcher().off()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcheroff)
  - [EventDispatcher().fire()](https://github.com/GregBee2/xassist-eventdispatcher#eventdispatcherfire)
- [**xassist-main**](https://github.com/GregBee2/xassist-main)
  - [id()](https://github.com/GregBee2/xassist-main#id)
  - [ready()](https://github.com/GregBee2/xassist-main#ready)
  - [template()](https://github.com/GregBee2/xassist-main#template)
## Dependencies
- [@xassist/xassist-array](https://github.com/GregBee2/xassist-array#readme): helper functions for javascript arrays
- [@xassist/xassist-csv](https://github.com/GregBee2/xassist-csv#readme): load csv files from remote and create csv files
- [@xassist/xassist-eventdispatcher](https://github.com/GregBee2/xassist-eventdispatcher#readme): general eventdispatcher class 
- [@xassist/xassist-main](https://github.com/GregBee2/xassist-main#readme): main functions with onready, id-generator and templating engine
- [@xassist/xassist-object](https://github.com/GregBee2/xassist-object#readme): general helper functions for JavaScript objects 
## DevDependencies
- [csv2readme](https://github.com/GregBee2/csv2readme#readme): read csv file with fixed format and parse a readme markdown file
- [jsdom](https://github.com/jsdom/jsdom#readme): A JavaScript implementation of many web standards
- [rimraf](https://github.com/isaacs/rimraf#readme): A deep deletion module for node (like `rm -rf`)
- [rollup](https://github.com/rollup/rollup): Next-generation ES6 module bundler
- [rollup-plugin-json](https://github.com/rollup/rollup-plugin-json#readme): Convert .json files to ES6 modules:
- [rollup-plugin-node-resolve](https://github.com/rollup/rollup-plugin-node-resolve#readme): Bundle third-party dependencies in node_modules
- [tape](https://github.com/substack/tape): tap-producing test harness for node and browsers
## License

This module is licensed under the terms of [GPL-3.0](https://choosealicense.com/licenses/gpl-3.0).
