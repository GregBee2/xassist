var definition = require("../package.json");
var { xa }=require("../"+definition.main);
var tape=require("tape");
 
tape('a test', function (test) {
  test.ok(true);
  test.end();
});
