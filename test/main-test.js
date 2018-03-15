var jsdom = require("jsdom");
var dom=new jsdom.JSDOM("<!DOCTYPE html><h1 id='one'></h1>")
global.window=dom.window;
global.document =global.window.document;
var definition = require("../package.json");
var { xa }=require("../"+definition.main);
var tape=require("tape");
 
tape('a test', function (test) {
  test.ok(true);
  test.end();
});
