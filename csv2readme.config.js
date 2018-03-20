var csv2readme = require('csv2readme');
const definition = require("./package.json");

var options={
	input:{
		base:"./helpData/csv/base.csv",
		functionParam:"./helpData/csv/functionParameters.csv",
		classDef:"./helpData/csv/classDefinition.csv"
	},
	moduleName:"xassist",
	globalTOC:true,
	baseURL:"https://github.com/GregBee2/",
	header:{
		title:"xassist",
		explanation:["Several helper functions for Array's, objects, events, Dates, ..."].join("\r\n")
	},
	headerFiles:["./helpData/markdown/installationMain.md"],
	includeDependencies:true,
	includeLicense:true,
	footerFiles:[/*"dependencies.md","src/license.md"*/],
	subTitle:"API",
	output:{
		file:"README.md"
	},
	baseLevel:3,
	headerTemplates:{
		moduleName:"xassist",
		moduleUrl:"https://raw.githubusercontent.com/GregBee2/xassist/master/dist/xAssist.min.js",
		libraryName:"xassist",
		libraryUrl:"https://github.com/GregBee2/xassist",
		moduleTest:"version()"
	},
	footerTemplates:{
		/*license:definition.license,
		licenseUrl:"https://choosealicense.com/licenses/"+definition.license.toLowerCase()*/
	}
};
csv2readme.init(options);

	
	