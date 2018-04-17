/**
* @preserve
* https://github.com/GregBee2/xassist#readme Version 1.1.1.
*  Copyright 2018 Gregory Beirens.
*  Created on Tue, 17 Apr 2018 11:12:24 GMT.
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.xa = global.xa || {})));
}(this, (function (exports) { 'use strict';

var version = "1.1.1";

var idSeed=Math.round(Math.random()*(1000000)),
	DOMContentLoadedEvent,
	readyCallBacks=[],
	isReady=false;
if(typeof document !== "undefined"){
	document.addEventListener( "DOMContentLoaded", readyHandler,{once:true});
}

function readyHandler(){
	//save event information
	DOMContentLoadedEvent=arguments[0];
	readyCallBacks.forEach(function(cb){
		cb[0].call(cb[1],DOMContentLoadedEvent);
	});
	//empty readyCallBacks
	readyCallBacks=[];
	isReady=true;
}
function id(prefix){
	//creates unique ID based on 
	return ((!arguments.length?'':prefix+'_')+idSeed++);
	
}
function ready(callBack,thisArg){
	//thisArg refers to this inside callback
	if(!thisArg){
		thisArg=document;
	}
	//check if document state is complete
	if (isReady){
		callBack.call(thisArg,DOMContentLoadedEvent);
	}
	else{
		//add to executionList;
		readyCallBacks.push([callBack,thisArg]);
	}
	
}
function template(text,obj,notfoundText){
	notfoundText=(notfoundText?notfoundText:"");
	return text.replace(/\${([^}]*)}/g,function(match,p1){
		
		return p1.split(".").reduce(function(obj,prop){
			if(obj.hasOwnProperty(prop)){
				return obj[prop];
			}
			return notfoundText;
		},obj);
	});
}

function pushUnique(arr,val,unique){
	unique=(typeof unique==="undefined"?true:!!unique);
	if(!unique || arr.indexOf(val)===-1){
		return arr.push(val);
	}
	else{
		//unique set but it is not
		return arr.length;
	}
}
function groupSequence(arr,checkFn){
	//this function groups elements based on previouselement and checkFn
	//the function returns an array of arrays with the groupelements in each subArray
	return arr.reduce(function(result,value,index,array){
		
		if(index&&checkFn(array[index-1],value)){
			//add to last element of result
			result[result.length-1].push(value);
		}
		else{
			//new subArray
			result.push([value]);
		}
		return result;
	},[]);
}
function replaceNull(arr,replacer){
	//this function replaces all null or undefined values with a value described by replacer
	//replacer may be static text or a function which will give correct textOutput
	var replaceFn,result=[];
	if (Array.isArray(replacer)){
		replaceFn=function(v,i){return replacer[i]};
	}
	else if (typeof replacer==="function"){
		replaceFn=replacer;
	}
	else {
		replaceFn=function(){return replacer};
	}
	for (var i=0,len=arr.length,v;i<len;i++){
		v=arr[i];
		if (v===null||typeof v==="undefined"){
			result.push(replaceFn(v,i));
		}
		else {
			result.push(v);
		}
	}
	return result;
}
function array(arr){
	return {
		pushUnique:pushUnique.bind(null,arr),
		groupSequence:groupSequence.bind(null,arr),
		replaceNull:replaceNull.bind(null,arr)
	};
}

function EventDispatcher(){
	if ( !(this instanceof EventDispatcher) ){
		return new EventDispatcher();
	}
	//this._parent=me;
	this._events={};
}

EventDispatcher.prototype.registerEvent=function(eventName,defaultThis){
	if(!this.hasEvent(eventName)){
		this._events[eventName]={
			thisArg:defaultThis||this,
			listeners:[]
		};
	}
	else{
		throw new ReferenceError("event was allready registered")
	}
};
EventDispatcher.prototype.hasEvent=function(eventName){
	return this._events.hasOwnProperty(eventName);
};
EventDispatcher.prototype.on=function(eventName,callBack,thisArg){
	var listener={
		fn:callBack,
	};
	if(thisArg && thisArg!==this._events[eventName].thisArg){
		listener.thisArg=thisArg;
	}
	if(this.hasEvent(eventName)){
		this._events[eventName].listeners.push(listener);
	}
};
EventDispatcher.prototype.once=function(eventName,callBack,thisArg){
	var listener={
		fn:callBack,
		once:true
	};
	if(thisArg && thisArg!==this._events[eventName].thisArg){
		listener.thisArg=thisArg;
	}
	if(this.hasEvent(eventName)){
		this._events[eventName].listeners.push(listener);
	}
};
EventDispatcher.prototype.fire=function(eventName/*,args*/){
	var defaultThis;
	var args=(Array.prototype.slice.call(arguments,1));
	if(this.hasEvent(eventName)){
		defaultThis=this._events[eventName].thisArg;
		for (var index = 0,l=this._events[eventName].listeners.length; index <l; index += 1) {
            this._events[eventName].listeners[index].fn.apply(
				this._events[eventName].listeners[index].thisArg||defaultThis,
				args
			);
        }
		this._events[eventName].listeners=this._events[eventName].listeners.filter(function(v){
			return !v.once;
		});
	}
	
};

EventDispatcher.prototype.off=function(eventName,callBack){
	if(this.hasEvent(eventName)){
		this._events[eventName].listeners=this._events[eventName].listeners.filter(function(v){
			return v.fn!==callBack;
		});
	}
};

function object (obj) {
	return new XaObject(obj);
}
function XaObject(obj) {
	this.object = obj;
	EventDispatcher.call(this, this); //containerElm=modal
	this.currentValues = {};
}
XaObject.prototype = Object.create(EventDispatcher.prototype); // Here's where the inheritance occurs
XaObject.prototype.constructor = XaObject;
function _getType(value) {
	return typeof value;
}
function _transformType(type, value) {
	if (type === "boolean") {
		return !!value;
	}
	if (type === "number") {
		return Number(value);
	}
	if (type === "string") {
		return String(value);
	}
	return value;
}
XaObject.prototype.onChange = function (key, fn, thisArg) {

	var me = this,
	newWatch = false;
	if (!key || !this.object.hasOwnProperty(key)) {
		throw new ReferenceError('key does not exist in Object');
	}
	if (!this.hasEvent("changeKey" + key)) {
		this.registerEvent("changeKey" + key, this.object);
		this.currentValues[key] = this.object[key];
		newWatch = true;
	}
	EventDispatcher.prototype.on.call(this, "changeKey" + key, fn, thisArg);
	if (newWatch) {
		Object.defineProperty(this.object, key, {
			set: function (value) {
				var oldValue = me.currentValues[key];
				me.currentValues[key] = value;
				if (value !== oldValue) {
					me.fire("changeKey" + key, value, oldValue, key, me.object);
				}
			},
			get: function () {
				return me.currentValues[key];
			}
		});
	}
};
XaObject.prototype.assign = function (/*varArgs*/) { // .length of function is 2
	if (typeof Object.assign === 'function') {
		return Object.assign.apply(null, [this.object].concat(Array.prototype.slice.call(arguments)));
	}
	if (this.object == null) { // TypeError if undefined or null
		throw new TypeError('Cannot convert undefined or null to object');
	}
	var to = Object(this.object);
	for (var index = 0; index < arguments.length; index++) {
		var nextSource = arguments[index];
		if (nextSource != null) { // Skip over if undefined or null
			for (var nextKey in nextSource) {
				// Avoid bugs when hasOwnProperty is shadowed
				if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
					to[nextKey] = nextSource[nextKey];
				}
			}
		}
	}
	return to;
};
XaObject.prototype.clone = function () {
	return JSON.parse(JSON.stringify(this.object));
};
XaObject.prototype.mergeUnique = function (source) {
	var me = this;
	//copies only existing key in obj from source to obj
	//problems may arise with objects, dates, arrays, ... for now Strings, numbers,
	if (source != null) { // Skip over if undefined or null
		Object.keys(this.object).forEach(function (targetKey) {
			if (source.hasOwnProperty(targetKey)) {
				me.object[targetKey] = _transformType(_getType(me.object[targetKey]), source[targetKey]);
			}
		});
	}
	return this.object;
};
XaObject.prototype.toArray = function () {
	var me = this;
	return Object.keys(this.object).map(function (property_name) {
		return me.object[property_name];
	});
};
XaObject.prototype.toMapArray = function () {
	var me = this;
	return Object.keys(this.object).map(function (property_name) {
		return [property_name, me.object[property_name]];
	});
};
XaObject.prototype.forEach = function (fn, thisArg) {
	var me = this;
	if (!thisArg) {
		thisArg = this.object;
	}
	return Object.keys(this.object).forEach(function (property_name) {
		fn.call(thisArg, me.object[property_name], property_name, me.object);
	}, thisArg);
};
XaObject.prototype.map = function (fn, thisArg) {
	var me = this;
	if (!thisArg) {
		thisArg = this.object;
	}
	var newObject = {};
	Object.keys(this.object).forEach(function (property_name) {
		newObject[property_name] = fn.call(thisArg, me.object[property_name], property_name, me.object);
	}, thisArg);
	return newObject;
};

