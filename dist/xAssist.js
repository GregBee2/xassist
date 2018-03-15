/**
* @preserve
* https://github.com/GregBee2/xassist#readme Version 0.6.20.
*  Copyright 2018 Gregory Beirens.
*  Created on Thu, 15 Mar 2018 13:37:24 GMT.
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.xa = global.xa || {})));
}(this, (function (exports) { 'use strict';

var version = "0.6.20";

var idSeed=Math.round(Math.random()*(1000000)),
	DOMContentLoadedEvent,
	readyCallBacks=[],
	isReady=false;
document.addEventListener( "DOMContentLoaded", readyHandler,{once:true});
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

function EventDispatcher(me){
	if ( !(this instanceof EventDispatcher) ){
		return new EventDispatcher();
	}
	this._parent=me;
	this._events={};
}

EventDispatcher.prototype.registerEvent=function(eventName,defaultThis){
	if(!this.hasEvent(eventName)){
		this._events[eventName]={
			thisArg:defaultThis||this._parent,
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

function version$1(){return version;}

exports.version = version$1;
exports.id = id;
exports.ready = ready;
exports.template = template;
exports.array = array;
exports.EventDispatcher = EventDispatcher;
exports.object = object;
exports.csv = csv;

Object.defineProperty(exports, '__esModule', { value: true });

})));