var _delimiter = [59]; //point comma
var _options = {
	headersIncluded: false, //first records are headers of files,
	headerPrefix: "column_", //used for unknown colums or if headers are not included
	spaceAllowedBetweenDelimiterAndQuote: true,
	treatConsecutiveDelmitersAsOne: false,
	removeLeadingEmptyRows: true, //removes if all values are null or spaced
	removeTrailingEmptyRows: true,
	removeInnerEmptyRows: false,
	trimValues: true,
	emptyValuesAreNull: true
};
var _errorMessages = {
	incorrectTrailingQuote: 'Unexpected token found after closing Quote for value',
	incorrectQuote: 'Unexpected Quote found inside value'
};
function _setOptions(o,newVals) {
	return object(o).mergeUnique(newVals);
}
function _setDelimiter(a) {
	var delimiter = [];
	for (var i = 0, l = a.length; i < l; i++) {
		delimiter.push(a.charCodeAt(i));
	}
	return delimiter;
}
function _getReFormat(delimiter) {
		return new RegExp("[\"" + delimiter.map(String.fromCharCode).join("") + "\n\r]");
	}
function csv(/*delimiters,options*/) {
	var options = object(_options).clone(),
		delimiter = _delimiter,
		indexAfterHeader=0,
		regexpFormat= _getReFormat(delimiter);
	if (arguments.length === 1) {
		if (typeof arguments[0] === "string") {
			delimiter=_setDelimiter(arguments[0]);
			regexpFormat = _getReFormat(delimiter);
		} else {
			options=_setOptions(options,arguments[0]);
		}
	} else if (arguments.length > 1) {
		delimiter=_setDelimiter(arguments[0]);
		regexpFormat = _getReFormat(delimiter);
		options=_setOptions(options,arguments[1]);
	}
	function _isNumeric(n) {
		//todo move to main
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	function _getHeader(text) {
		var res,origName,suffix,splitValue,currentValue;
		indexAfterHeader = 0; //reset index
		while (res = csvParser(text, undefined, options, delimiter, indexAfterHeader, 0), indexAfterHeader = res.endIndex, res.result.length !== 1 && res.validCSV);
		
		if(res.validCSV){
			//remove null or empty values
			res.result[0]=array(res.result[0]).replaceNull(function(v,i){return options.headerPrefix+i});
			//make really unique values
			for (var i=0,len=res.result[0].length;i<len;i++){
				//array without current Element
				currentValue=res.result[0][i];
				while(res.result[0].indexOf(currentValue)<i&&res.result[0].indexOf(currentValue)>-1){
					//found value before that equals this
					splitValue=currentValue.split("_");
					if(splitValue.length===1){
						origName=splitValue[0];
						suffix=-1;
					}
					else{
						suffix=splitValue.pop();
						if(_isNumeric(suffix)&&Number(suffix)%1===0){
							suffix=Number(suffix);
							origName=splitValue.join("_");
						}
						else{
							origName=splitValue.concat(suffix).join("_");
							suffix=-1;
							
						}
						
					}
					currentValue=origName+"_"+(++suffix);
				}
				res.result[0][i]=currentValue;
			}
		}
		return res;
	}
	function formatResult(parsedCSV, headers) {
		parsedCSV.header = headers;
		if (!parsedCSV.validCSV) {
			parsedCSV.error.message = _errorMessages[parsedCSV.error.id];
		}
		return parsedCSV;
	}
	function rowArrayToText(row, d) {
		return row.map(function (v) {
			return valueToText(v);
		}).join(d);
	}
	function rowObjectToText(headers) {
		var h = headers.reduce(function (res, v, i) {
				res[v] = i;
				return res;
			}, {});
		return function (row, d) {
			var result = [];
			object(row).forEach(function (value, key) {
				if (!h.hasOwnProperty(key)) h[key] = Object.keys(h).length;
				result[h[key]] = valueToText(value);
			});
			return result.join(d);
		};
	}
	function valueToText(value) {
		//if value has delimiter, quote or RETURN or NEWLINE this is a quotedValue;
		//quotes should be replaced by doublequotes
		if (value === null)
			return "";
		else {
			return regexpFormat.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
		}
	}
	function arrayToObject(columns, prefix) {
		columns = Array.isArray(columns) ? columns : [];
		prefix = prefix || "field_";
		//make sure prefix is unique with respect to existing columns;
		prefix = columns.reduce(function (res, v) {
				while (v.substr(0, res.length) === res) {
					res = res + "_";
				}
				return res;
			}, prefix);
		return function (row) {
			return row.reduce(function (result, value, index) {
				var key = columns[index] || (prefix + index);
				result[key] = value;
				return result;
			}, {});
		};
	}
	
	function toArray(text, callBack, headers) {
		//returns array for each row, with header row as columns if specified in options
		//with optional callback on each row
		var h; //if options is set first row will always be filtered
		if (options.headersIncluded) {
			h = _getHeader(text); //we even do this when headers is set because the first row needs to be removed
			if (h.validCSV) {
				h = h.result[0];

			} else {
				return formatResult(h);
			}

		} else {
			h = [];
		}
		headers = headers || h;
		return formatResult(csvParser(text, callBack, options, delimiter, indexAfterHeader), headers);
	}
	function toObject(text, callBack, headers) {
		//returns object for each row, with header row if specified in options
		//with optional callback on each object row
		var converter,
		f,
		h;
		if (options.headersIncluded) {
			h = _getHeader(text); //we even do this when headers is set because the first row needs to be removed
			if (h.validCSV) {
				h = h.result[0];

			} else {
				return formatResult(h);
			}

		} else {
			h = [];
		}
		headers = headers || h;
		converter = arrayToObject(headers, options.headerPrefix);
		f = (callBack ? function (row, i) {
			return callBack(converter(row), i);
		}: converter);
		return formatResult(csvParser(text, f, options, delimiter, indexAfterHeader), headers);
	}
	function fromObject(rows, headers) {
		var d = String.fromCharCode(delimiter[0]),
		rowConv,
		mapF;
		headers = headers || [];
		rowConv = rowObjectToText(headers);
		mapF = function (row) {
			return rowConv(row, d);
		};
		headers = headers || [];
		rows.map(mapF);
		return [headers.map(function (v) {
				return valueToText(v);
			}).join(d)]
		.concat(rows.map(mapF))
		.join("\n");
	}
	function fromArray(rows, headers) {
		var d = String.fromCharCode(delimiter[0]),
		mapF = function (row) {
			return rowArrayToText(row, d);
		};
		headers = headers || [];
		return [mapF(headers)]
		.concat(rows.map(mapF))
		.join("\n");
	}
	
	return {
		toArray:toArray,
		toObject:toObject,
		fromObject:fromObject,
		fromArray:fromArray
	};
}

function csvParser(text, callBack, options, delimiter, startIndex, endLine) {
	//based on d3.csv but enhanced
	var QUOTE = 34; //only doublequote taken into account
	var NEWLINE = 10;
	var RETURN = 13;
	var SPACE = 32;
	var EOF = {};
	var EOL = {};
	var ERROR = {};
	endLine = (typeof endLine === "undefined" ? Infinity : Number(endLine));
	function parseRows(text) {
		var records = [], // output rows,
		record=[],
		recordF=[],
		valid = true,
		error = {},
		len = text.length,
		charIndex = startIndex || 0, // current character index
		line = 0, // current line number
		value, // current value
		eof = len <= 0, // current token followed by EOF?
		eol = false, // current token followed by EOL?
		emptyRecords = [];
		function setError(messageId) {
			error = {
				id: messageId,
				lineIndex: line,
				characterIndex: charIndex
			};
			valid = false;

		}
		function getNextValue() {
			var start,
			end,
			quoteFound,
			quotedValueIsTrimmable;
			var currentCharacter;
			if (eof)
				return EOF;
			if (eol)
				return eol = false, EOL;
			// Unescape quotes.
			function checkCRLF() {
				/*function check if the current character is NEWLINE or RETURN
				if RETURN it checks if the next is NEWLINE (CRLF)
				afterwards it sets the charIndex after the NEWLINE, RETURN OR CRLF and currentCharacter to the character at index charIndex*/
				//check if current character at charIndex is NEWLINE (set eol)
				//adds 1 to charIndex
				if ((currentCharacter = text.charCodeAt(charIndex++)) === NEWLINE)
					eol = true;
				//checks if equal to RETURN
				else if (currentCharacter === RETURN) {
					eol = true;
					//checks next character equal to NEWLINE and adds 1 to charindex (total =2)
					if (text.charCodeAt(charIndex) === NEWLINE)
						++charIndex;
				}
				return eol;
			}
			start = charIndex;
			quoteFound = false;
			quotedValueIsTrimmable = (text.charCodeAt(start) !== QUOTE ? options.spaceAllowedBetweenDelimiterAndQuote : true);
			while (charIndex < len) {
				if (!quoteFound) {
					if (checkCRLF() || ~delimiter.indexOf(currentCharacter))
						return text.slice(start, charIndex - 1);
					else if (currentCharacter === QUOTE) {
						/*start of quoted values*/
						quoteFound = true;
						start = charIndex; //1 added via checkCRLF, so it starts after quote
					} else if (currentCharacter !== SPACE)
						quotedValueIsTrimmable = false;
				} else if (quotedValueIsTrimmable) {
					//quoted value was Started and was trimmable
					while (charIndex < len && text.charCodeAt(charIndex++) !== QUOTE || text.charCodeAt(charIndex++) === QUOTE); //charIndex is set at 2nd character after last quote
					charIndex = charIndex - 2; //go back to quote
					end = charIndex;
					//check for only spaces till next delimiter or linebreak or EOF
					if (options.spaceAllowedBetweenDelimiterAndQuote) {
						while (charIndex < len && text.charCodeAt(++charIndex) === SPACE); //charindex points to position just on last caracter not equal to space
					} else
						charIndex++; //charindex points to position just after last quote
					if (checkCRLF() || (eof = (charIndex >= len)) || ~delimiter.indexOf(currentCharacter))
						return text.slice(start, end).replace(/""/g, "\""); //position after linebreak or delimiter
					else {
						//raise Error
						setError("incorrectTrailingQuote");
						return ERROR;
					}

				} else {
					//raise error
					setError('incorrectQuote');
					return ERROR;
				}
			}
			// Return last token before EOF.
			return eof = true, text.slice(start, len);
		}
		function getResult() {
			var lastRow = (records.length - 1);
			var emptyRecordsGrouped = array(emptyRecords).groupSequence(function (a, b) {
					return (b - a) === 1;
				});
			var rowsToRemove = [];
			for (var i = 0, l = emptyRecordsGrouped.length; i < l; i++) {
				if ((options.removeLeadingEmptyRows && (emptyRecordsGrouped[i][0] === 0)) ||
					((options.removeInnerEmptyRows && (emptyRecordsGrouped[i][0] !== 0) &&
							(emptyRecordsGrouped[i][emptyRecordsGrouped[i].length - 1] !== lastRow))) ||
					(options.removeTrailingEmptyRows && (emptyRecordsGrouped[i][emptyRecordsGrouped[i].length - 1] === lastRow))) {
					rowsToRemove = rowsToRemove.concat(emptyRecordsGrouped[i]);
				}
			}
			return {
				result: records.filter(function (x, i) {
					return !~rowsToRemove.indexOf(i);
				}), //takes little time is negligeable
				emptyRecordLines: emptyRecords,
				error: error,
				validCSV: valid,
				startIndex: startIndex,
				endIndex: charIndex
			};
		}
		while (line <= endLine && (value = getNextValue()) !== EOF && valid) {
			record = [];
			recordF = [];
			while (value !== EOL && value !== EOF && value !== ERROR) {
				if (options.trimValues) {
					value = value.trim();
				}
				if (options.emptyValuesAreNull && !value.length) {
					value = null;
				}
				record.push(value);
				if (!eol && options.treatConsecutiveDelmitersAsOne) {
					while (charIndex < len && ~delimiter.indexOf(text.charCodeAt(charIndex++)));
					charIndex--;
				}
				value = getNextValue();
			}
			if (valid) {
				recordF = callBack ? callBack(record, line) : record;
				if (recordF != null && (!record.length || record.join("").length === 0)) {
					//empty row so we add to empty records
					emptyRecords.push(line);
				}
				line++;
				if (recordF == null)
					continue;
				records.push(recordF);
			}
		}
		return getResult();
	}
	return parseRows(text);

}

//var { object } =require("@xassist/xassist-object");
function getDecimal(num){
	return+((num<0?"-.":".")+num.toString().split(".")[1])||0
}


var _durationRegexp=[
		{key:"year",re:			/(-?\d*(?:[.,]\d*)?)(?:[ ]?y|Y|years?|Years?)(?![a-zA-z])/g}, //years component
		{key:"month",re:			/(-?\d*(?:[.,]\d*)?)(?:[ ]?M|months?|Months?)(?![a-zA-z])/g}, //months component
		{key:"day",re:				/(-?\d*(?:[.,]\d*)?)(?:[ ]?d|D|days?|Days?)(?![a-zA-z])/g}, //days component
		{key:"hour",re:			/(-?\d*(?:[.,]\d*)?)(?:[ ]?h|H|hours?|Hours?)(?![a-zA-z])/g}, //hours component
		{key:"minute",re:			/(-?\d*(?:[.,]\d*)?)(?:[ ]?m|mins?|Mins?|minutes?|Minutes?)(?![a-zA-z])/g}, //minutes component 
		{key:"second",re:		/(-?\d*(?:[.,]\d*)?)(?:[ ]?s|S|secs?|Secs?|seconds?|Seconds?)(?![a-zA-z])/g}, //seconds component
		{key:"millisecond",re:	/(-?\d*(?:[.,]\d*)?)(?:[ ]?ms|millis?|m[sS]ecs?|m[sS]econds?|milli[sS]ecs?|milli[sS]econds?)(?![a-zA-z])/g}, //milliseconds component
	];
/* regexp explanation for each component eg for year
	/								//start regexp
		(									//capturing group 1 number of years
			-?									//optional negative number
			\d*								//zero or more digits
			(?:								//non capturing group
				[.,]								//matches single character (point or ,)
				\d*								//zero or more digits
			)?									//optional could be omitted
		)									//capturing group finished (matches on 1.25|0.25|1000|1.|.|.5 or with a comma.)
		(?:								//non capturing group (years)
			[ ]?								//optional space
			y|Y|years?|Years?			//y or Y or year or years or Year or Years
		)									//closes group for (y||Y||year||years||Year||Years)
		(?![a-zA-z])					//negative lookahead everything except a-z or A-Z
	/g							//global match
*/

function _parseDurationString(d,durStr){
	var matchMade;
	//parse string
	//eg 1y1M1d1h1m1s1ms
	//abbrev
	for(var i=0,len=_durationRegexp.length;i<len;i++){
		
		//for multiple matches on same regegexp we could use exec
		while (matchMade = _durationRegexp[i].re.exec(durStr)) {
			d[_durationRegexp[i].key]+=parseFloat((matchMade[1]||"0").replace(",","."));
		}
	}
	return d;
}
var duration=function(){
	
	return new XaDuration([].slice.call(arguments));
};
function XaDuration(initArray){
	
	this.year=0;
	this.month=0;
	this.day=0;
	this.hour=0;
	this.minute=0;
	this.second=0;
	this.millisecond=0;
	this.normalized=false;
	//this.dayReserve=0; //hold converted month decimals in days, to calculate when really needed
	this.init(initArray);
	
}
XaDuration.prototype._keyOrder=[ 'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond' ];
XaDuration.prototype.init=function(a){
	if (a.length===1){
		if(typeof a[0]==="string"){
			_parseDurationString(this,a[0]);
		}
		else if(typeof a[0]==="number"){
			//milliseconds is default value
			this.millisecond+=a[0];
		}
		else if(typeof a[0]==="object"){
			object(this).mergeUnique(a[0]);
		}
	}
	if(a.length>1){
		a.forEach(function(val,i){
			//console.log(val,i,wantedKeys[i],this[wantedKeys[i]])
			if(i<this._keyOrder.length&&typeof val==="number"){ 
				this[this._keyOrder[i]]+=val;
			}
		},this);
	}
	
};

/*
we should normalize the floating values to do calculations with dates
this works for 
- s=>milisecs (*1000)
- min=>sec (*60)
- hr=>min (*60)
- day=>hr (*24)
- year=>month (*12)
exception
-month=>day (*30 or *31 or *28 or even *29)
So there is a break in normalization between day and month setting apart month and year!
*/
var _conversionCoefficients={
	year:{
		coeff:7/(30.436875*12),
		exactType:"big"
	},
	month:{
		coeff:7/30.436875,
		exactType:"big"
	},
	week:{
		coeff:1,
		exactType:"small"
	},
	day:{
		coeff:7,
		exactType:"small"
	},
	hour:{
		coeff:168,
		exactType:"small"
	},
	minute:{
		coeff:10080,
		exactType:"small"
	},
	second:{
		coeff:604800,
		exactType:"small"
	},
	millisecond:{
		coeff:604800000,
		exactType:"small"
	}
};
XaDuration.prototype.normalize=function(exact){
	exact=(typeof exact==="undefined"?true:!!exact);
	//first we normalize up to upscale the factors thats needed like 12months becomes 1 year

	
	this.normalizeUp(exact);

	//the only factor that is decimal is the one from day to month so
	//after upscaling the only attribute potentially remaining decimal is day
	//now we can normalize down to eliminate decimals
	if(!this.normalized){
		this.normalizeDown(exact);
		//this could introduce other scaling factors that should be upscaled (added hours so hours fall above 24 or lower)
		//since those all fall lower then day we should only once scale up if necessary (but we put true to be sure to not change months
		this.normalizeUp(true);
	}

	
};



XaDuration.prototype.normalizeDown=function(exact){
	var key,dec,nextKey,factor;
	exact=(typeof exact==="undefined"?true:!!exact);
	for (var i=0,len=this._keyOrder.length;i<len;i++){
		key=this._keyOrder[i];
		nextKey=this._keyOrder[i+1];
		if(nextKey){
			factor=this.getConversionFactor(key,nextKey);
			if(!exact||factor.exact){
				dec=getDecimal(this[key]);
				this[key]=this[key]-dec;
				this[nextKey]+=dec*factor.factor;
			}
		}
	}
	//month is only one that can be decimal because only conversion thaht can be skipped with exact
	//we should not check millisecond because it is allowed to be decimal 
	this.normalized=((getDecimal(this.month))===0);
	return this;
};
XaDuration.prototype.normalizeUp=function(exact){
	var key,nextKey,factor,oldVal,i=this._keyOrder.length,normalized=true;
	exact=(typeof exact==="undefined"?true:!!exact);
	while(i--){
		key=this._keyOrder[i];
		nextKey=this._keyOrder[i-1];
		if(nextKey){
			factor=this.getConversionFactor(nextKey,key);
			if(!exact||factor.exact){
				oldVal=this[key];
				this[key]=oldVal%factor.factor;
				this[nextKey]+=(oldVal-this[key])/factor.factor;
			}
		}
		if(i!==this._keyOrder.length-1){
			normalized=normalized&&((this[key]*10%10/10)===0);
		}
	}
	this.normalized=normalized;
	return this;
};
XaDuration.prototype.getConversionFactor=function(fromUnit,toUnit){
	if(_conversionCoefficients.hasOwnProperty(fromUnit)&&_conversionCoefficients.hasOwnProperty(toUnit)){
		return {
			factor:(_conversionCoefficients[toUnit].coeff/_conversionCoefficients[fromUnit].coeff),
			exact:(_conversionCoefficients[toUnit].exactType===_conversionCoefficients[fromUnit].exactType)
		}
	}
	else{
		throw new TypeError("Invalid unit conversion type");
	}
};
XaDuration.prototype.valueOf=function(){
	//returns number of milliseconds
	var result=0,key;
	for (var i=0,len=this._keyOrder.length;i<len;i++){
		key=this._keyOrder[i];
		result+=(this.getConversionFactor(key,"millisecond").factor*this[key]);
	}
	return result
};
XaDuration.prototype.toString=function(){
	var result=[],key,v=this.valueOf(),dur=duration(Math.abs(v));
	dur.normalize(false);
	for (var i=0,len=this._keyOrder.length;i<len;i++){
		key=this._keyOrder[i];
		if(dur[key]!==0){
			result.push(dur[key]+" "+key+(dur[key]>1?"s":""));
		}
	}
	if(v<0){
		result.push("ago");
	}
	return result.join(' ')+".";
};
XaDuration.prototype.format=function(tolerance){
	//tolerance is the relative tolerance that may be accepted in the string representation
	//tolerance is a percentage eg 0.01=1% and should be given as a numeric value<1 
	//if tolerance is given as 1 just the largest component
	//decimals are never given 3.5 years is represented as 3 years 6 months 
	var result=[],key,
		v=this.valueOf(),
		absV=Math.abs(v),
		dur=duration(absV), //clone duration
		currentVal=0,
		relError=1;
	if(!tolerance){
		return this.toString();
	}
	tolerance=Math.abs(tolerance);
	tolerance=tolerance>1?1:tolerance;
	dur.normalize(false);

	for (var i=0,len=this._keyOrder.length;i<len&&relError>=tolerance;i++){
		key=this._keyOrder[i];
		if(dur[key]!==0){
			currentVal+=dur[key]*this.getConversionFactor(key,"millisecond").factor;
			result.push(dur[key]+" "+key+(dur[key]>1?"s":""));
			relError=1-currentVal/absV;

		}
		
	}
	//check if we could lower the relError by adding 1 to last found key (ex. rounding 3.5 years to 4)
	currentVal+=1*this.getConversionFactor(key,"millisecond").factor;
	if(relError>=(-1+currentVal/absV)){ //new relative error is negative because we are rounding up
		result.push(result.pop().split(" ").map(function(v,i){return (i==0?+v+1:v)}).join(" "));
	}	
	if(v<0){
		result.push("ago");
	}
	return result.join(' ')+".";
};
XaDuration.prototype.addDuration=function(dur){
	var key,i,len;
	for (i=0, len=this._keyOrder.length;i<len;i++){
		key=this._keyOrder[i];
		if(dur.hasOwnProperty(key)&&typeof dur[key]==="number"){
			this[key]+=dur[key];
		}
	}
	return this;
};
XaDuration.prototype.removeIntervalOfType=function(type,value){
	
	if(~this._keyOrder.indexOf(type) ){
		value=(typeof value==="number"?value:this[type]);
		this[type]-=value;
		return value;
	}
	else{
		return 0;
		//throw typeError("Invalid interval type");
	}
};
XaDuration.prototype.normalizeMonth=function(numberOfDays){
	var dec=getDecimal(this.month);
	this.month=this.month-dec;
	this.day+=numberOfDays*dec;
	return this.normalizeDown();
};

var _dateDict = {
		days:{
			defaultKey:"long",
			"abbreviation" : ["S", "M", "T", "W", "T", "F", "S"],
			"short":["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			"long":["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
		},
		month:{
			defaultKey:"long",
			"abbreviation" : ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
			"short": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			"long": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		}
	},
	_leapYear=function(year)
	{
		//year not divisible by 4 => no leapyear (year % 4 == year & 3 (bitwise AND x%2^n===x&2^(n-1) bit wise and)
		//else: year not divisible by 100 => leapyear (year % 4 => check year%25
		//else year divisble by 400 => leapyear ( (year %400) knwoing that year%25==0=>year%16 or year & 15)
		year=((typeof year==="undefined")?new Date().getFullYear():year);
		if(year>0||year<0){
			return ((year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0));
		}
		return undefined;
	},
	_maxNumberofDays=function(month,year){
		var leap;
		month=((typeof month==="undefined")?new Date().getMonth()+1:month);
		if(month===2){
			leap=_leapYear(year);
			return (typeof leap==="undefined"?leap:(leap?29:28))
		}
		else {
			return [31,28,31,30,31,30,31,31,30,31,30,31][month-1]
		}
	},
	_validDate = function (d) {
		if (Object.prototype.toString.call(d) === "[object Date]") {
			// it is a date
			if (isNaN(d.getTime())) { // d.valueOf() could also work
				// date is not valid
				return false;
			} else {
				// date is valid
				return true;
			}
		} else {
			// not a date
			return false;
		}
	},
	_dateRegExp=/^(\d{4}|\d{2}|[1-2]?\d{1}|3[0-1])[-/\\.](0?[1-9]|[1-2]\d{1}|3[0-1])[-/\\.](\d{4}|\d{2}|[1-2]?\d{1}|3[0-1])(?:[T ]([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:[.,](\d*)?)?)?)?$/i;
	/*regexp for datetime matching
		^ 							//strings starts with
		( 							//capturing group 1 (year or day)
			\d{4}					//YYYY
			|						//or
			\d{2}					// YY or DD (01-31), difference not captured
			|						//or
			[1-2]?\d{1}				// D (1-29) ! 0 is allowed
			|						//or
			3[0-1]					// D (30-31)
		)
		[							//date-split:match single character from list
			-						//dash
			/						//forward slash 
			\\						//back slash escaped
			.						//point 
		]							//end list
		(							//capturing group 2 (month)
			0?[1-9]					//optional 0 and 1-9 (1-9 or 01-09)
			|
			[1-2]?\d{1}				// D (1-29) ! 0 is allowed
			|						//or
			3[0-1]					// D (30-31)
		)
		[							//date-split:match single character from list
			-						//dash
			/						//forward slash 
			\\						//back slash escaped
			.						//point 
		]							//end list
		( 							//capturing group 3 (year or day)
			\d{4}					//YYYY
			|						//or
			\d{2}					// YY or DD (01-31), difference not captured
			|						//or
			[1-2]?\d{1}				// D (1-29) ! 0 is allowed
			|						//or
			3[0-1]					// D (30-31)
		)
		(?:							//non capturing group (time)
			[T ]					//1 character from list (T or space)
			(						//captruing group 4: hour
				[0-1]\d|2[0-3]		//00-19 or 20-23
			)
			:						//matches colon ":"
			(						//capturing group 5: minutes
				[0-5]\d				//00-59
			)				
			(?:						//non capturing group (seconds and milliseconds)
				:					//matches colon ":"
				(					//capturing group 6: seconds
					[0-5]\d			//00-59
				)			
				(?:					//non capturing group (milliseconds)
					[.,]			//matches single character (point or ,)
					(				//capturing group 7
						\d*			//any number of digits
					)?				//optional could be omitted
				)?					//optional could be omitted
			
			)?						//optional could be omitted
		
		
		
		)?							//optional, could be omitted
		$							//string end here
	*/
	//date functionality
	//date functionality
var _getWeekDay= function (/*index,*/type, startindexOfWeek, zeroBased) {
	var onDateObj=0,index;

	if (this && this.constructor && this.constructor.name==="XaDate") {
		onDateObj=1;
	}
	index = (onDateObj?this.getDay():arguments[0]||0);
	type = (""+arguments[1-onDateObj]||_dateDict.days.defaultKey).toLowerCase();
	startindexOfWeek = (onDateObj?0:arguments[2]||0);
	zeroBased = (onDateObj?true:!!(typeof arguments[3]!=="undefined"? arguments[3]:true));
	
	index =((index - (zeroBased ? 0 : 1) + startindexOfWeek) % 7);
	type=(!_dateDict.days.hasOwnProperty(type)?_dateDict.days.defaultKey:type);
	index=(index<0?7+index:index);
	return _dateDict.days[type][index];
};
var _getMonth=function (/*index,*/type, zeroBased) {
	var onDateObj=0,index;
	if (this &&this.constructor &&  this.constructor.name==="XaDate") {
		onDateObj=1;
	}
	index = (onDateObj?this.getMonth():arguments[0]||0);
	type = (""+arguments[1-onDateObj]||_dateDict.month.defaultKey).toLowerCase();
	type=(!_dateDict.month.hasOwnProperty(type)?_dateDict.month.defaultKey:type);
	zeroBased = (onDateObj?true:!!(typeof arguments[2]!=="undefined"? arguments[2]:true));
	index = ((index - (zeroBased ? 0 : 1)) % 12);
	index=index<0?12+index:index;
	return _dateDict.month[type][index];
};
var _testDateFormat=function(day,month,year){
	return day<=_maxNumberofDays(month,year);
};

var date=function() {
	return new XaDate([].slice.call(arguments));
	
};

date.isValidDateString=function (str) {
		var dateObj={
				valid:false,
				format:[]
			},
			matchRes=str.match(_dateRegExp),
			p1,p3,p2,p1Year,p3Year,possibleFormats=[];
		if(matchRes){
			p1=parseInt(matchRes[1]);
			//dateObj.month=parseInt(matchRes[2]);
			p2=parseInt(matchRes[2]);
			p3=parseInt(matchRes[3]);
			//we assume hours and minutes is (mostly) defined
			//seconds and milliseconds is not (always) defined
			dateObj.hours=parseInt(matchRes[4]||0); //fastest comparison if matchRes[4] is defined
			dateObj.minutes=parseInt(matchRes[5]||0); //fastest comparison if matchRes[5] is defined
			dateObj.seconds=(matchRes[6]?parseInt(matchRes[6]):0);//faster comparison for undefined in stead of "or"
			dateObj.milliSeconds=(matchRes[7]?parseInt(matchRes[7]):0); //faster comparison for undefined in stead of "or"
			dateObj.valid=true;
			dateObj.multipleFormats=false;
			var numberToYear=function(y){
				return (y<100?(y>50?1900+y:2000+y):y)
			};
			p1Year=numberToYear(p1);
			p3Year=numberToYear(p3);
			possibleFormats=[
				{	day:p1,month:p2,year:p3Year,format:"DMY"},
				{	day:p3,month:p2,year:p1Year,format:"YMD"},
				{	day:p2,month:p1,year:p3Year,format:"MDY"},
				{	day:p2,month:p3,year:p1Year,format:"YDM"}
			].filter(function(x){return (x.day<32&&x.month<13&&_testDateFormat(x.day,x.month,x.year));});
			if(!possibleFormats.length){
				return false;
			}
			else {
				dateObj.day=[];
				dateObj.month=[];
				dateObj.year=[];
				dateObj.multipleFormats=true;
				dateObj.format=[];
				possibleFormats.forEach(function(x){
					dateObj.day.push(x.day);
					dateObj.month.push(x.month);
					dateObj.year.push(x.year);
					dateObj.format.push(x.format);
				});
				return dateObj;
			}
			
		}
		else{
			return false;
		}
		
	};
date.stringToDate = function (str,format) {
		var dateObj=date.isValidDateString(str);
		if(dateObj){

				//rewrite format to index of assigned format
				if(typeof format!=="string"){
					format=0;
					
				}
				else {
					format=dateObj.format.indexOf(format.toUpperCase());
					if(format===-1){
						return false;
					}
				}	


			return date(dateObj.year[format],dateObj.month[format]-1,dateObj.day[format],dateObj.hours,dateObj.minutes,dateObj.seconds,dateObj.milliSeconds);
		}
		else{
			return false;
		}
	};
function XaDate(inputArray) {
	var x = new(Function.prototype.bind.apply(
				Date, [Date].concat(inputArray)));
	Object.setPrototypeOf(x, XaDate.prototype);
	return x;
}
//Object.setPrototypeOf(XaDate, XaDate.prototype);
Object.setPrototypeOf(XaDate.prototype, Date.prototype);
XaDate.prototype.isValid = function () {
	return  _validDate(this);
};
/*if date is not set:4arguments: index of weekday,type,startindexOfWeek and zeroBased
else index=date.getDay();*/
/*TODO adapt arguments optional, ...*/
date.getWeekDay=_getWeekDay.bind(null);
date.month =_getMonth.bind(null);
XaDate.prototype.getWeekDay =_getWeekDay;
XaDate.prototype.month =_getMonth;
XaDate.prototype.isLeapYear =function(){
	return (this.isValid()?_leapYear(this.getFullYear()):undefined);
};
date.isLeapYear = _leapYear;
XaDate.prototype.daysInMonth =function(){
	return  (this.isValid()?_maxNumberofDays(this.getMonth()+1,this.getFullYear()):undefined);
};
date.daysInMonth = _maxNumberofDays;
XaDate.prototype._addSmall=function(dur){
	this.addDays(dur.removeIntervalOfType("day"));
	this.addHours(dur.removeIntervalOfType("hour"));
	this.addMinutes(dur.removeIntervalOfType("minute"));
	this.addSeconds(dur.removeIntervalOfType("second"));
	this.addMilliseconds(dur.removeIntervalOfType("millisecond"));
	return this;
};
XaDate.prototype._addBig=function(dur){
	//console.log("before: "+this.toLocaleString())
	var currentDay=this.getDate(),currentMonth;
	var decMonth=dur.month*10%10/10;
	var groundMonth=dur.month-decMonth;
	this.addYears(dur.removeIntervalOfType("year"));
	this.addMonths(dur.removeIntervalOfType("month",groundMonth));
	//remove rounding errors
	dur.month=decMonth;
	//we get month and set date date
	currentMonth=this.getMonth();
	this.setDate(currentDay);
	if (this.getMonth() !== currentMonth){
		this.setDate(0); //go back to last day of previous month;
	}
	//console.log("after: "+this.toLocaleString()+")
	
};
XaDate.prototype.format=function(formatStr){
	/*
	//formatStr can be
	//d: day without leading zero
	//dd: day with leading zero
	//ddd: short day string
	//dddd: long day string
	//ddddd:single letter day string (may be more d's)
	//M:month without leading zero
	//MM or Mm:month with leading zero
	//mmm: short month string
	//mmmm: long month string
	//mmmmm: single letter month (may be more m's)
	//y or yy: 2digit year
	//yyy or yyyyyy: 4digit year
	//h: hour without leading zero
	//hh:hour with leading zero (or more h's)
	//m: minute without leading zero
	//mm: minute with leading zero
	//s: second without leading zero
	//ss: second with leading zero (or more s's)
	//.000 or ,000: any number of zero's is for the deci,centi,milliseconds, ...
	//all other characters are repeated as such in the string
	//the difference between m for minutes or month is made by the capitalization, at least one of the m's for (a one or two letter match) should be capitalized for months
	//all other strings could be capitalized or not.
	//to escape the characters use a ^  before the matching character eg ^mmm prints mmm
	*/
	
	/*var matchingChars=["d","D","m","M","y","Y","h","H","s","S",".",","];
	var result="";
	var matchingCombos={
		day:/(?:[^\\/dD]|^)([dD]+)/,
		month:/(?:[^\\/Mm]|^)(M[Mm]?|[Mm]{3,})/,
		year:/(?:[^\\/yY]|^)([yY]+)/,
		hour:/(?:[^\\/hH]|^)([hH]+)/,
		minute:/(?:[^\\/m]|^)(m{1,2})/,
		second:/(?:[^\\/sS]|^)([sS]+)/,
		millisecond:/(?:[^\\/,.]|^)([,.]0+)/
	}*/
	var matchResult={
		month:[
			function(d){return (d.getMonth()+1).toString();},
			function(d){return ("0"+(d.getMonth()+1)).slice(-2);},
			function(d){return d.month("short");},
			function(d){return d.month("long");},
			function(d){return d.month("abbreviation");}
		],
		day:[
			function(d){return (d.getDate()).toString();},
			function(d){return ("0"+d.getDate()).slice(-2);},
			function(d){return d.getWeekDay("short");},
			function(d){return d.getWeekDay("long");},
			function(d){return d.getWeekDay("abbreviation");}
		],
		year:[
			function(d){return d.getFullYear().toString().slice(-2)},
			function(d){return d.getFullYear().toString();},
		],
		/*minute:[
			function(d){return (d.getMinutes()).toString();},
			function(d){return ("0"+d.getMinutes()).slice(-2);}
		],
		hour:[
			function(d){return (d.getHours()).toString();},
			function(d){return ("0"+d.getHours()).slice(-2);}
		],
		second:[
			function(d){return (d.getSeconds()).toString();},
			function(d){return ("0"+d.getSeconds()).slice(-2);}
		],*/
		time:[
			function(d,fn){return (d[fn]()).toString();},
			function(d,fn){return ("0"+d[fn]()).slice(-2);}
		],
		millisecond:[
			function(d,len){return d.getMilliseconds().toString().slice(0,len);}
		]
	};
	var me=this;
	function getFormattedString(matchType){
		var firstChar=matchType[0];
		var matchLength=matchType.length;
		if (firstChar==="M"||(firstChar==="m"&&matchLength>2)){
			return matchResult.month[Math.min(matchLength,5)-1](me);
		}
		else if (firstChar==="d"||firstChar==="D"){
			return matchResult.day[Math.min(matchLength,5)-1](me);
		}
		else if (firstChar==="y"||firstChar==="Y"){
			return matchResult.year[(matchLength>2)+0](me);
		}
		else if (firstChar==="m"&&matchLength<3){
			return matchResult.time[matchLength-1](me,"getMinutes");
		}
		else if (firstChar==="s"||firstChar==="S"){
			return matchResult.time[Math.min(matchLength,2)-1](me,"getSeconds");
		}
		else if (firstChar==="h"||firstChar==="H"){
			return matchResult.time[Math.min(matchLength,2)-1](me,"getHours");
		}
		else if (firstChar==="."||firstChar===","){
			return matchResult.millisecond[0](me,matchLength-1);
		}
	}
	//var reDateString=/(?:[^\\/dD]|^)[dD]+|(?:[^\\/Mm]|^)M[Mm]?|[Mm]{3,}|(?:[^\\/yY]|^)[yY]+|(?:[^\\/hH]|^)[hH]+|(?:[^\\/m]|^)m{1,2}|(?:[^\\/sS]|^)[sS]+|(?:[^\\/,.]|^)[,.]0+/g;
	var reDateString=/[\s\S]([dD]+|M[Mm]?|[Mm]{3,}|[yY]+|[hH]+|m{1,2}|[sS]+|[,.]0+)/g;
	return ("1"+formatStr).replace(reDateString,function(m){
		var firstChar=m[0],match=m.slice(1);
		if(firstChar==="^"){
			return match;
		}
		else{
			return firstChar+getFormattedString(match);
		}
	}).slice(1)
};
XaDate.prototype.until=function(otherDate){
	if(!_validDate(otherDate)){
		//try to create other date object
		otherDate=new XaDate([].slice.call(arguments));
	}
	if(!otherDate.isValid()){
		throw new TypeError('until() needs a date or parseable dateargumenrs');
	}
	return duration(otherDate.valueOf()-this.valueOf());
	
	
};
XaDate.prototype.add=function(dur/*,firstBig*/){
	//console.log(dur);
	var args=[].slice.call(arguments);
	var firstBig=args.pop();
	if(typeof firstBig!=="boolean"){
		args.push(firstBig);
		firstBig=true; //this makes a difference in subtracting durations
	}
	//console.log(dur);
	if(dur.constructor.name!=="XaDuration"){
		dur=duration.apply(null,args);
	}
	
	dur.normalizeDown();
	if (firstBig){
		this._addBig(dur);
		dur.normalizeMonth(this.daysInMonth());
	}
	//console.log(dur)
	this._addSmall(dur);
	if(!firstBig){
		dur.normalizeMonth(this.daysInMonth());
		this._addSmall(dur); 
		this._addBig(dur);
		
	}
	return this;
};
XaDate.prototype.addMonths=function(m){
	//faster implementation than datejs
	var day,month;
	if(typeof m!=="number"){
		return this;
	}
	day=this.getDate();
	this.setMonth(this.getMonth() + m, 1);
	month=this.getMonth();
	this.setDate(day);
	if (this.getMonth() !== month){
		this.setDate(0); //go back to last day of previous month;
	}
    return this;
};
XaDate.prototype.addYears=function(y){
	//faster implementation than datejs
	var month;
	if(typeof y!=="number"){
		return this;
	}
	month=this.getMonth();
	//day=this.getDate()
	this.setFullYear(this.getFullYear() + y,month);

	if (this.getMonth() !== month){
		this.setDate(0); //go back to last day of previous month;
	}
    return this;
};
XaDate.prototype.addDays=function(d){

	if(typeof d!=="number"){
		return this;
	}
	this.setDate(this.getDate()+d); 
    return this;
};
XaDate.prototype.addHours=function(h){

	if(typeof h!=="number"){
		return this;
	}
	this.setHours(this.getHours()+h); 
    return this;
};
XaDate.prototype.addMinutes=function(m){

	if(typeof m!=="number"){
		return this;
	}
	this.setMinutes(this.getMinutes()+m); 
    return this;
};
XaDate.prototype.addSeconds=function(s){

	if(typeof s!=="number"){
		return this;
	}
	this.setSeconds(this.getSeconds()+s); 
    return this;
};
XaDate.prototype.addMilliseconds=function(m){

	if(typeof m!=="number"){
		return this;
	}
	this.setMilliseconds(this.getMilliseconds()+m); 
    return this;
};

function dom(e){
return new XaDOMelement(e);
}
function XaDOMelement(e){
this.e=e;
}


XaDOMelement.prototype={
	addClass:function(c){
		this.e.className = this.e.className+" "+c;
		return this;
	},
	removeClass:function(c){
		this.e.className = this.e.className.replace( new RegExp('(?:^|\\s)'+c+'(?!\\S)','g') ,'');
		return this;
	},
	hasClass:function(c){
		return (new RegExp('(?:^|\\s)'+c+'(?!\\S)').test(this.e.className));
	},
	replaceClass:function(c,d){
		this.e.className =this.e.className.replace( new RegExp('(?:^|\\s)'+c+'(?!\\S)') ,' '+d);
		return this;
	},
	toggleClass:function(c,t){
		t=((typeof t==="undefined")?!this.hasClass(c):!!t);
		if(t){
			return this.addClass(c);
		}
		else{
			return this.removeClass(c);
		}
	},
	attr:function(a,t){
		this.e.setAttribute(a,t);
		return this;
	},
	parents:function(){
		var p = [],
			el=this.e;
		while (el) {
			p.unshift(new XaDOMelement(el));
			el = el.parentNode;
		}
		return p;
	},
	isVisible:function(){
		//for documetn clientrect does not exist=> so return true
		return !!( this.e.offsetWidth || this.e.offsetHeight || (typeof this.e.getClientRects==="undefined"?true:this.e.getClientRects().length));	
	},
	getDimensions : function() {
		//does not include margin (but padding is included)
		var props = { position: 'absolute', visibility: 'hidden', display: 'block' },
			dim = {},old={},oldProps=[],//first element is document so we doe not change
			i,len,
			hiddenParents;
		if(this.isVisible()){
			//performance=>check if visible
			return this.e.getBoundingClientRect();
		}
		hiddenParents=this.parents();
		for(i=1, len=hiddenParents.length;i<len;i++){
		//hiddenParents.forEach(function(el) {
			
			
			//if(!hiddenParents[i].isVisible()){ 
			if(hiddenParents[i].e.style.display==="none"){ 
				old = {elm:hiddenParents[i]};
				//if this parent is visible, we will not change
				Object.keys(props).forEach(function(name){
					old[ name ] = hiddenParents[i].e.style[ name ];
					hiddenParents[i].e.style[ name ] = props[ name ];
					
				});
			//}
			
				oldProps.push(old);
				//if(this.isVisible()){break;} //performance check but doens not do much=> limiting factor is browser reflow
			}
			
		}
		dim= this.e.getBoundingClientRect();
		len=oldProps.length;
		for(i=0;i<len;i++){
			Object.keys(props).forEach(function(name){
				oldProps[i].elm.e.style[ name ]=oldProps[i][name];
			});
		}
		return dim;
	}
};

function XaAggregator(add,remove,initial,get){
	this.addFn=add||function(currentValue){return ++currentValue;};
	this.removeFn=remove||function(currentValue){return --currentValue;};
	this.initialFn=initial||function(){return 0;};
	this.getValue=get||function(){return this.value;};
	//init value
	this.reset();
}
XaAggregator.prototype.add=function(record){
	this.value=this.addFn(this.value,record);
	return this;
};
XaAggregator.prototype.remove=function(record){
	//maybe other parameters like index fro rolling average
	this.value=this.removeFn(this.value,record);
	return this;
};
XaAggregator.prototype.reset=function(){
	this.value=this.initialFn();
	return this;
};
XaAggregator.prototype.addArray=function(array){
	for(var i=0,len=array.length;i<len;i++){
		this.add(array[i]);
	}
	return this;
};
XaAggregator.prototype.removeArray=function(array){
	for(var i=0,len=array.length;i<len;i++){
		this.remove(array[i]);
	}
	return this;
};

function count(){
	return new XaAggregator();
}

function sum(attr){
	var add,remove;
	if(!attr){
		add=function(c,r){return c+(+r||0);};
		remove=function(c,r){return c-(+r||0);};
	}
	else{
		add=function(c,r){return c+(+r[attr]||0);};
		remove=function(c,r){return c-(+r[attr]||0);};
	}
	return new XaAggregator(add,remove);
}

/**
 *  we do not check if the element removed was really part of the original elements added
 *  this means that the average may be infinity!!
 */

function average(attr){
	var add,remove;
	if(!attr){
		add=function(c,r){return {sum:c.sum+(+r||0),len:++c.len};};
		remove=function(c,r){return {sum:c.sum-(+r||0),len:--c.len};};
	}
	else{
		add=function(c,r){return {sum:c.sum+(+r[attr]||0),len:++c.len};};
		remove=function(c,r){return {sum:c.sum-(+r[attr]||0),len:--c.len};};
	}
	return new XaAggregator(add,remove,
		function(){
			return {
				sum:0,
				len:0
			}
		},
		function(){return this.value.sum/this.value.len}
	);
}

function wellford(wPrevious,currentvalue){
	var d=currentvalue-wPrevious.mean;
	wPrevious.sum+=currentvalue;
	wPrevious.len++;
	wPrevious.mean+=(d)/(wPrevious.len);
	wPrevious.s+=d*(currentvalue-wPrevious.mean);
	return wPrevious;
}
function getEstimatorsWelford(w){
	var n,avg,s,v,se;
	n=w.len;
	avg=w.mean;
	//v=sample variance=> divide by n-1 (bessels correction)
	v=w.s/(n-1);
	s=Math.sqrt(v);
	se=s/Math.sqrt(n);
	return {
		standardDeviation:s,
		average:avg,
		length:n,
		variance:v,
		standardError:se,
		sum:w.sum
	};
}

function simpleStats(attr){
	//problem with calculation of variance (sumSquared-(sum*sum)/n)/(n-1)
	//this can lead to cancellation working with small values (sumSquared almost equals sum*sum/n)
	//so we use Welfords Method
	var add,remove;
	remove=function(){throw new Error("not yet implemented");};
	if(!attr){
		add=function(c,r){return wellford(c,(+r||0));};
	}
	else{
		add=function(c,r){return wellford(c,(+r[attr]||0));};
	}
	return new XaAggregator(add,remove,
		function(){
			return {
				sum:0,
				len:0,
				mean:0,
				s:0
			}
		},
		function(){return getEstimatorsWelford(this.value)}
	);
}

function addCountUnique(c,v){
	var i=c.seen.get(v);
	if(typeof i!=="undefined"){
		c.result[i][1]++;
	}
	else{
		//push returns length, so we set the index of the resultarray in the map
		c.seen.set(v,c.result.push([v,1])-1);
	}
	return c;
}
function removeCountUnique(c,v){
	var i=c.seen.get(v);
	if(typeof i!=="undefined"){
		c.result[i][1]--;
		if(c.result[i][1]<1){
			c.seen.delete(v);
			c.result.splice(i, 1);
			c.seen.forEach(function(value,key){
				//reset indices for all elements in map
				if(value>=i){
					c.seen.set(key,value-1);
				}
			});
		}
	}
	else{
		//element was not added so no remove!
	}
	return c;
}
function initCountUnique(){
	return {
		seen:new Map(), //map with indexes to result [value,result.indexOf(value)]
		result:[] //result array  with as element [value, count]
	}
}
function countUnique(attr){
	var add,remove;
	if(!attr){
		add=addCountUnique;
		remove=removeCountUnique;
	}
	else{
		add=function(c,r){return addCountUnique(c,r[attr]);};
		remove=function(c,r){return removeCountUnique(c,r[attr]);};
	}
	return new XaAggregator(
		add,
		remove,
		initCountUnique,
		function(){
			return this.value.result.length;
		}
	);
}

function listValues(attr,options){
	var add,
		remove,
		sep=', ',
		undefVal="[[undefined]]",
		emptyVal="[[empty]]";
	if(arguments.length===0||typeof attr==="object"){
		add=addCountUnique;
		remove=removeCountUnique;
		options=(typeof attr==="object"?attr:{});
	}
	else{
		add=function(c,r){return addCountUnique(c,r[attr]);};
		remove=function(c,r){return removeCountUnique(c,r[attr]);};
		options=options||{};
	}
	sep=options.seperator||sep;
	undefVal=options.undefinedValue||undefVal;
	emptyVal=options.emptyValue||emptyVal;
	return new XaAggregator(
		add,
		remove,
		initCountUnique,
		function(){
			return this.value.result.map(function(x){
				if(typeof x[0]==="undefined"){
					return undefVal;
				}
				else if(x[0]===""){
					return emptyVal;
				}
				else{
					return x[0];
				}
			}).join(sep);
		}
	);
}

function createAggregator(add,remove,initial,get){
	return new XaAggregator(add,remove,initial,get);
}

var aggregate=createAggregator;
aggregate.create=createAggregator;
aggregate.count=count;
aggregate.countUnique=countUnique;
aggregate.listValues=listValues;
aggregate.sum=sum;
aggregate.average=average;
aggregate.standardDeviation=simpleStats;

var _xhrObject=(function () { // Factory method.
		if(typeof document !== "undefined"){
			var methods = [
				function () {
					return new XMLHttpRequest();
				},
				function () {
					return new window.ActiveXObject('Msxml2.XMLHTTP');
				},
				function () {
					return new window.ActiveXObject('Microsoft.XMLHTTP');
				}
			];
			for (var i = 0, len = methods.length; i < len; i++) {
				try {
					methods[i]();
				} catch (e) {
					continue;
				}
				// If we reach this point, method[i] worked.
				// Memoize the method. by storing it in the variable
				return methods[i];
			}
			// If we reach this point, none of the methods worked.
			throw new Error('AjaxHandler: Could not create an XHR object.');
		}
		else{
			return function(){return false;};
		}
	})(),
	_statusCodeRanges=function(statusCode){
		var ranges=["1xx Informational responses","2xx Success","3xx Redirection","4xx Client errors","5xx Server errors"],
			unknown="?xx Unknown HTTPCode-range",
			range=Math.floor(statusCode/100)-1;
		if(range>=0&&range<ranges.length){
			return ranges[range];
		}
		return unknown+" ("+statusCode+")";
	},
	_statusCodesDetails={"200":"ok","304":"Not Modified (does NOT count as success!)","400":"bad request","401":"authentication needed",
		"403":"unauthorized (no auth needed)","404":"not found","414":"uri to long","429":"too many requests",
		"500":"internal server error","503":"service unavailable (try again)"};
	//not used may be usefull?
	function getAbsoluteURL(url,base_url) {
		var doc      = document
			, old_base = doc.getElementsByTagName('base')[0]
			, old_href = old_base && old_base.href
			, doc_head = doc.head || doc.getElementsByTagName('head')[0]
			, our_base = old_base || doc_head.appendChild(doc.createElement('base'))
			, resolver = doc.createElement('a')
			, resolved_url;
		our_base.href = base_url || '';
		resolver.href = url;
		resolved_url  = resolver.href; // browser magic at work here

		if (old_base) old_base.href = old_href;
		else doc_head.removeChild(our_base);
		return resolved_url;
	}
	function xassistAjax(url,opts){
		var _handler=new AJAXHandler(url,opts);
		var me;
		me={
			on:function(event,cb,thisArg){
				if(event==="success"){
					_handler.addSuccessHandler(cb,thisArg);
				}
				else if(event==="fail"){
					_handler.addFailHandler(cb,thisArg);
				}
				else if(event==="progress"){
					_handler.addProgressHandler(cb,thisArg);
				}
				else if(event==="loadEnd"){
					_handler.addAlwaysHandler(cb,thisArg);
				}
				else{
					throw new ReferenceError("event was not registerd")
				}
				return me;
			},
			success:function(cb,thisArg){
				_handler.addSuccessHandler(cb,thisArg);
				return me;
			},
			fail:function(cb,thisArg){
				_handler.addFailHandler(cb,thisArg);
				return me;
			},
			always:function(cb,thisArg){
				_handler.addAlwaysHandler(cb,thisArg);
				return me;
			},
			onProgress:function(cb,thisArg){
				_handler.addProgressHandler(cb,thisArg);
				return me;
			},
			getResponse:function(){return _handler.xhr.response;},
			getHTTPCode:function(detail){
				//detail is default true
				detail=(typeof detail==="undefined")||!!detail;
				if(detail){
					return _handler.detailedStatus();
				}
				//else
				return _handler.xhr.status;
			},
			_getHandler:function(){ return _handler},
			_getXHRObject:function(){ return _handler.xhr}
		};
		return me;
	}
	
	function AJAXHandler(url,opts){
		var _responseTypes=["text"/*,"arraybuffer","blob","document"*/,"json"];
		this.callbacks={
			success:[],
			fail:[],
			always:[],
			progress:[]
		};
		if(typeof opts==="undefined"){
			opts={};
		}
		this.url=url;
		this.method= ((opts.method&&opts.method==="POST")?"POST":"GET");
		
		this.done=false;
		this.success=false;
		this.xhr=_xhrObject();
		//this does not work in IE11 xhr.responseType does nothing, but chrome works fine
		this.responseType=_responseTypes[_responseTypes.indexOf(opts.type)]||_responseTypes[0];
		this.postVars=opts.data||null;
		
		this.init();
	}
	AJAXHandler.prototype.addSuccessHandler=function(callback,thisArg){
		if(!thisArg){
			thisArg=this.xhr;
		}
		//check if document state is complete
		if (this.done&&this.success){
			
			callback.apply(thisArg,this.eventDetails);
		}
		else{
			//add to executionList;
			this.callbacks.success.push([callback,thisArg]);
			
		}
	};
	AJAXHandler.prototype.addFailHandler=function(callback,thisArg){
		if(!thisArg){
			thisArg=this.xhr;
		}
		//check if document state is complete
		if (this.done&&!this.success){
			
			callback.apply(thisArg,this.eventDetails);
		}
		else{
			//add to executionList;
			this.callbacks.fail.push([callback,thisArg]);
			
		}
	};
	AJAXHandler.prototype.addAlwaysHandler=function(callback,thisArg){
		if(!thisArg){
			thisArg=this.xhr;
		}
		//check if document state is complete
		if (this.done){
			
			callback.apply(thisArg,this.eventDetails);
		}
		else{
			//add to executionList;
			this.callbacks.always.push([callback,thisArg]);
			
		}
	};
	AJAXHandler.prototype.addProgressHandler=function(callback,thisArg){
		if(!thisArg){
			thisArg=this.xhr;
		}
		//check if document state is complete
		if (this.done){
			
			//callback.apply(thisArg,this.eventDetails);
		}
		else{
			//add to executionList;
			this.callbacks.progress.push([callback,thisArg]);
			
		}
	};
	AJAXHandler.prototype.removeHandlers=function(){
		this.callbacks={
			success:[],
			fail:[],
			always:[],
			progress:[]
		};
	};
	AJAXHandler.prototype.detailedStatus=function(){
		var result=this.xhr.status+" "+_statusCodeRanges(this.xhr.status);
		if(_statusCodesDetails.hasOwnProperty(this.xhr.status)){
			result+="-"+_statusCodesDetails[this.xhr.status];
		}
		return result;
	};
	AJAXHandler.prototype.init=function () {
		this.xhr.addEventListener("progress", this.updateProgress.bind(this));
		this.xhr.open(this.method, this.url, true); //true for async
		/*TO DO does not work for IE better testing needed for chrome eg json with pure html page=> load error?*/
		//this.xhr.responseType =this.responseType;
		/*
		Setting the value of responseType to "document" is ignored if done in a  Worker environment. 
		When setting responseType to a particular value, the author should make sure that the server is actually 
		sending a response compatible to that format. If the server returns data that is not compatible to the responseType that was set, 
		the value of response will be null. Also, setting responseType for synchronous requests will throw an InvalidAccessError exception.
		ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType */
		this.xhr.onreadystatechange = this.readyStateEvent.bind(this);
		this.xhr.send(this.postVars);
	};
	
	AJAXHandler.prototype.updateProgress=function(event){
		this.executeHandlers(['progress'],[event]);
	};
	AJAXHandler.prototype.getAbsoluteURL=function(){
		return getAbsoluteURL(this.url);
	};
	AJAXHandler.prototype.readyStateEvent=function(){
		var contentType;
		if (this.xhr.readyState === 2){
			//setContentType
			contentType=this.xhr.getResponseHeader("content-type").split('/');
			this.contenType={
				type:contentType[0],
				subType:contentType[1]
			};
			return;
		}
		else if (this.xhr.readyState !== 4){
			return;
		}
		//else equals 4
		this.eventDetails=[this.xhr.response,this.detailedStatus(),this.xhr,this];
		this.done=true;
		
		if(this.xhr.status >= 200 && this.xhr.status<300){
			this.success=true;
			this.eventDetails[0]=this.parseType(this.eventDetails[0]);
		}
		if(this.success){
			//success
			this.executeHandlers(['success','always'],this.eventDetails);
		}
		else{
			//fail
			this.executeHandlers(['fail','always'],this.eventDetails);
		}
		this.removeHandlers();
	};
	AJAXHandler.prototype.parseType=function(response){
		//this function may adapt the success outcome
		var result;
		if (this.responseType==="json"){
			try{
				result=JSON.parse(response);
			}
			catch(err){
				//parsing was not possible
				this.success=false;
				result="Problem parsing JSON: partial response: "+response.substring(1, 157)+"...";
			}
		}
		else{
			result=response;
		}
		return result;
	};
	AJAXHandler.prototype.executeHandlers=function (types,event) {
		var i,l;
		for(i=0, l=types.length;i<l;i++){
			if(this.callbacks.hasOwnProperty(types[i])){
				this.callbacks[types[i]].forEach(function(cb){
					cb[0].apply(cb[1],event);
				});
			}
		}
	};
/*test
after test no memoryleaks found onreadystatechange is garbage collected!

var a=$b.ajax("nieuwsblad.be")
	.success(function(){
		console.log('success');
		console.log(arguments)
		console.log(this);
	})
	.fail(function(){
		console.log('fail');
		console.log(arguments)
		console.log(this);
	})
	.always(function(){
		console.log('always');
		console.log(arguments)
		console.log(this);
	});
var b=setTimeout(function(){
    a.success(function(){
			console.log('success2');
			console.log(arguments)
			console.log(this);
		})
		.fail(function(){
			console.log('fail2');
			console.log(arguments)
			console.log(this);
		})
		.always(function(){
			console.log('always2');
			console.log(arguments)
			console.log(this);
		});
}, 2000);

*/

function version$1(){return version;}

exports.version = version$1;
exports.id = id;
exports.ready = ready;
exports.template = template;
exports.array = array;
exports.EventDispatcher = EventDispatcher;
exports.object = object;
exports.csv = csv;
exports.date = date;
exports.dom = dom;
exports.aggregate = aggregate;
exports.ajax = xassistAjax;

Object.defineProperty(exports, '__esModule', { value: true });

})));
